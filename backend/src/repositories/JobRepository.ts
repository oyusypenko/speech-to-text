import { IJobRepository, FindAllOptions } from '../interfaces/IJobRepository';
import { Job, CreateJobData, UpdateJobData, JobStatus } from '../types';
import { pool } from '../config/database';
import { v4 as uuidv4 } from 'uuid';
import { NotFoundError } from '../errors/AppError';
import { logger } from '../utils/logger';

export class JobRepository implements IJobRepository {
  async create(data: CreateJobData): Promise<Job> {
    const id = uuidv4();
    const query = `
      INSERT INTO jobs (
        id, original_filename, file_path, file_type, file_size, 
        language, model, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
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
      JobStatus.PENDING,
    ];

    try {
      const result = await pool.query(query, values);
      const row = result.rows[0];
      
      logger.info('Job created', { jobId: id });
      return this.mapRowToJob(row);
    } catch (error) {
      logger.error('Failed to create job', { error, data });
      throw error;
    }
  }

  async findById(id: string): Promise<Job | null> {
    const query = 'SELECT * FROM jobs WHERE id = $1';
    
    try {
      const result = await pool.query(query, [id]);
      
      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToJob(result.rows[0]);
    } catch (error) {
      logger.error('Failed to find job by id', { error, jobId: id });
      throw error;
    }
  }

  async findAll(options: FindAllOptions = {}): Promise<{ jobs: Job[]; total: number }> {
    const {
      page = 1,
      limit = 10,
      status,
      orderBy = 'createdAt',
      orderDirection = 'DESC'
    } = options;

    const offset = (page - 1) * limit;
    
    let whereClause = '';
    let queryParams: any[] = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      whereClause = `WHERE status = $${paramCount}`;
      queryParams.push(status);
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM jobs ${whereClause}`;
    const countResult = await pool.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].count);

    // Get paginated results
    paramCount++;
    queryParams.push(limit);
    paramCount++;
    queryParams.push(offset);

    const dataQuery = `
      SELECT * FROM jobs 
      ${whereClause}
      ORDER BY ${orderBy} ${orderDirection}
      LIMIT $${paramCount - 1} OFFSET $${paramCount}
    `;

    try {
      const result = await pool.query(dataQuery, queryParams);
      const jobs = result.rows.map(row => this.mapRowToJob(row));

      return { jobs, total };
    } catch (error) {
      logger.error('Failed to find all jobs', { error, options });
      throw error;
    }
  }

  async update(id: string, data: UpdateJobData): Promise<Job | null> {
    const setParts: string[] = [];
    const values: any[] = [];
    let paramCount = 0;

    // Build dynamic UPDATE query
    if (data.status !== undefined) {
      paramCount++;
      setParts.push(`status = $${paramCount}`);
      values.push(data.status);
    }

    if (data.transcriptionText !== undefined) {
      paramCount++;
      setParts.push(`transcription_text = $${paramCount}`);
      values.push(data.transcriptionText);
    }

    if (data.transcriptionFilePath !== undefined) {
      paramCount++;
      setParts.push(`transcription_file_path = $${paramCount}`);
      values.push(data.transcriptionFilePath);
    }

    if (data.errorMessage !== undefined) {
      paramCount++;
      setParts.push(`error_message = $${paramCount}`);
      values.push(data.errorMessage);
    }

    if (data.completedAt !== undefined) {
      paramCount++;
      setParts.push(`completed_at = $${paramCount}`);
      values.push(data.completedAt);
    }

    if (setParts.length === 0) {
      throw new Error('No fields to update');
    }

    // Always update updated_at
    paramCount++;
    setParts.push(`updated_at = $${paramCount}`);
    values.push(new Date());

    // Add WHERE clause parameter
    paramCount++;
    values.push(id);

    const query = `
      UPDATE jobs 
      SET ${setParts.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    try {
      const result = await pool.query(query, values);
      
      if (result.rows.length === 0) {
        return null;
      }

      logger.info('Job updated', { jobId: id, updateData: data });
      return this.mapRowToJob(result.rows[0]);
    } catch (error) {
      logger.error('Failed to update job', { error, jobId: id, data });
      throw error;
    }
  }

  async delete(id: string): Promise<boolean> {
    const query = 'DELETE FROM jobs WHERE id = $1';
    
    try {
      const result = await pool.query(query, [id]);
      const deleted = (result.rowCount || 0) > 0;
      
      if (deleted) {
        logger.info('Job deleted', { jobId: id });
      }
      
      return deleted;
    } catch (error) {
      logger.error('Failed to delete job', { error, jobId: id });
      throw error;
    }
  }

  async findByStatus(status: JobStatus): Promise<Job[]> {
    const query = 'SELECT * FROM jobs WHERE status = $1 ORDER BY created_at ASC';
    
    try {
      const result = await pool.query(query, [status]);
      return result.rows.map(row => this.mapRowToJob(row));
    } catch (error) {
      logger.error('Failed to find jobs by status', { error, status });
      throw error;
    }
  }

  private mapRowToJob(row: any): Job {
    return {
      id: row.id,
      originalFilename: row.original_filename,
      filePath: row.file_path,
      fileType: row.file_type,
      fileSize: parseInt(row.file_size),
      status: row.status as JobStatus,
      transcriptionText: row.transcription_text || undefined,
      transcriptionFilePath: row.transcription_file_path || undefined,
      language: row.language || undefined,
      model: row.model,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      completedAt: row.completed_at || undefined,
      errorMessage: row.error_message || undefined,
    };
  }
}