import { Router } from 'express';
import { checkMongoHealth } from '../config/mongodb.js';
import { checkNeo4jHealth } from '../config/neo4j.js';
import { checkPineconeHealth } from '../config/pinecone.js';
import { env } from '../config/env.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get(
  '/health',
  asyncHandler(async (req, res) => {
    const mongo = await checkMongoHealth();
    const neo4j = await checkNeo4jHealth();
    const pinecone = await checkPineconeHealth();

    const gemini = {
      status: env.hasGemini ? 'configured' : 'missing_key',
      embeddingModel: env.GEMINI_EMBEDDING_MODEL,
      generationModel: env.GEMINI_GENERATION_MODEL
    };

    const overallHealthy = true; // Server itself is running healthy

    res.status(200).json({
      success: true,
      service: 'CineMatch AI Backend API',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: env.NODE_ENV,
      status: overallHealthy ? 'healthy' : 'degraded',
      integrations: {
        mongodb: mongo,
        neo4j,
        pinecone,
        gemini
      }
    });
  })
);

export default router;
