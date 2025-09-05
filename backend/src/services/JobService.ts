import { IJobRepository, FindAllOptions } from '../interfaces/IJobRepository';
import { IQueueService } from '../interfaces/IQueueService';
import { Job, CreateJobData, UpdateJobData, JobStatus, WhisperModel, FileType } from '../types';
import { NotFoundError, ValidationError, InternalServerError } from '../errors/AppError';
import { logger } from '../utils/logger';
import fs from 'fs';
import path from 'path';

export class JobService {
  constructor(
    private jobRepository: IJobRepository,
    private queueService: IQueueService
  ) {}

  async createJob(data: CreateJobData): Promise<Job> {
    try {
      // Validate required fields
      if (!data.originalFilename || !data.filePath || !data.model) {
        throw new ValidationError('Missing required fields: originalFilename, filePath, model');
      }

      // Validate file exists
      if (!fs.existsSync(data.filePath)) {
        throw new ValidationError('File does not exist');
      }

      // Create job in database
      const job = await this.jobRepository.create(data);

      // Add to transcription queue
      const queueJobId = await this.queueService.addTranscriptionJob({
        jobId: job.id,
        filePath: job.filePath,
        language: job.language,
        model: job.model,
      });

      logger.info('Job created and queued for transcription', { 
        jobId: job.id, 
        queueJobId 
      });

      return job;
    } catch (error) {
      logger.error('Failed to create job', { error, data });
      throw error;
    }
  }

  async getJobById(id: string): Promise<Job> {
    if (!id) {
      throw new ValidationError('Job ID is required');
    }

    const job = await this.jobRepository.findById(id);
    if (!job) {
      throw new NotFoundError('Job', id);
    }

    return job;
  }

  async getAllJobs(options: FindAllOptions = {}): Promise<{ jobs: Job[]; total: number }> {
    try {
      return await this.jobRepository.findAll(options);
    } catch (error) {
      logger.error('Failed to get all jobs', { error, options });
      throw new InternalServerError('Failed to retrieve jobs');
    }
  }

  async updateJob(id: string, data: UpdateJobData): Promise<Job> {
    if (!id) {
      throw new ValidationError('Job ID is required');
    }

    const updatedJob = await this.jobRepository.update(id, data);
    if (!updatedJob) {
      throw new NotFoundError('Job', id);
    }

    logger.info('Job updated', { jobId: id, updateData: data });
    return updatedJob;
  }

  async deleteJob(id: string): Promise<void> {
    if (!id) {
      throw new ValidationError('Job ID is required');
    }

    const job = await this.jobRepository.findById(id);
    if (!job) {
      throw new NotFoundError('Job', id);
    }

    // Delete associated files
    try {
      if (job.filePath && fs.existsSync(job.filePath)) {
        fs.unlinkSync(job.filePath);
        logger.info('Deleted job file', { filePath: job.filePath });
      }

      if (job.transcriptionFilePath && fs.existsSync(job.transcriptionFilePath)) {
        fs.unlinkSync(job.transcriptionFilePath);
        logger.info('Deleted transcription file', { filePath: job.transcriptionFilePath });
      }
    } catch (error) {
      logger.warn('Failed to delete job files', { error, jobId: id });
      // Continue with database deletion even if file deletion fails
    }

    const deleted = await this.jobRepository.delete(id);
    if (!deleted) {
      throw new InternalServerError('Failed to delete job from database');
    }

    logger.info('Job deleted successfully', { jobId: id });
  }

  async getJobsByStatus(status: JobStatus): Promise<Job[]> {
    try {
      return await this.jobRepository.findByStatus(status);
    } catch (error) {
      logger.error('Failed to get jobs by status', { error, status });
      throw new InternalServerError('Failed to retrieve jobs by status');
    }
  }

  async downloadTranscription(id: string): Promise<{ filePath: string; filename: string }> {
    const job = await this.getJobById(id);

    if (job.status !== JobStatus.COMPLETED) {
      throw new ValidationError('Job is not completed yet');
    }

    if (!job.transcriptionFilePath || !fs.existsSync(job.transcriptionFilePath)) {
      throw new NotFoundError('Transcription file');
    }

    return {
      filePath: job.transcriptionFilePath,
      filename: `transcription_${job.originalFilename}.txt`
    };
  }

  async getQueueStatus() {
    try {
      return await this.queueService.getQueueStatus();
    } catch (error) {
      logger.error('Failed to get queue status', error);
      throw new InternalServerError('Failed to retrieve queue status');
    }
  }

  // Utility method to get job statistics
  async getJobStatistics(): Promise<{
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  }> {
    try {
      const [total, pending, processing, completed, failed] = await Promise.all([
        this.jobRepository.findAll().then(result => result.total),
        this.jobRepository.findByStatus(JobStatus.PENDING).then(jobs => jobs.length),
        this.jobRepository.findByStatus(JobStatus.PROCESSING).then(jobs => jobs.length),
        this.jobRepository.findByStatus(JobStatus.COMPLETED).then(jobs => jobs.length),
        this.jobRepository.findByStatus(JobStatus.FAILED).then(jobs => jobs.length),
      ]);

      return { total, pending, processing, completed, failed };
    } catch (error) {
      logger.error('Failed to get job statistics', error);
      throw new InternalServerError('Failed to retrieve job statistics');
    }
  }
}