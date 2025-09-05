import { Pool } from 'pg';
import dotenv from 'dotenv';
import { logger } from '../utils/logger';

dotenv.config();

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/speech_to_text',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export const initializeDatabase = async (): Promise<void> => {
  try {
    await pool.query('SELECT NOW()');
    logger.info('Database connection established');
  } catch (error) {
    logger.error('Database connection failed', error);
    process.exit(1);
  }
};