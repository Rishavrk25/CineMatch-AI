import { getPineconeIndex } from '../config/pinecone.js';
import { generateQueryEmbedding } from './geminiEmbedding.service.js';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

/**
 * Searches Pinecone for semantically similar movies using cosine similarity.
 * 
 * @param {Object} options
 * @param {string} [options.query] - Raw text query from user
 * @param {number[]} [options.queryEmbedding] - Precomputed embedding vector
 * @param {number} [options.topK=30] - Number of vector candidates to retrieve
 * @param {Object} [options.filters] - Pinecone metadata filters (e.g., { genres: { $in: ['Action'] } })
 * @param {string[]} [options.exclusionIds=[]] - Movie IDs to exclude
 * @returns {Promise<Array<{ movieId: string, semanticScore: number, metadata: Object, source: string }>>}
 */
export async function searchSimilarMovies({
  query = null,
  queryEmbedding = null,
  topK = 30,
  filters = null,
  exclusionIds = []
}) {
  const index = getPineconeIndex();
  if (!index) {
    logger.warn('Pinecone index is not available. Returning empty candidates.');
    return [];
  }

  let vector = queryEmbedding;
  if (!vector && query) {
    vector = await generateQueryEmbedding(query);
  }

  if (!vector || !Array.isArray(vector)) {
    throw new Error('Valid query embedding or query text is required for vector search');
  }

  const queryRequest = {
    vector,
    topK: Math.min(topK + (exclusionIds?.length || 0), 100),
    includeMetadata: true
  };

  if (filters && Object.keys(filters).length > 0) {
    queryRequest.filter = filters;
  }

  const targetNamespace = env.PINECONE_NAMESPACE ? index.namespace(env.PINECONE_NAMESPACE) : index;

  try {
    const response = await targetNamespace.query(queryRequest);
    const matches = response.matches || [];

    const exclusionSet = new Set((exclusionIds || []).map(String));

    const candidates = [];
    for (const match of matches) {
      const movieId = String(match.id);
      if (exclusionSet.has(movieId)) continue;

      // Cosine similarity in Pinecone ranges [-1, 1], normalized to [0, 1]
      const rawScore = typeof match.score === 'number' ? match.score : 0;
      const normalizedScore = Math.max(0, Math.min(1, (rawScore + 1) / 2));

      candidates.push({
        movieId,
        semanticScore: normalizedScore,
        rawCosineScore: rawScore,
        metadata: {
          title: match.metadata?.title || 'Unknown Title',
          releaseYear: match.metadata?.releaseYear || null,
          genres: Array.isArray(match.metadata?.genres) ? match.metadata.genres : [],
          voteAverage: match.metadata?.voteAverage || 0,
          originalLanguage: match.metadata?.originalLanguage || 'en'
        },
        source: 'vector'
      });

      if (candidates.length >= topK) break;
    }

    return candidates;
  } catch (error) {
    logger.error('Pinecone vector search failed:', error.message);
    throw error;
  }
}
