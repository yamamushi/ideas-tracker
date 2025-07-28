import { Request, Response, NextFunction } from 'express';

export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

export class AppError extends Error implements ApiError {
  public statusCode: number;
  public code: string;
  public details?: any;

  constructor(message: string, statusCode: number = 500, code?: string, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.code = code || 'INTERNAL_ERROR';
    this.details = details;
    this.name = 'AppError';

    Error.captureStackTrace(this, this.constructor);
  }
}

export function createError(message: string, statusCode: number = 500, code?: string, details?: any): AppError {
  return new AppError(message, statusCode, code, details);
}

export function errorHandler(err: ApiError, req: Request, res: Response, _next: NextFunction): void {
  // Only log unexpected errors in test environment, or all errors in other environments
  const isTestEnv = process.env['NODE_ENV'] === 'test';
  const isExpectedError = (err.statusCode && err.statusCode < 500) || 
                         err.message.includes('Access token') ||
                         err.message.includes('Invalid access token') ||
                         err.message.includes('Token expired');
  
  if (!isTestEnv || !isExpectedError) {
    console.error('Error occurred:', {
      message: err.message,
      stack: err.stack,
      url: req.url,
      method: req.method,
      timestamp: new Date().toISOString()
    });
  }

  // Default error values
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let code = err.code || 'INTERNAL_ERROR';

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
  } else if (err.name === 'UnauthorizedError' || err.message.includes('unauthorized')) {
    statusCode = 401;
    code = 'UNAUTHORIZED';
  } else if (err.message.includes('Invalid access token') || err.message.includes('Access token')) {
    statusCode = 401;
    code = err.code || 'INVALID_TOKEN';
  } else if (err.name === 'ForbiddenError' || err.message.includes('forbidden')) {
    statusCode = 403;
    code = 'FORBIDDEN';
  } else if (err.name === 'NotFoundError' || (err.message.includes('not found') && !err.code)) {
    statusCode = 404;
    code = 'NOT_FOUND';
  }

  // Don't expose internal errors in production
  if (process.env['NODE_ENV'] === 'production' && statusCode === 500) {
    message = 'Internal Server Error';
  }

  const errorResponse = {
    success: false,
    error: {
      message,
      code,
      ...(err.details && { details: err.details }),
      ...(process.env['NODE_ENV'] === 'development' && { stack: err.stack })
    }
  };

  res.status(statusCode).json(errorResponse);
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: {
      message: `Route ${req.method} ${req.path} not found`,
      code: 'ROUTE_NOT_FOUND'
    }
  });
}

export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}