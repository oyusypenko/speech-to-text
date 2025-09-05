import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ResponseWrapper } from '../utils/responseWrapper';
import { ValidationError } from '../types';

export const validate = (schema: ZodSchema<any>) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validationData = {
        body: req.body,
        query: req.query,
        params: req.params,
        file: req.file,
        files: req.files,
      };

      const result = schema.parse(validationData);
      
      // Update request objects with parsed/transformed values
      if (result.body) req.body = result.body;
      if (result.query) req.query = result.query;
      if (result.params) req.params = result.params;
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors: ValidationError[] = error.issues.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));

        ResponseWrapper.badRequest(res, 'Validation failed', validationErrors);
        return;
      }
      
      // For other errors, pass to error handler
      next(error);
    }
  };
};

// Middleware to sanitize request body
export const sanitizeInput = (req: Request, res: Response, next: NextFunction): void => {
  if (req.body && typeof req.body === 'object') {
    // Remove potential XSS patterns
    const sanitize = (obj: any): any => {
      if (typeof obj === 'string') {
        return obj
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
          .replace(/<[^>]+>/g, '')
          .trim();
      }
      
      if (Array.isArray(obj)) {
        return obj.map(sanitize);
      }
      
      if (obj && typeof obj === 'object') {
        const sanitized: any = {};
        for (const key in obj) {
          if (obj.hasOwnProperty(key)) {
            sanitized[key] = sanitize(obj[key]);
          }
        }
        return sanitized;
      }
      
      return obj;
    };

    req.body = sanitize(req.body);
  }

  next();
};

// File validation middleware specifically for multer
export const validateFileUpload = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.file) {
    ResponseWrapper.badRequest(res, 'No file provided');
    return;
  }

  const file = req.file;
  
  // Check file size (500MB)
  const maxSize = 500 * 1024 * 1024;
  if (file.size > maxSize) {
    ResponseWrapper.badRequest(res, 'File too large. Maximum size is 500MB');
    return;
  }

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

  if (!allowedMimeTypes.includes(file.mimetype)) {
    ResponseWrapper.badRequest(res, 'Invalid file type. Supported formats: MP3, WAV, MP4, MOV, AVI, OGG');
    return;
  }

  next();
};