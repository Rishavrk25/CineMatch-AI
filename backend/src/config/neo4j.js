import neo4j from 'neo4j-driver';
import { env } from './env.js';
import { logger } from '../utils/logger.js';

let driver = null;

export function getNeo4jDriver() {
  if (driver) return driver;

  if (!env.NEO4J_URI || !env.NEO4J_PASSWORD) {
    logger.warn('Neo4j credentials not configured. Graph operations will be unavailable.');
    return null;
  }

  try {
    driver = neo4j.driver(
      env.NEO4J_URI,
      neo4j.auth.basic(env.NEO4J_USERNAME, env.NEO4J_PASSWORD),
      {
        maxConnectionPoolSize: 50,
        connectionTimeout: 10000,
        disableLosslessIntegers: true
      }
    );
    return driver;
  } catch (error) {
    logger.error('Failed to create Neo4j driver:', error.message);
    return null;
  }
}

export function getNeo4jSession(database) {
  const d = getNeo4jDriver();
  if (!d) return null;
  return d.session(database ? { database } : undefined);
}

export async function checkNeo4jHealth() {
  const d = getNeo4jDriver();
  if (!d) {
    return {
      status: 'disconnected',
      configured: Boolean(env.NEO4J_URI && env.NEO4J_PASSWORD)
    };
  }

  try {
    const serverInfo = await d.getServerInfo();
    return {
      status: 'connected',
      address: serverInfo.address,
      protocolVersion: serverInfo.protocolVersion,
      agent: serverInfo.agent
    };
  } catch (err) {
    return {
      status: 'unhealthy',
      error: err.message,
      configured: true
    };
  }
}

export async function closeNeo4j() {
  if (driver) {
    await driver.close();
    driver = null;
    logger.info('Neo4j driver closed cleanly');
  }
}
