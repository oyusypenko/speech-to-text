import { Request, Response, NextFunction } from 'express';
import { MulterError } from 'multer';
import { AppError } from '../errors/AppError';
import { ResponseWrapper } from '../utils/responseWrapper';
import { logger } from '../utils/logger';

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): Response | void => {
  // Log all errors for debugging
  logger.error('Request error', {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Handle custom application errors
  if (error instanceof AppError) {
    ResponseWrapper.error(res, error.message, error.statusCode);
    return;
  }

  // Handle Multer errors
  if (error instanceof MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        ResponseWrapper.error(res, 'File too large. Maximum size is 500MB.', 413);
        return;
      case 'LIMIT_FILE_COUNT':
        ResponseWrapper.error(res, 'Too many files. Only one file is allowed.', 400);
        return;
      case 'LIMIT_UNEXPECTED_FILE':
        ResponseWrapper.error(res, 'Unexpected field name. Use "file" field name.', 400);
        return;
      default:
        ResponseWrapper.error(res, `Upload error: ${error.message}`, 400);
        return;
    }
  }

  // Handle specific error types
  if (error.message.includes('Unsupported file type')) {
    ResponseWrapper.badRequest(res, error.message);
    return;
  }

  // Handle database errors
  if (error.message.includes('duplicate key')) {
    ResponseWrapper.conflict(res, 'Resource already exists');
    return;
  }

  // Handle validation errors (fallback)
  if (error.name === 'ValidationError') {
    ResponseWrapper.badRequest(res, error.message);
    return;
  }

  // Don't leak error details in production
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error'
    : error.message;

  ResponseWrapper.error(res, message, 500);
};