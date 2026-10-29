import { Pinecone } from '@pinecone-database/pinecone';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

let pineconeClient = null;

export function getPineconeClient() {
  if (pineconeClient) return pineconeClient;

  if (!env.PINECONE_API_KEY) {
    logger.warn('PINECONE_API_KEY not configured. Vector search will be unavailable.');
    return null;
  }

  try {
    pineconeClient = new Pinecone({
      apiKey: env.PINECONE_API_KEY
    });
    return pineconeClient;
  } catch (error) {
    logger.error('Failed to initialize Pinecone client:', error.message);
    return null;
  }
}

export function getPineconeIndex() {
  const client = getPineconeClient();
  if (!client) return null;
  return client.index(env.PINECONE_INDEX_NAME);
}

export async function checkPineconeHealth() {
  const client = getPineconeClient();
  if (!client) {
    return {
      status: 'disconnected',
      configured: Boolean(env.PINECONE_API_KEY),
      indexName: env.PINECONE_INDEX_NAME
    };
  }

  try {
    const indexList = await client.listIndexes();
    const targetIndex = indexList.indexes?.find(idx => idx.name === env.PINECONE_INDEX_NAME);
    
    return {
      status: 'connected',
      configured: true,
      indexFound: Boolean(targetIndex),
      indexName: env.PINECONE_INDEX_NAME,
      dimension: targetIndex?.dimension,
      metric: targetIndex?.metric,
      state: targetIndex?.status?.state
    };
  } catch (err) {
    return {
      status: 'unhealthy',
      error: err.message,
      configured: true
    };
  }
}
