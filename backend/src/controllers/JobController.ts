import { Request, Response, NextFunction } from 'express';
import { JobService } from '../services/JobService';
import { FileType, JobStatus } from '../types';
import { ResponseWrapper } from '../utils/responseWrapper';
import { container } from '../container/Container';
import fs from 'fs';
import path from 'path';

export class JobController {
  private static getJobService(): JobService {
    return container.getJobService();
  }

  static async uploadFile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        ResponseWrapper.badRequest(res, 'No file provided');
        return;
      }

      const { language, model = 'base' } = req.body;
      const file = req.file;

      // Determine file type
      const fileType: FileType = file.mimetype.startsWith('video/') ? FileType.VIDEO : FileType.AUDIO;

      // Create job using service
      const job = await JobController.getJobService().createJob({
        originalFilename: file.originalname,
        filePath: file.path,
        fileType,
        fileSize: file.size,
        language: language === 'auto' ? undefined : language,
        model,
      });

      ResponseWrapper.created(res, { jobId: job.id }, 'File uploaded successfully and added to transcription queue');

    } catch (error) {
      next(error);
    }
  }

  static async getJob(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const job = await JobController.getJobService().getJobById(id);
      ResponseWrapper.success(res, job, 'Job retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getAllJobs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page, limit, status } = req.query as any;
      const result = await JobController.getJobService().getAllJobs({
        page,
        limit,
        status
      });
      ResponseWrapper.success(res, result, 'Jobs retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async deleteJob(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      await JobController.getJobService().deleteJob(id);
      ResponseWrapper.success(res, null, 'Job deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  static async downloadTranscription(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { filePath, filename } = await JobController.getJobService().downloadTranscription(id);
      
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', 'text/plain');

      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } catch (error) {
      next(error);
    }
  }

  static async getQueueStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const status = await JobController.getJobService().getQueueStatus();
      ResponseWrapper.success(res, status, 'Queue status retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
}