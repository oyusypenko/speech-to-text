import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { ResponseWrapper } from '../utils/responseWrapper';

// General API rate limiting
export const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req: Request, res: Response) => {
    return ResponseWrapper.error(res, 'Too many requests, please try again later', 429);
  },
});

// Stricter rate limiting for file uploads
export const uploadRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 uploads per 15 minutes
  message: 'Upload limit exceeded, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    return ResponseWrapper.error(res, 'Upload limit exceeded, please try again later', 429);
  },
});

// Very strict rate limiting for expensive operations
export const strictRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // limit each IP to 5 requests per hour
  message: 'Rate limit exceeded for this operation',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    return ResponseWrapper.error(res, 'Rate limit exceeded for this operation', 429);
  },
});

// Authentication rate limiting (for future use)
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 failed login attempts per 15 minutes
  skipSuccessfulRequests: true,
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: Response) => {
    return ResponseWrapper.error(res, 'Too many authentication attempts, please try again later', 429);
  },
});