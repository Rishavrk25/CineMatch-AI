import { searchSimilarMovies } from './vectorSearch.service.js';
import { searchGraphMovies } from './graphSearch.service.js';
import { rankCandidates } from './ranking.service.js';
import { generateGroundedRecommendations } from './geminiGeneration.service.js';
import { getUserPreferences } from './preference.service.js';
import { getMovieById } from './movieCatalog.service.js';
import { logger } from '../utils/logger.js';

const KNOWN_GENRES = [
  'Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary',
  'Drama', 'Family', 'Fantasy', 'History', 'Horror', 'Music',
  'Mystery', 'Romance', 'Science Fiction', 'Sci-Fi', 'Thriller', 'War', 'Western'
];

// Predefined director aliases for instant graph traversal
const TOP_DIRECTORS = [
  { name: 'Christopher Nolan', aliases: ['nolan', 'christopher nolan'] },
  { name: 'David Fincher', aliases: ['fincher', 'david fincher'] },
  { name: 'Quentin Tarantino', aliases: ['tarantino', 'quentin tarantino'] },
  { name: 'Steven Spielberg', aliases: ['spielberg', 'steven spielberg'] },
  { name: 'Martin Scorsese', aliases: ['scorsese', 'martin scorsese'] },
  { name: 'Stanley Kubrick', aliases: ['kubrick', 'stanley kubrick'] },
  { name: 'James Cameron', aliases: ['cameron', 'james cameron'] },
  { name: 'Denis Villeneuve', aliases: ['villeneuve', 'denis villeneuve'] },
  { name: 'Ridley Scott', aliases: ['ridley scott'] },
  { name: 'Alfred Hitchcock', aliases: ['hitchcock', 'alfred hitchcock'] },
  { name: 'Peter Jackson', aliases: ['peter jackson'] },
  { name: 'George Lucas', aliases: ['george lucas'] },
  { name: 'Wes Anderson', aliases: ['wes anderson'] },
  { name: 'Guillermo del Toro', aliases: ['del toro', 'guillermo del toro'] }
];

/**
 * Extracts explicit constraints and intents from natural language query.
 */
export function parseQueryConstraints(queryText, explicitFilters = {}) {
  // Normalize hyphens and common abbreviations
  const normalizedQuery = (queryText || '')
    .toLowerCase()
    .replace(/science-fiction/g, 'science fiction')
    .replace(/sci-fi/g, 'science fiction')
    .replace(/\bsci fi\b/g, 'science fiction');
  const query = (queryText || '').toLowerCase();

  const extracted = {
    genres: [...(explicitFilters.genres || [])],
    excludedGenres: [...(explicitFilters.excludedGenres || [])],
    minYear: explicitFilters.minYear ?? null,
    maxYear: explicitFilters.maxYear ?? null,
    directors: [],
    actors: [],
    keywords: []
  };

  // Detect director mentions (e.g., "Nolan", "Fincher", "directed by Christopher Nolan")
  for (const dir of TOP_DIRECTORS) {
    if (dir.aliases.some(alias => new RegExp(`\\b${alias}\\b`, 'i').test(query))) {
      extracted.directors.push(dir.name);
    }
  }

  // Also match generic "directed by <Name>" pattern
  const directedByMatch = query.match(/(?:directed by|director)\s+([a-z\s]+?)(?:,|\.|\band\b|$)/i);
  if (directedByMatch) {
    const rawName = directedByMatch[1].trim();
    if (rawName && !extracted.directors.some(d => d.toLowerCase() === rawName.toLowerCase())) {
      extracted.directors.push(rawName);
    }
  }

  // 1. Detect negative genre exclusions (e.g. "avoid horror", "no comedy", "without romance", "exclude action")
  const negativePatterns = [
    /(?:avoid|no|without|exclude|except|not)\s+([a-z\s-]+?)(?:,|\.|\band\b|$)/gi,
    /skip\s+([a-z\s-]+?)(?:,|\.|\band\b|$)/gi
  ];

  for (const pattern of negativePatterns) {
    let match;
    while ((match = pattern.exec(query)) !== null) {
      const phrase = match[1].trim();
      for (const g of KNOWN_GENRES) {
        if (phrase.includes(g.toLowerCase())) {
          extracted.excludedGenres.push(g === 'Sci-Fi' ? 'Science Fiction' : g);
        }
      }
    }
  }

  // 2. Detect positive genre mentions (if not in negative list)
  for (const g of KNOWN_GENRES) {
    const gLower = g.toLowerCase();
    const targetGenre = g === 'Sci-Fi' ? 'Science Fiction' : g;
    if (normalizedQuery.includes(gLower) && !extracted.excludedGenres.includes(targetGenre)) {
      if (!extracted.genres.includes(targetGenre)) {
        extracted.genres.push(targetGenre);
      }
    }
  }

  // 3. Detect release year constraints
  // e.g. "avoid/exclude ... before 2010" => minYear = 2010
  const avoidBeforeMatch = query.match(/(?:avoid|exclude|no|not|without)[\s\w,]+?(?:movies\s+)?(?:released\s+)?before\s+(\d{4})/i);
  if (avoidBeforeMatch && !extracted.minYear) {
    extracted.minYear = parseInt(avoidBeforeMatch[1], 10);
  }

  // e.g. "after 2010", "post 2010", "since 2010" => minYear = 2010
  const afterMatch = query.match(/(?:after|post|since|newer than)\s+(\d{4})/i);
  if (afterMatch && !extracted.minYear) {
    extracted.minYear = parseInt(afterMatch[1], 10);
  }

  // e.g. "before 2010" when not part of an avoid clause
  if (!avoidBeforeMatch) {
    const beforeMatch = query.match(/(?:before|pre|prior to|older than)\s+(\d{4})/i);
    if (beforeMatch && !extracted.maxYear) {
      extracted.maxYear = parseInt(beforeMatch[1], 10);
    }
  }

  // Deduplicate genres
  extracted.genres = Array.from(new Set(extracted.genres));
  extracted.excludedGenres = Array.from(new Set(extracted.excludedGenres));

  return extracted;
}

