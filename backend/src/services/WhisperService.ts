import axios, { AxiosError } from 'axios';
import { WhisperServiceRequest, WhisperServiceResponse } from '../types';
import fs from 'fs';
import { logger } from '../utils/logger';
import { IWhisperService } from '../interfaces/IWhisperService';
const FormData = require('form-data');

export class WhisperService implements IWhisperService {
  private static readonly WHISPER_SERVICE_URL = process.env.WHISPER_SERVICE_URL || 'http://localhost:8000';
  private static readonly REQUEST_TIMEOUT = 600000; // 10 minutes

  async transcribe(request: WhisperServiceRequest): Promise<WhisperServiceResponse> {
    return WhisperService.transcribeStatic(request);
  }

  static async transcribeStatic(request: WhisperServiceRequest): Promise<WhisperServiceResponse> {
    try {
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

      logger.info('Sending transcription request to WhisperX service', { jobId });

      // Make request to WhisperX service
      const response = await axios.post(
        `${this.WHISPER_SERVICE_URL}/transcribe`,
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

      logger.info('Received response from WhisperX service', { jobId });

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
      logger.error('Error calling WhisperX service', error);

      if (error instanceof AxiosError) {
        if (error.code === 'ECONNREFUSED') {
          return {
            success: false,
            error: 'WhisperX service is not available',
          };
        }

        if (error.response) {
          return {
            success: false,
            error: `WhisperX service error: ${error.response.status} - ${error.response.data?.error || error.response.statusText}`,
          };
        }

        if (error.code === 'ETIMEDOUT') {
          return {
            success: false,
            error: 'WhisperX service request timeout',
          };
        }
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async healthCheck(): Promise<boolean> {
    return WhisperService.healthCheckStatic();
  }

  static async healthCheckStatic(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.WHISPER_SERVICE_URL}/health`, {
        timeout: 5000,
      });
      
      return response.status === 200 && response.data.status === 'healthy';
    } catch (error) {
      logger.error('WhisperX service health check failed', error);
      return false;
    }
  }
}