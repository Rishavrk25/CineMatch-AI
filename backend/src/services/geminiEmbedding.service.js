import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

const PINECONE_DIMENSION = 1024;

/**
 * Calls Google GenAI API to generate embedding for a single text.
 * @param {string} text 
 * @param {string} taskType - 'RETRIEVAL_DOCUMENT' or 'RETRIEVAL_QUERY'
 * @returns {Promise<number[]>} 1024-dimensional float array
 */
export async function generateEmbedding(text, taskType = 'RETRIEVAL_DOCUMENT') {
  if (!text || typeof text !== 'string' || !text.trim()) {
    throw new Error('Cannot embed empty or invalid text');
  }

  if (!env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not configured');
  }

  const cleanText = text.trim().slice(0, 8000); // Guard against token limits
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_EMBEDDING_MODEL}:embedContent?key=${env.GEMINI_API_KEY}`;

  const payload = {
    content: { parts: [{ text: cleanText }] },
    taskType,
    outputDimensionality: PINECONE_DIMENSION
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(15000)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`Gemini Embedding API failed (${response.status}): ${errorData.error?.message || response.statusText}`);
  }

  const data = await response.json();
  const vector = data.embedding?.values;

  if (!vector || !Array.isArray(vector)) {
    throw new Error('Invalid embedding vector returned from Gemini API');
  }

  if (vector.length !== PINECONE_DIMENSION) {
    throw new Error(`Embedding vector length ${vector.length} does not match expected dimension ${PINECONE_DIMENSION}`);
  }

  return vector;
}

/**
 * Generate embedding for a movie canonical document.
 */
export async function generateMovieEmbedding(movieDocument) {
  return generateEmbedding(movieDocument, 'RETRIEVAL_DOCUMENT');
}

/**
 * Generate embedding for a user query.
 */
export async function generateQueryEmbedding(userQuery) {
  return generateEmbedding(userQuery, 'RETRIEVAL_QUERY');
}

/**
 * Embed movies in batches with rate limit pacing and retry logic.
 */
export async function embedMoviesInBatch(movieDocuments, onProgress = null) {
  const embeddings = [];
  for (let i = 0; i < movieDocuments.length; i++) {
    const doc = movieDocuments[i];
    let retries = 0;
    let vector = null;

    while (!vector && retries < 3) {
      try {
        vector = await generateMovieEmbedding(doc.text);
      } catch (err) {
        retries++;
        logger.warn(`Embedding failed for movie ${doc.id} (attempt ${retries}): ${err.message}`);
        await new Promise(r => setTimeout(r, retries * 1500));
      }
    }

    if (!vector) {
      throw new Error(`Failed to embed movie ${doc.id} after 3 attempts`);
    }

    embeddings.push({ id: doc.id, values: vector, metadata: doc.metadata });

    if (onProgress) {
      onProgress(i + 1, movieDocuments.length);
    }

    // Small delay to comfortably stay within API rate limit quotas
    await new Promise(r => setTimeout(r, 60));
  }

  return embeddings;
}
