import { Router } from 'express';
import { JobController } from '../controllers/JobController';
import { uploadMiddleware } from '../middleware/upload';
import { validate, validateFileUpload } from '../middleware/validation';
import { uploadRateLimit, strictRateLimit } from '../middleware/rateLimiting';
import { jobIdParamSchema, paginationSchema } from '../validation/schemas';

const router = Router();

// Upload file and create transcription job
router.post('/upload', uploadRateLimit, uploadMiddleware, validateFileUpload, JobController.uploadFile);

// Get all jobs
router.get('/', validate(paginationSchema), JobController.getAllJobs);

// Get specific job
router.get('/:id', validate(jobIdParamSchema), JobController.getJob);

// Delete job
router.delete('/:id', validate(jobIdParamSchema), JobController.deleteJob);

// Download transcription file
router.get('/:id/download', validate(jobIdParamSchema), JobController.downloadTranscription);

// Get queue status (admin endpoint with strict rate limiting)
router.get('/admin/queue-status', strictRateLimit, JobController.getQueueStatus);

export default router;