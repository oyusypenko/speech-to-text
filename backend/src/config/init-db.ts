import { pool } from './database';
import { logger } from '../utils/logger';

export const initializeTables = async (): Promise<void> => {
  try {
    logger.info('Initializing database tables');
    
    // Create jobs table
    const createJobsTable = `
      CREATE TABLE IF NOT EXISTS jobs (
        id UUID PRIMARY KEY,
        original_filename VARCHAR(255) NOT NULL,
        file_path TEXT NOT NULL,
        file_type VARCHAR(50) NOT NULL,
        file_size BIGINT NOT NULL,
        language VARCHAR(10),
        model VARCHAR(50) NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        transcription_text TEXT,
        transcription_file_path TEXT,
        error_message TEXT,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
        completed_at TIMESTAMP WITH TIME ZONE
      );

      CREATE INDEX IF NOT EXISTS jobs_status_idx ON jobs(status);
      CREATE INDEX IF NOT EXISTS jobs_created_at_idx ON jobs(created_at DESC);
    `;

    await pool.query(createJobsTable);
    logger.info('Database tables initialized successfully');
    
  } catch (error) {
    logger.error('Failed to initialize database tables', error);
    throw error;
  }
};