/**
 * Executes the complete End-to-End Hybrid RAG Recommendation Pipeline.
 * 
 * @param {Object} options
 * @param {string} options.query - User natural-language request
 * @param {string|null} [options.userId=null] - Authenticated user ID (if any)
 * @param {Object} [options.filters={}] - Optional UI filters
 * @param {number} [options.limit=5] - Number of recommendations requested
 * @returns {Promise<Object>} Formatted recommendations response
 */
export async function getRecommendations({
  query,
  userId = null,
  filters = {},
  limit = 5
}) {
  const startTime = Date.now();
  logger.info(`Starting RAG recommendation pipeline for query: "${query}"`);

  // Step 1: Parse constraints and intent
  const parsedConstraints = parseQueryConstraints(query, filters);

  // Step 2: Fetch user preferences (taste profile, watched list)
  const preferences = await getUserPreferences(userId);

  // Step 3: Run Dual Retrieval in parallel (Pinecone vector search + Neo4j graph search)
  const vectorPromise = searchSimilarMovies({
    query,
    topK: 25,
    exclusionIds: filters.excludeWatched ? preferences.watchedIds : []
  }).catch(err => {
    logger.warn('Vector retrieval step failed, proceeding with graph only:', err.message);
    return [];
  });

  const graphPromise = searchGraphMovies({
    genres: parsedConstraints.genres,
    directors: parsedConstraints.directors,
    actors: parsedConstraints.actors,
    likedMovieIds: preferences.favoriteMovieIds,
    exclusionIds: [
      ...(filters.excludeWatched ? preferences.watchedIds : []),
      ...preferences.dislikedMovieIds
    ],
    minYear: parsedConstraints.minYear,
    maxYear: parsedConstraints.maxYear,
    limit: 25
  }).catch(err => {
    logger.warn('Graph retrieval step failed, proceeding with vector only:', err.message);
    return [];
  });

  const [vectorCandidates, graphCandidates] = await Promise.all([vectorPromise, graphPromise]);

  logger.info(`Retrieved ${vectorCandidates.length} vector candidates and ${graphCandidates.length} graph candidates.`);

  // Step 4: Hybrid candidate merging & deterministic ranking
  const rankedCandidates = rankCandidates({
    vectorCandidates,
    graphCandidates,
    constraints: {
      minYear: parsedConstraints.minYear,
      maxYear: parsedConstraints.maxYear,
      excludedGenres: parsedConstraints.excludedGenres,
      excludeWatched: filters.excludeWatched,
      watchedIds: preferences.watchedIds
    },
    preferences,
    topK: Math.max(limit * 2, 10)
  });

  // Attach full dataset facts (overview, directors, cast) to top candidates
  for (const c of rankedCandidates) {
    const fullMovie = getMovieById(c.movieId);
    if (fullMovie) {
      c.overview = fullMovie.overview;
      c.directors = fullMovie.directors || [];
      c.topCast = fullMovie.topCast || [];
      c.runtime = fullMovie.runtime;
    }
  }

  // Step 5: Synthesize Grounded Recommendations with Gemini
  const generationResult = await generateGroundedRecommendations({
    userQuery: query,
    candidates: rankedCandidates,
    constraints: parsedConstraints
  });

  // Step 6: Anti-Hallucination Output Validation & Canonical Data Replacement
  const candidateIdMap = new Map(rankedCandidates.map(c => [String(c.movieId), c]));
  const verifiedCards = [];

  for (const rec of generationResult.recommendations) {
    const verifiedCandidate = candidateIdMap.get(String(rec.movieId));
    if (!verifiedCandidate) {
      logger.warn(`Rejected hallucinated movie ID from LLM output: ${rec.movieId}`);
      continue;
    }

    const canonicalInfo = getMovieById(rec.movieId) || {};

    verifiedCards.push({
      movieId: String(rec.movieId),
      title: verifiedCandidate.title, // Trusted title from database
      releaseYear: verifiedCandidate.releaseYear,
      genres: verifiedCandidate.genres,
      voteAverage: verifiedCandidate.voteAverage,
      voteCount: canonicalInfo.voteCount || 0,
      runtime: canonicalInfo.runtime || null,
      overview: canonicalInfo.overview || '',
      directors: canonicalInfo.directors || [],
      topCast: canonicalInfo.topCast || [],
      reason: rec.reason,
      matchedThemes: rec.matchedThemes || verifiedCandidate.genres || [],
      graphEvidence: rec.graphEvidence?.length > 0 ? rec.graphEvidence : (verifiedCandidate.evidence || []),
      confidence: rec.confidence || 'high',
      posterUrl: canonicalInfo.posterUrl || `/api/movies/${rec.movieId}/poster`,
      scoreBreakdown: verifiedCandidate.scoreBreakdown,
      finalScore: verifiedCandidate.finalScore,
      sources: verifiedCandidate.sources
    });

    if (verifiedCards.length >= limit) break;
  }

  // If fewer than requested recommendations were returned by LLM, backfill from top ranked candidates
  if (verifiedCards.length < limit && rankedCandidates.length > 0) {
    for (const c of rankedCandidates) {
      if (verifiedCards.length >= limit) break;
      if (!verifiedCards.some(v => v.movieId === c.movieId)) {
        const canonicalInfo = getMovieById(c.movieId) || {};
        verifiedCards.push({
          movieId: String(c.movieId),
          title: c.title,
          releaseYear: c.releaseYear,
          genres: c.genres,
          voteAverage: c.voteAverage,
          voteCount: canonicalInfo.voteCount || 0,
          runtime: canonicalInfo.runtime || null,
          overview: canonicalInfo.overview || '',
          directors: canonicalInfo.directors || [],
          topCast: canonicalInfo.topCast || [],
          reason: c.evidence?.length > 0
            ? `Selected based on relational graph connections: ${c.evidence.join('. ')}.`
            : `Selected based on high semantic vector relevance score (${(c.semanticScore * 100).toFixed(0)}%).`,
          matchedThemes: c.genres || [],
          graphEvidence: c.evidence || [],
          posterUrl: canonicalInfo.posterUrl || `/api/movies/${c.movieId}/poster`,
          confidence: 'high',
          scoreBreakdown: c.scoreBreakdown,
          finalScore: c.finalScore,
          sources: c.sources
        });
      }
    }
  }

  const durationMs = Date.now() - startTime;
  logger.info(`RAG pipeline completed in ${durationMs}ms with ${verifiedCards.length} verified recommendations.`);

  return {
    success: true,
    query,
    summary: generationResult.summary,
    recommendations: verifiedCards,
    isFallback: generationResult.isFallback || false,
    appliedConstraints: parsedConstraints,
    retrievalStats: {
      vectorCandidatesCount: vectorCandidates.length,
      graphCandidatesCount: graphCandidates.length,
      rankedCandidatesCount: rankedCandidates.length,
      latencyMs: durationMs
    }
  };
}
