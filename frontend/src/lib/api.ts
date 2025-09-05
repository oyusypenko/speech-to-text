import axios from 'axios';
import { Job, UploadResponse, ApiResponse } from '@/types';

class ApiClient {
  private baseURL: string;

  constructor() {
    this.baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  }

  private get client() {
    return axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
    });
  }

  async uploadFile(file: File, language?: string, model?: string): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    if (language) formData.append('language', language);
    if (model) formData.append('model', model);

    const response = await this.client.post<UploadResponse>('/api/jobs/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  async getJob(jobId: string): Promise<ApiResponse<Job>> {
    const response = await this.client.get<ApiResponse<Job>>(`/api/jobs/${jobId}`);
    return response.data;
  }

  async getAllJobs(): Promise<ApiResponse<Job[]>> {
    const response = await this.client.get<ApiResponse<Job[]>>('/api/jobs');
    return response.data;
  }

  async deleteJob(jobId: string): Promise<ApiResponse<void>> {
    const response = await this.client.delete<ApiResponse<void>>(`/api/jobs/${jobId}`);
    return response.data;
  }

  async downloadTranscription(jobId: string): Promise<Blob> {
    const response = await this.client.get(`/api/jobs/${jobId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  }
}

export const apiClient = new ApiClient();