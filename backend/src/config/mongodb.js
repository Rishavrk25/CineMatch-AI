import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

let isConnected = false;

export async function connectMongoDB() {
  if (isConnected) return mongoose.connection;
  if (!env.MONGODB_URI) {
    logger.warn('MONGODB_URI is not set. MongoDB operations will be disabled until configured.');
    return null;
  }

  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      autoIndex: true
    });
    isConnected = true;
    logger.info(`MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn.connection;
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error.message);
    isConnected = false;
    return null;
  }
}

export async function checkMongoHealth() {
  if (!isConnected || mongoose.connection.readyState !== 1) {
    return {
      status: 'disconnected',
      readyState: mongoose.connection.readyState,
      configured: Boolean(env.MONGODB_URI)
    };
  }

  try {
    await mongoose.connection.db.admin().ping();
    return {
      status: 'connected',
      database: mongoose.connection.name,
      host: mongoose.connection.host
    };
  } catch (err) {
    return {
      status: 'unhealthy',
      error: err.message
    };
  }
}

export async function closeMongoDB() {
  if (isConnected) {
    await mongoose.disconnect();
    isConnected = false;
    logger.info('MongoDB disconnected cleanly');
  }
}
