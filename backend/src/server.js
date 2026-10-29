import app from './app.js';
import { env, validateCoreEnv } from './config/env.js';
import { connectMongoDB, closeMongoDB } from './config/mongodb.js';
import { closeNeo4j } from './config/neo4j.js';
import { logger } from './utils/logger.js';

const validation = validateCoreEnv();
if (!validation.valid) {
  logger.warn(`Missing recommended production environment variables: ${validation.missing.join(', ')}`);
}

// Attempt MongoDB connection on startup (non-blocking for development convenience)
connectMongoDB().catch(err => {
  logger.warn('Initial MongoDB connection failed. Will retry on request.', err.message);
});

const server = app.listen(env.PORT, () => {
  logger.info(`=========================================`);
  logger.info(`🎬 CineMatch AI Backend running on port ${env.PORT}`);
  logger.info(`🌍 Environment: ${env.NODE_ENV}`);
  logger.info(`🔗 Health Check: http://localhost:${env.PORT}/api/health`);
  logger.info(`=========================================`);
});

// Graceful shutdown
async function gracefulShutdown(signal) {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  server.close(async () => {
    logger.info('HTTP server closed');
    try {
      await closeMongoDB();
      await closeNeo4j();
      logger.info('Database connections closed cleanly');
      process.exit(0);
    } catch (err) {
      logger.error('Error during shutdown:', err);
      process.exit(1);
    }
  });

  // Force close after 10 seconds
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default server;
