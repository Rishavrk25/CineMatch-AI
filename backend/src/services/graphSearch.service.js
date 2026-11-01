import neo4j from 'neo4j-driver';
import { getNeo4jSession } from '../config/neo4j.js';
import { logger } from '../utils/logger.js';

/**
 * Normalizes graph match count to a [0, 1] range using sigmoid / saturation curve.
 */
function normalizeGraphScore(rawScore) {
  if (!rawScore || rawScore <= 0) return 0;
  // Saturation formula: score / (score + 5)
  return Math.min(1, Math.round((rawScore / (rawScore + 5)) * 1000) / 1000);
}

/**
 * Searches the Neo4j Knowledge Graph for movies matching multi-dimensional relational criteria.
 * 
 * @param {Object} params
 * @param {string[]} [params.genres=[]]
 * @param {string[]} [params.actors=[]]
 * @param {string[]} [params.directors=[]]
 * @param {string[]} [params.keywords=[]]
 * @param {string[]} [params.likedMovieIds=[]]
 * @param {string[]} [params.exclusionIds=[]]
 * @param {number} [params.minYear]
 * @param {number} [params.maxYear]
 * @param {number} [params.limit=30]
 * @returns {Promise<Array<{ movieId: string, graphScore: number, evidence: string[], metadata: Object, source: string }>>}
 */
export async function searchGraphMovies({
  genres = [],
  actors = [],
  directors = [],
  keywords = [],
  likedMovieIds = [],
  exclusionIds = [],
  minYear = null,
  maxYear = null,
  limit = 30
}) {
  const session = getNeo4jSession();
  if (!session) {
    logger.warn('Neo4j session unavailable. Returning empty graph candidates.');
    return [];
  }

  try {
    const cypher = `
      // Match candidate movies and compute weighted graph connections
      MATCH (m:Movie)
      WHERE NOT m.id IN $exclusionIds
        AND ($minYear IS NULL OR m.releaseYear >= $minYear)
        AND ($maxYear IS NULL OR m.releaseYear <= $maxYear)

      OPTIONAL MATCH (d:Director)-[:DIRECTED]->(m)
      WHERE toLower(d.name) IN $directors

      OPTIONAL MATCH (a:Actor)-[:ACTED_IN]->(m)
      WHERE toLower(a.name) IN $actors

      OPTIONAL MATCH (m)-[:IN_GENRE]->(g:Genre)
      WHERE toLower(g.name) IN $genres

      OPTIONAL MATCH (m)-[:HAS_KEYWORD]->(k:Keyword)
      WHERE toLower(k.name) IN $keywords

      // Connections to previously liked movies (shared director or actor)
      OPTIONAL MATCH (m)<-[:DIRECTED]-(sharedD:Director)-[:DIRECTED]->(likedM:Movie)
      WHERE likedM.id IN $likedMovieIds AND m.id <> likedM.id

      OPTIONAL MATCH (m)<-[:ACTED_IN]-(sharedA:Actor)-[:ACTED_IN]->(likedM2:Movie)
      WHERE likedM2.id IN $likedMovieIds AND m.id <> likedM2.id

      WITH m,
           collect(DISTINCT d.name) AS matchedDirectors,
           collect(DISTINCT a.name) AS matchedActors,
           collect(DISTINCT g.name) AS matchedGenres,
           collect(DISTINCT k.name) AS matchedKeywords,
           collect(DISTINCT sharedD.name) AS sharedDirectorsWithLiked,
           collect(DISTINCT sharedA.name) AS sharedActorsWithLiked

      // Compute raw relational points
      WITH m,
           matchedDirectors, matchedActors, matchedGenres, matchedKeywords,
           sharedDirectorsWithLiked, sharedActorsWithLiked,
           (size(matchedDirectors) * 4.0) +
           (size(matchedActors) * 3.0) +
           (size(matchedGenres) * 1.5) +
           (size(matchedKeywords) * 1.0) +
           (size(sharedDirectorsWithLiked) * 3.5) +
           (size(sharedActorsWithLiked) * 2.5) AS rawScore

      WHERE rawScore > 0

      RETURN m.id AS movieId,
             m.title AS title,
             m.releaseYear AS releaseYear,
             m.voteAverage AS voteAverage,
             m.voteCount AS voteCount,
             rawScore,
             matchedDirectors,
             matchedActors,
             matchedGenres,
             matchedKeywords,
             sharedDirectorsWithLiked,
             sharedActorsWithLiked
      ORDER BY rawScore DESC, m.voteAverage DESC
      LIMIT $limit
    `;

    const result = await session.run(cypher, {
      genres: (genres || []).map(s => String(s).toLowerCase()),
      actors: (actors || []).map(s => String(s).toLowerCase()),
      directors: (directors || []).map(s => String(s).toLowerCase()),
      keywords: (keywords || []).map(s => String(s).toLowerCase()),
      likedMovieIds: (likedMovieIds || []).map(String),
      exclusionIds: (exclusionIds || []).map(String),
      minYear: typeof minYear === 'number' ? minYear : null,
      maxYear: typeof maxYear === 'number' ? maxYear : null,
      limit: neo4j.int ? neo4j.int(limit) : limit
    });

    const candidates = [];
    for (const record of result.records) {
      const movieId = record.get('movieId');
      const rawScore = record.get('rawScore');
      const matchedDirectors = record.get('matchedDirectors') || [];
      const matchedActors = record.get('matchedActors') || [];
      const matchedGenres = record.get('matchedGenres') || [];
      const matchedKeywords = record.get('matchedKeywords') || [];
      const sharedDirectors = record.get('sharedDirectorsWithLiked') || [];
      const sharedActors = record.get('sharedActorsWithLiked') || [];

      // Compile human-readable relationship evidence
      const evidence = [];
      if (matchedDirectors.length > 0) evidence.push(`Directed by ${matchedDirectors.join(', ')}`);
      if (matchedActors.length > 0) evidence.push(`Stars ${matchedActors.join(', ')}`);
      if (matchedGenres.length > 0) evidence.push(`Matches genres: ${matchedGenres.join(', ')}`);
      if (matchedKeywords.length > 0) evidence.push(`Thematic keywords: ${matchedKeywords.join(', ')}`);
      if (sharedDirectors.length > 0) evidence.push(`Shares director (${sharedDirectors.join(', ')}) with movies you liked`);
      if (sharedActors.length > 0) evidence.push(`Shares cast (${sharedActors.join(', ')}) with movies you liked`);

      candidates.push({
        movieId: String(movieId),
        graphScore: normalizeGraphScore(rawScore),
        rawScore,
        evidence,
        metadata: {
          title: record.get('title'),
          releaseYear: record.get('releaseYear'),
          voteAverage: record.get('voteAverage') || 0,
          voteCount: record.get('voteCount') || 0
        },
        source: 'graph'
      });
    }

    return candidates;
  } catch (error) {
    logger.error('Neo4j graph search failed:', error.message);
    throw error;
  } finally {
    await session.close();
  }
}

