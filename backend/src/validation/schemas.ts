import { z } from 'zod';
import { WhisperModel } from '../types';

// File upload validation schema
export const uploadFileSchema = z.object({
  body: z.object({
    language: z.string().optional().refine((val) => {
      if (!val) return true;
      const supportedLanguages = ['ru', 'en', 'uk', 'es', 'fr', 'de', 'auto'];
      return supportedLanguages.includes(val);
    }, { message: 'Unsupported language' }),
    model: z.enum(['tiny', 'base', 'small', 'medium', 'large']).default('base'),
  }),
  file: z.any().refine((file) => {
    if (!file) return false;
    
    // Check file size (500MB limit)
    const maxSize = 500 * 1024 * 1024; // 500MB
    if (file.size > maxSize) return false;
    
    // Check file type
    const allowedMimeTypes = [
      'audio/mpeg',
      'audio/wav', 
      'audio/mp4',
      'audio/ogg',
      'video/mp4',
      'video/mpeg',
      'video/quicktime',
      'video/x-msvideo'
    ];
    
    return allowedMimeTypes.includes(file.mimetype);
  }, { 
    message: 'Invalid file: must be audio/video file under 500MB' 
  })
});

// Job ID parameter validation
export const jobIdParamSchema = z.object({
  params: z.object({
    jobId: z.string().uuid({ message: 'Invalid job ID format' })
  })
});

// Pagination query validation
export const paginationSchema = z.object({
  query: z.object({
    page: z.string().optional().transform((val) => val ? parseInt(val) : 1).refine((val) => val > 0, {
      message: 'Page must be a positive number'
    }),
    limit: z.string().optional().transform((val) => val ? parseInt(val) : 10).refine((val) => val > 0 && val <= 100, {
      message: 'Limit must be between 1 and 100'
    }),
    status: z.enum(['pending', 'processing', 'completed', 'failed']).optional(),
  })
});

// Health check validation (for future use)
export const healthCheckSchema = z.object({
  query: z.object({
    detailed: z.string().optional().transform((val) => val === 'true')
  })
});

// Environment variables validation
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3001').transform((val) => parseInt(val)),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url().default('redis://localhost:6379'),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
  WHISPER_SERVICE_URL: z.string().url().default('http://localhost:8000'),
  USE_DOCKER_WHISPER: z.string().default('false').transform((val) => val === 'true'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});