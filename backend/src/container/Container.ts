import { JobRepository } from '../repositories/JobRepository';
import { JobService } from '../services/JobService';
import { QueueService } from '../services/QueueService';
import { WhisperService } from '../services/WhisperService';
import { DockerWhisperService } from '../services/DockerWhisperService';
import { IJobRepository } from '../interfaces/IJobRepository';
import { IQueueService } from '../interfaces/IQueueService';
import { IWhisperService } from '../interfaces/IWhisperService';

export class Container {
  private static instance: Container;
  private services = new Map<string, any>();

  private constructor() {}

  static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }

  // Register a service
  register<T>(name: string, service: T): void {
    this.services.set(name, service);
  }

  // Get a service
  get<T>(name: string): T {
    const service = this.services.get(name);
    if (!service) {
      throw new Error(`Service '${name}' not found`);
    }
    return service;
  }

  // Initialize all services
  initializeServices(): void {
    // Register repositories
    const jobRepository: IJobRepository = new JobRepository();
    this.register('jobRepository', jobRepository);

    // Register base services
    const queueService: IQueueService = QueueService.getInstance();
    this.register('queueService', queueService);

    // Register whisper service (Docker or regular based on env)
    const useDocker = process.env.USE_DOCKER_WHISPER === 'true';
    const whisperService: IWhisperService = useDocker 
      ? new DockerWhisperService() 
      : new WhisperService();
    this.register('whisperService', whisperService);

    // Register business services
    const jobService = new JobService(jobRepository, queueService);
    this.register('jobService', jobService);
  }

  // Get commonly used services with proper typing
  getJobService(): JobService {
    return this.get<JobService>('jobService');
  }

  getJobRepository(): IJobRepository {
    return this.get<IJobRepository>('jobRepository');
  }

  getQueueService(): IQueueService {
    return this.get<IQueueService>('queueService');
  }

  getWhisperService(): IWhisperService {
    return this.get<IWhisperService>('whisperService');
  }
}

// Export singleton instance
export const container = Container.getInstance();