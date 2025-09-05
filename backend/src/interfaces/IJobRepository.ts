import { Job, CreateJobData, UpdateJobData, JobStatus, WhisperModel } from '../types';

export interface IJobRepository {
  create(data: CreateJobData): Promise<Job>;
  findById(id: string): Promise<Job | null>;
  findAll(options?: FindAllOptions): Promise<{ jobs: Job[]; total: number }>;
  update(id: string, data: UpdateJobData): Promise<Job | null>;
  delete(id: string): Promise<boolean>;
  findByStatus(status: JobStatus): Promise<Job[]>;
}

export interface FindAllOptions {
  page?: number;
  limit?: number;
  status?: JobStatus;
  orderBy?: 'createdAt' | 'updatedAt';
  orderDirection?: 'ASC' | 'DESC';
}