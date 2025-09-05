export enum JobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export enum WhisperModel {
  TINY = 'tiny',
  BASE = 'base',
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large'
}

export enum FileType {
  AUDIO = 'audio',
  VIDEO = 'video'
}

export interface Job {
  id: string;
  originalFilename: string;
  filePath: string;
  fileType: FileType;
  fileSize: number;
  status: JobStatus;
  transcriptionText?: string;
  transcriptionFilePath?: string;
  language?: string;
  model: WhisperModel;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  errorMessage?: string;
}

export interface CreateJobData {
  originalFilename: string;
  filePath: string;
  fileType: FileType;
  fileSize: number;
  language?: string;
  model: WhisperModel;
}

export interface UpdateJobData {
  status?: JobStatus;
  transcriptionText?: string;
  transcriptionFilePath?: string;
  errorMessage?: string;
  completedAt?: Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message: string;
  errors?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  services: {
    database: 'up' | 'down';
    redis: 'up' | 'down';
    whisper: 'up' | 'down';
  };
}

export interface QueueStatusResponse {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
}

export interface WhisperServiceRequest {
  filePath: string;
  language?: string;
  model: WhisperModel;
  jobId: string;
}

export interface WhisperServiceResponse {
  success: boolean;
  transcription?: string;
  transcriptionFile?: string;
  error?: string;
}