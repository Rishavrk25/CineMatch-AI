import { logger } from '../utils/logger.js';

// Default hypothesis weights (configurable via options)
export const DEFAULT_WEIGHTS = {
  semantic: 0.60,
  graph: 0.20,
  rating: 0.10,
  preference: 0.10
};

/**
 * Normalizes movie vote_average (0 to 10 scale) to [0, 1] range.
 */
function normalizeRating(voteAverage) {
  if (typeof voteAverage !== 'number' || isNaN(voteAverage) || voteAverage <= 0) {
    return 0.5; // neutral baseline if unrated
  }
  return Math.max(0, Math.min(1, voteAverage / 10));
}

/**
 * Computes user preference alignment score [0, 1].
 */
function computePreferenceScore(movie, preferences = {}) {
  let score = 0.5; // neutral starting baseline
  const { favoriteGenres = [], favoriteMovieIds = [], dislikedMovieIds = [], preferredLanguages = [] } = preferences;

  // Genre match bonus
  if (movie.genres && Array.isArray(movie.genres) && favoriteGenres.length > 0) {
    const matchedCount = movie.genres.filter(g =>
      favoriteGenres.some(fg => fg.toLowerCase() === g.toLowerCase())
    ).length;
    if (matchedCount > 0) {
      score += Math.min(0.3, matchedCount * 0.15);
    }
  }

  // Language match
  if (movie.originalLanguage && preferredLanguages.length > 0) {
    if (preferredLanguages.includes(movie.originalLanguage)) {
      score += 0.1;
    } else {
      score -= 0.1;
    }
  }

  // Disliked movie penalty
  if (dislikedMovieIds.includes(String(movie.movieId))) {
    score -= 0.5;
  }

  // Clamped between 0 and 1
  return Math.max(0, Math.min(1, score));
}

/**
 * Merges vector candidates and graph candidates, applies negative constraints,
 * normalizes individual signals, and produces a ranked, diverse top-K candidate list.
 * 
 * @param {Object} params
 * @param {Array} params.vectorCandidates - Candidates from Pinecone
 * @param {Array} params.graphCandidates - Candidates from Neo4j
 * @param {Object} [params.constraints={}] - Hard user exclusions (minYear, maxYear, excludedGenres, excludedIds)
 * @param {Object} [params.preferences={}] - User preferences (favoriteGenres, favoriteMovieIds, etc.)
 * @param {Object} [params.weights=DEFAULT_WEIGHTS] - Custom ranking weights
 * @param {number} [params.topK=10] - Number of recommendations to return
 * @returns {Array<Object>} Sorted and scored candidates
 */
