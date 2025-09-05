export enum JobStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export enum FileType {
  AUDIO = 'audio',
  VIDEO = 'video'
}

export enum WhisperModel {
  TINY = 'tiny',
  BASE = 'base',
  SMALL = 'small',
  MEDIUM = 'medium',
  LARGE = 'large'
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
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  errorMessage?: string;
}

export interface UploadResponse {
  success: boolean;
  jobId?: string;
  message: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message: string;
  errors?: any[];
}

export interface CreateJobRequest {
  language?: string;
  model: WhisperModel;
}

export interface JobsListResponse {
  jobs: Job[];
  total: number;
}

// API Client Response Types
export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}

// File Upload Types
export interface FileUploadOptions {
  language?: string;
  model: WhisperModel;
}

export interface UploadProgressEvent {
  loaded: number;
  total: number;
  progress: number;
}