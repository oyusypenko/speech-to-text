import { pool } from '../config/database';
import { Job, CreateJobData, UpdateJobData, JobStatus, FileType } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class JobModel {
  static async create(data: CreateJobData): Promise<Job> {
    const id = uuidv4();
    const query = `
      INSERT INTO jobs (
        id, original_filename, file_path, file_type, file_size, 
        language, model, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *
    `;

    const values = [
      id,
      data.originalFilename,
      data.filePath,
      data.fileType,
      data.fileSize,
      data.language,
      data.model,
      JobStatus.PENDING
    ];

    try {
      const result = await pool.query(query, values);
      return this.mapRowToJob(result.rows[0]);
    } catch (error) {
      console.error('Error creating job:', error);
      throw new Error('Failed to create job');
    }
  }

  static async findById(id: string): Promise<Job | null> {
    const query = 'SELECT * FROM jobs WHERE id = $1';

    try {
      const result = await pool.query(query, [id]);
      return result.rows.length > 0 ? this.mapRowToJob(result.rows[0]) : null;
    } catch (error) {
      console.error('Error finding job by ID:', error);
      throw new Error('Failed to find job');
    }
  }

  static async findAll(limit = 100): Promise<Job[]> {
    const query = 'SELECT * FROM jobs ORDER BY created_at DESC LIMIT $1';

    try {
      const result = await pool.query(query, [limit]);
      return result.rows.map(this.mapRowToJob);
    } catch (error) {
      console.error('Error finding all jobs:', error);
      throw new Error('Failed to find jobs');
    }
  }

  static async update(id: string, data: UpdateJobData): Promise<Job | null> {
    const setClauses: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (data.status !== undefined) {
      setClauses.push(`status = $${paramCount++}`);
      values.push(data.status);
    }

    if (data.transcriptionText !== undefined) {
      setClauses.push(`transcription_text = $${paramCount++}`);
      values.push(data.transcriptionText);
    }

    if (data.transcriptionFilePath !== undefined) {
      setClauses.push(`transcription_file_path = $${paramCount++}`);
      values.push(data.transcriptionFilePath);
    }

    if (data.errorMessage !== undefined) {
      setClauses.push(`error_message = $${paramCount++}`);
      values.push(data.errorMessage);
    }

    if (data.completedAt !== undefined) {
      setClauses.push(`completed_at = $${paramCount++}`);
      values.push(data.completedAt);
    }

    if (setClauses.length === 0) {
      throw new Error('No data provided for update');
    }

    setClauses.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE jobs 
      SET ${setClauses.join(', ')} 
      WHERE id = $${paramCount}
      RETURNING *
    `;

    try {
      const result = await pool.query(query, values);
      return result.rows.length > 0 ? this.mapRowToJob(result.rows[0]) : null;
    } catch (error) {
      console.error('Error updating job:', error);
      throw new Error('Failed to update job');
    }
  }

  static async delete(id: string): Promise<boolean> {
    const query = 'DELETE FROM jobs WHERE id = $1';

    try {
      const result = await pool.query(query, [id]);
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error('Error deleting job:', error);
      throw new Error('Failed to delete job');
    }
  }

  private static mapRowToJob(row: any): Job {
    return {
      id: row.id,
      originalFilename: row.original_filename,
      filePath: row.file_path,
      fileType: row.file_type as FileType,
      fileSize: parseInt(row.file_size),
      status: row.status as JobStatus,
      transcriptionText: row.transcription_text,
      transcriptionFilePath: row.transcription_file_path,
      language: row.language,
      model: row.model,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      completedAt: row.completed_at,
      errorMessage: row.error_message,
    };
  }
}