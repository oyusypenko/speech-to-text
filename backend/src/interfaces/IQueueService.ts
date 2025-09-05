import { WhisperModel, QueueStatusResponse } from '../types';

export interface TranscriptionJobData {
  jobId: string;
  filePath: string;
  language?: string;
  model: WhisperModel;
}

export interface IQueueService {
  addTranscriptionJob(data: TranscriptionJobData): Promise<string>;
  getQueueStatus(): Promise<QueueStatusResponse>;
  cleanup(): Promise<void>;
}