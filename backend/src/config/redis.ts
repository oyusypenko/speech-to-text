import { Redis } from 'ioredis';
import dotenv from 'dotenv';
import { logger } from '../utils/logger';

dotenv.config();

export const redis = new Redis(
  process.env.REDIS_URL || 'redis://localhost:6379',
  {
    maxRetriesPerRequest: 3,
  }
);

export const initializeRedis = async (): Promise<void> => {
  try {
    await redis.ping();
    logger.info('Redis connection established');
  } catch (error) {
    logger.error('Redis connection failed', error);
    process.exit(1);
  }
};