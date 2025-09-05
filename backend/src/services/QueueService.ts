import { Queue, Worker, Job as BullJob } from 'bullmq';
import { redis } from '../config/redis';
import { JobModel } from '../models/Job';
import { JobStatus, WhisperModel, QueueStatusResponse } from '../types';
import { logger } from '../utils/logger';
import { IQueueService, TranscriptionJobData } from '../interfaces/IQueueService';
import { IWhisperService } from '../interfaces/IWhisperService';
import { WhisperService } from './WhisperService';
import { DockerWhisperService } from './DockerWhisperService';

export class QueueService implements IQueueService {
  private static instance: QueueService;
  private transcriptionQueue: Queue<TranscriptionJobData>;
  private worker: Worker<TranscriptionJobData>;
  private whisperService: IWhisperService;

  private constructor() {
    // Initialize whisper service
    const useDocker = process.env.USE_DOCKER_WHISPER === 'true';
    this.whisperService = useDocker 
      ? new DockerWhisperService() 
      : new WhisperService();

    this.transcriptionQueue = new Queue<TranscriptionJobData>('transcription', {
      connection: redis,
      defaultJobOptions: {
        removeOnComplete: 10,
        removeOnFail: 5,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      },
    });

    this.worker = new Worker<TranscriptionJobData>(
      'transcription',
      this.processTranscriptionJob.bind(this),
      {
        connection: redis,
        concurrency: 2,
      }
    );

    this.setupWorkerEvents();
  }

  static getInstance(): QueueService {
    if (!QueueService.instance) {
      QueueService.instance = new QueueService();
    }
    return QueueService.instance;
  }

  async addTranscriptionJob(data: TranscriptionJobData): Promise<string> {
    const job = await this.transcriptionQueue.add('transcribe', data, {
      priority: 1,
    });

    logger.info('Added transcription job to queue', { queueJobId: job.id, jobId: data.jobId });
    return job.id!;
  }

  private async processTranscriptionJob(job: BullJob<TranscriptionJobData>): Promise<void> {
    const { jobId, filePath, language, model } = job.data;
    
    logger.info('Processing transcription job', { queueJobId: job.id, jobId });

    try {
      // Update job status to processing
      await JobModel.update(jobId, { status: JobStatus.PROCESSING });

      // Call WhisperX service
      const result = await this.whisperService.transcribe({
        filePath,
        language,
        model,
        jobId,
      });

      if (result.success && result.transcription) {
        // Update job with successful result
        await JobModel.update(jobId, {
          status: JobStatus.COMPLETED,
          transcriptionText: result.transcription,
          transcriptionFilePath: result.transcriptionFile,
          completedAt: new Date(),
        });

        logger.info('Transcription completed for job', { jobId });
      } else {
        throw new Error(result.error || 'Transcription failed');
      }
    } catch (error: any) {
      logger.error('Transcription failed for job', { jobId, error: error.message });

      // Update job with error
      await JobModel.update(jobId, {
        status: JobStatus.FAILED,
        errorMessage: error.message || 'Unknown error occurred',
      });

      throw error;
    }
  }

  private setupWorkerEvents(): void {
    this.worker.on('completed', (job) => {
      logger.info('Queue job completed successfully', { queueJobId: job.id });
    });

    this.worker.on('failed', (job, err) => {
      logger.error('Queue job failed', { queueJobId: job?.id, error: err.message });
    });

    this.worker.on('stalled', (jobId) => {
      logger.warn('Queue job stalled', { queueJobId: jobId });
    });

    this.worker.on('error', (err) => {
      logger.error('Queue worker error', err);
    });
  }

  async getQueueStatus(): Promise<QueueStatusResponse> {
    const waiting = await this.transcriptionQueue.getWaiting();
    const active = await this.transcriptionQueue.getActive();
    const completed = await this.transcriptionQueue.getCompleted();
    const failed = await this.transcriptionQueue.getFailed();

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
    };
  }

  async cleanup(): Promise<void> {
    await this.worker.close();
    await this.transcriptionQueue.close();
  }
}