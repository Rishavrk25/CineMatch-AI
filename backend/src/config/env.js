import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend root if present
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const env = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  
  // Security
  JWT_SECRET: process.env.JWT_SECRET || 'dev_secret_key_change_in_production_min_32_chars',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  
  // MongoDB
  MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cinematch',
  
  // Neo4j
  NEO4J_URI: process.env.NEO4J_URI || 'bolt://localhost:7687',
  NEO4J_USERNAME: process.env.NEO4J_USERNAME || 'neo4j',
  NEO4J_PASSWORD: process.env.NEO4J_PASSWORD || '',
  
  // Pinecone
  PINECONE_API_KEY: process.env.PINECONE_API_KEY || '',
  PINECONE_INDEX_NAME: process.env.PINECONE_INDEX_NAME || 'cinematch-movies',
  PINECONE_NAMESPACE: process.env.PINECONE_NAMESPACE || 'movies',
  
  // Gemini
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  GEMINI_EMBEDDING_MODEL: process.env.GEMINI_EMBEDDING_MODEL || 'text-embedding-004',
  GEMINI_GENERATION_MODEL: process.env.GEMINI_GENERATION_MODEL || 'gemini-1.5-flash',
  
  // Status Helpers
  isProduction: process.env.NODE_ENV === 'production',
  hasMongoUri: Boolean(process.env.MONGODB_URI),
  hasNeo4j: Boolean(process.env.NEO4J_URI && process.env.NEO4J_PASSWORD),
  hasPinecone: Boolean(process.env.PINECONE_API_KEY),
  hasGemini: Boolean(process.env.GEMINI_API_KEY)
};

export function validateCoreEnv() {
  const missing = [];
  if (env.isProduction) {
    if (!process.env.JWT_SECRET) missing.push('JWT_SECRET');
    if (!process.env.MONGODB_URI) missing.push('MONGODB_URI');
  }
  return {
    valid: missing.length === 0,
    missing
  };
}