export function rankCandidates({
  vectorCandidates = [],
  graphCandidates = [],
  constraints = {},
  preferences = {},
  weights = DEFAULT_WEIGHTS,
  topK = 10
}) {
  const mergedMap = new Map();

  const {
    minYear = null,
    maxYear = null,
    excludedGenres = [],
    excludedIds = [],
    excludeWatched = false,
    watchedIds = []
  } = constraints;

  const excludedGenreSet = new Set((excludedGenres || []).map(g => String(g).toLowerCase()));
  const excludedIdSet = new Set([
    ...(excludedIds || []).map(String),
    ...(excludeWatched ? (watchedIds || []).map(String) : []),
    ...(preferences.dislikedMovieIds || []).map(String)
  ]);

  // 1. Process Vector Candidates
  for (const vc of vectorCandidates) {
    const id = String(vc.movieId);
    if (excludedIdSet.has(id)) continue;

    mergedMap.set(id, {
      movieId: id,
      title: vc.metadata?.title || 'Unknown',
      releaseYear: vc.metadata?.releaseYear || null,
      genres: vc.metadata?.genres || [],
      voteAverage: vc.metadata?.voteAverage || 0,
      originalLanguage: vc.metadata?.originalLanguage || 'en',
      semanticScore: vc.semanticScore || 0,
      graphScore: 0,
      evidence: [],
      sources: ['vector']
    });
  }

  // 2. Process & Merge Graph Candidates
  for (const gc of graphCandidates) {
    const id = String(gc.movieId);
    if (excludedIdSet.has(id)) continue;

    if (mergedMap.has(id)) {
      const existing = mergedMap.get(id);
      existing.graphScore = gc.graphScore || 0;
      existing.evidence = gc.evidence || [];
      if (!existing.sources.includes('graph')) {
        existing.sources.push('graph');
      }
    } else {
      mergedMap.set(id, {
        movieId: id,
        title: gc.metadata?.title || 'Unknown',
        releaseYear: gc.metadata?.releaseYear || null,
        genres: gc.metadata?.genres || [],
        voteAverage: gc.metadata?.voteAverage || 0,
        originalLanguage: gc.metadata?.originalLanguage || 'en',
        semanticScore: 0,
        graphScore: gc.graphScore || 0,
        evidence: gc.evidence || [],
        sources: ['graph']
      });
    }
  }

  // 3. Filter candidates by Hard Constraints
  const eligibleCandidates = [];
  for (const candidate of mergedMap.values()) {
    // Release year constraints
    if (minYear !== null && candidate.releaseYear && candidate.releaseYear < minYear) {
      continue;
    }
    if (maxYear !== null && candidate.releaseYear && candidate.releaseYear > maxYear) {
      continue;
    }

    // Excluded genres
    if (candidate.genres && candidate.genres.length > 0) {
      const hasExcludedGenre = candidate.genres.some(g => excludedGenreSet.has(String(g).toLowerCase()));
      if (hasExcludedGenre) continue;
    }

    eligibleCandidates.push(candidate);
  }

  // 4. Compute Final Weighted Score
  const wSemantic = weights.semantic ?? DEFAULT_WEIGHTS.semantic;
  const wGraph = weights.graph ?? DEFAULT_WEIGHTS.graph;
  const wRating = weights.rating ?? DEFAULT_WEIGHTS.rating;
  const wPref = weights.preference ?? DEFAULT_WEIGHTS.preference;

  for (const item of eligibleCandidates) {
    const ratingScore = normalizeRating(item.voteAverage);
    const prefScore = computePreferenceScore(item, preferences);

    const finalScore = (
      wSemantic * item.semanticScore +
      wGraph * item.graphScore +
      wRating * ratingScore +
      wPref * prefScore
    );

    item.ratingScore = ratingScore;
    item.preferenceScore = prefScore;
    item.finalScore = Math.round(finalScore * 1000) / 1000;

    item.scoreBreakdown = {
      semantic: `${(item.semanticScore * 100).toFixed(1)}% (wt: ${wSemantic})`,
      graph: `${(item.graphScore * 100).toFixed(1)}% (wt: ${wGraph})`,
      rating: `${(ratingScore * 100).toFixed(1)}% (wt: ${wRating})`,
      preference: `${(prefScore * 100).toFixed(1)}% (wt: ${wPref})`
    };
  }

  // 5. Sort by Final Score Descending
  eligibleCandidates.sort((a, b) => b.finalScore - a.finalScore);

  // 6. Diversity-aware selection (avoid franchise or single genre saturation)
  const selected = [];
  const genreCounts = new Map();

  for (const candidate of eligibleCandidates) {
    if (selected.length >= topK) break;

    // Check if dominant genre is over-represented (more than 40% of topK)
    const primaryGenre = candidate.genres[0] || 'Unknown';
    const currentCount = genreCounts.get(primaryGenre) || 0;
    const maxPerGenre = Math.max(3, Math.floor(topK * 0.45));

    if (currentCount >= maxPerGenre && eligibleCandidates.length > topK) {
      // Defer candidate to preserve diversity if we have plenty of alternatives
      continue;
    }

    genreCounts.set(primaryGenre, currentCount + 1);
    selected.push(candidate);
  }

  // If diversity filter left open slots, backfill with highest scoring remaining
  if (selected.length < topK) {
    for (const candidate of eligibleCandidates) {
      if (!selected.some(s => s.movieId === candidate.movieId)) {
        selected.push(candidate);
        if (selected.length >= topK) break;
      }
    }
  }

  return selected;
}