/**
 * Finds graph-connected movies for a specific movie (similar by shared director, cast, and genres).
 */
export async function getGraphConnectedMovies(movieId, limit = 10) {
  const session = getNeo4jSession();
  if (!session) return [];

  try {
    const cypher = `
      MATCH (target:Movie { id: $movieId })
      MATCH (other:Movie)
      WHERE other.id <> target.id

      OPTIONAL MATCH (target)<-[:DIRECTED]-(d:Director)-[:DIRECTED]->(other)
      OPTIONAL MATCH (target)<-[:ACTED_IN]-(a:Actor)-[:ACTED_IN]->(other)
      OPTIONAL MATCH (target)-[:IN_GENRE]->(g:Genre)<-[:IN_GENRE]-(other)

      WITH other,
           collect(DISTINCT d.name) AS sharedDirectors,
           collect(DISTINCT a.name) AS sharedActors,
           collect(DISTINCT g.name) AS sharedGenres

      WITH other, sharedDirectors, sharedActors, sharedGenres,
           (size(sharedDirectors) * 4.0) +
           (size(sharedActors) * 2.5) +
           (size(sharedGenres) * 1.0) AS connectionWeight

      WHERE connectionWeight > 0
      RETURN other.id AS movieId,
             other.title AS title,
             other.releaseYear AS releaseYear,
             other.voteAverage AS voteAverage,
             sharedDirectors,
             sharedActors,
             sharedGenres,
             connectionWeight
      ORDER BY connectionWeight DESC, other.voteAverage DESC
      LIMIT $limit
    `;

    const result = await session.run(cypher, {
      movieId: String(movieId),
      limit: neo4j.int ? neo4j.int(limit) : limit
    });

    return result.records.map(rec => ({
      movieId: String(rec.get('movieId')),
      title: rec.get('title'),
      releaseYear: rec.get('releaseYear'),
      voteAverage: rec.get('voteAverage'),
      sharedDirectors: rec.get('sharedDirectors'),
      sharedActors: rec.get('sharedActors'),
      sharedGenres: rec.get('sharedGenres'),
      connectionWeight: rec.get('connectionWeight')
    }));
  } finally {
    await session.close();
  }
}
