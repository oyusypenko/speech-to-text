import { exec } from 'child_process';
import { promisify } from 'util';
import axios from 'axios';
import { WhisperServiceRequest, WhisperServiceResponse } from '../types';
import path from 'path';
import fs from 'fs';
import { logger } from '../utils/logger';
import { IWhisperService } from '../interfaces/IWhisperService';

const execAsync = promisify(exec);
const FormData = require('form-data');

export class DockerWhisperService implements IWhisperService {
  private static readonly CONTAINER_NAME = 'whisper-on-demand';
  private static readonly IMAGE_NAME = 'speech-to-text-whisper-service-cpu';
  private static readonly CONTAINER_PORT = 8001; // Different from main services
  private static readonly REQUEST_TIMEOUT = 600000; // 10 minutes
  private static readonly STARTUP_TIMEOUT = 60000; // 1 minute for container startup
  private static containerStartTime: number | null = null;
  private static readonly IDLE_TIMEOUT = 300000; // 5 minutes idle before auto-stop

  private static async isContainerRunning(): Promise<boolean> {
    try {
      const { stdout } = await execAsync(
        `docker ps -q -f name=${this.CONTAINER_NAME} -f status=running`
      );
      return stdout.trim().length > 0;
    } catch {
      return false;
    }
  }

  private static async startContainer(): Promise<void> {
    logger.info('Starting Whisper container on-demand');
    
    // First, stop any existing container
    try {
      await execAsync(`docker stop ${this.CONTAINER_NAME}`);
      await execAsync(`docker rm ${this.CONTAINER_NAME}`);
    } catch {
      // Container might not exist, that's OK
    }

    // Get the absolute path for volume mounts
    const uploadsPath = path.resolve('/app/uploads');
    const tempPath = path.resolve('/app/temp');

    // Start the container
    const startCommand = `docker run -d \
      --name ${this.CONTAINER_NAME} \
      -p ${this.CONTAINER_PORT}:8000 \
      -e PYTHONUNBUFFERED=1 \
      -e FORCE_CPU=true \
      -e CUDA_VISIBLE_DEVICES="" \
      -v ${uploadsPath}:/app/uploads \
      -v ${tempPath}:/app/temp \
      -v whisper_models:/app/models \
      ${this.IMAGE_NAME}`;

    try {
      await execAsync(startCommand);
      this.containerStartTime = Date.now();
      logger.info('Waiting for Whisper service to become healthy');
      
      // Wait for the service to be healthy
      await this.waitForHealthy();
      logger.info('Whisper container is ready');
    } catch (error) {
      logger.error('Failed to start Whisper container', error);
      throw new Error('Failed to start Whisper service');
    }
  }

  private static async waitForHealthy(): Promise<void> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < this.STARTUP_TIMEOUT) {
      try {
        const response = await axios.get(
          `http://localhost:${this.CONTAINER_PORT}/health`,
          { timeout: 5000 }
        );
        
        if (response.status === 200 && response.data.status === 'healthy') {
          return;
        }
      } catch {
        // Service not ready yet
      }
      
      // Wait 2 seconds before retrying
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    throw new Error('Whisper service failed to become healthy within timeout');
  }

  private static async stopContainer(): Promise<void> {
    logger.info('Stopping Whisper container');
    try {
      await execAsync(`docker stop ${this.CONTAINER_NAME}`);
      await execAsync(`docker rm ${this.CONTAINER_NAME}`);
      this.containerStartTime = null;
      logger.info('Whisper container stopped');
    } catch (error) {
      logger.error('Error stopping container', error);
    }
  }

  private static scheduleIdleStop(): void {
    // Clear any existing timeout
    if ((global as any).whisperIdleTimeout) {
      clearTimeout((global as any).whisperIdleTimeout);
    }

    // Schedule container stop after idle timeout
    (global as any).whisperIdleTimeout = setTimeout(() => {
      logger.info('Idle timeout reached, stopping Whisper container');
      this.stopContainer().catch((error) => logger.error('Error stopping container on timeout', error));
    }, this.IDLE_TIMEOUT);
  }

  async transcribe(request: WhisperServiceRequest): Promise<WhisperServiceResponse> {
    return DockerWhisperService.transcribeStatic(request);
  }

  static async transcribeStatic(request: WhisperServiceRequest): Promise<WhisperServiceResponse> {
    try {
      // Ensure container is running
      const isRunning = await this.isContainerRunning();
      if (!isRunning) {
        await this.startContainer();
      } else {
        logger.info('Reusing existing Whisper container');
      }

      // Reset idle timeout
      this.scheduleIdleStop();

      const { filePath, language, model, jobId } = request;

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      // Create form data
      const formData = new FormData();
      formData.append('audio', fs.createReadStream(filePath));
      formData.append('model', model);
      formData.append('job_id', jobId);
      
      if (language) {
        formData.append('language', language);
      }

      logger.info('Sending transcription request', { jobId });

      // Make request to WhisperX service
      const response = await axios.post(
        `http://localhost:${this.CONTAINER_PORT}/transcribe`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
          },
          timeout: this.REQUEST_TIMEOUT,
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
        }
      );

      logger.info('Received response', { jobId });

      if (response.data.success) {
        return {
          success: true,
          transcription: response.data.transcription,
          transcriptionFile: response.data.transcription_file,
        };
      } else {
        return {
          success: false,
          error: response.data.error || 'Unknown error from WhisperX service',
        };
      }

    } catch (error) {
      logger.error('Error in DockerWhisperService', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  static async cleanup(): Promise<void> {
    // Clear idle timeout
    if ((global as any).whisperIdleTimeout) {
      clearTimeout((global as any).whisperIdleTimeout);
    }
    
    // Stop container if running
    const isRunning = await this.isContainerRunning();
    if (isRunning) {
      await this.stopContainer();
    }
  }

  async healthCheck(): Promise<boolean> {
    return DockerWhisperService.healthCheckStatic();
  }

  static async healthCheckStatic(): Promise<boolean> {
    try {
      const isRunning = await this.isContainerRunning();
      if (!isRunning) {
        return false;
      }

      const response = await axios.get(
        `http://localhost:${this.CONTAINER_PORT}/health`,
        { timeout: 5000 }
      );
      
      return response.status === 200 && response.data.status === 'healthy';
    } catch {
      return false;
    }
  }
}