import { Response } from 'express';
import { ApiResponse, ValidationError as ValidationErrorType } from '../types';
import { AppError } from '../errors/AppError';

export class ResponseWrapper {
  static success<T>(
    res: Response,
    data: T,
    message: string = 'Success',
    statusCode: number = 200
  ): Response<ApiResponse<T>> {
    return res.status(statusCode).json({
      success: true,
      data,
      message,
    });
  }

  static error(
    res: Response,
    message: string,
    statusCode: number = 500,
    errors?: ValidationErrorType[]
  ): Response<ApiResponse<null>> {
    return res.status(statusCode).json({
      success: false,
      message,
      errors,
    });
  }

  static handleError(res: Response, error: Error): Response<ApiResponse<null>> {
    if (error instanceof AppError) {
      return this.error(res, error.message, error.statusCode);
    }

    // Log unexpected errors
    console.error('Unexpected error:', error);

    return this.error(res, 'Internal server error', 500);
  }

  static created<T>(
    res: Response,
    data: T,
    message: string = 'Resource created successfully'
  ): Response<ApiResponse<T>> {
    return this.success(res, data, message, 201);
  }

  static noContent(
    res: Response,
    message: string = 'Operation completed successfully'
  ): Response<ApiResponse<null>> {
    return res.status(204).json({
      success: true,
      message,
    });
  }

  static badRequest(
    res: Response,
    message: string = 'Bad request',
    errors?: ValidationErrorType[]
  ): Response<ApiResponse<null>> {
    return this.error(res, message, 400, errors);
  }

  static notFound(
    res: Response,
    message: string = 'Resource not found'
  ): Response<ApiResponse<null>> {
    return this.error(res, message, 404);
  }

  static unauthorized(
    res: Response,
    message: string = 'Unauthorized access'
  ): Response<ApiResponse<null>> {
    return this.error(res, message, 401);
  }

  static forbidden(
    res: Response,
    message: string = 'Forbidden access'
  ): Response<ApiResponse<null>> {
    return this.error(res, message, 403);
  }

  static conflict(
    res: Response,
    message: string = 'Resource conflict'
  ): Response<ApiResponse<null>> {
    return this.error(res, message, 409);
  }

  static serviceUnavailable(
    res: Response,
    message: string = 'Service temporarily unavailable'
  ): Response<ApiResponse<null>> {
    return this.error(res, message, 503);
  }
}