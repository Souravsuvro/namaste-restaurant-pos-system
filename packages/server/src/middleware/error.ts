import { Request, Response, NextFunction } from 'express';
import { config } from '../config/env';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class AuthError extends AppError {
  constructor(message: string = 'Authentication failed') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Access denied') {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409);
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (config.nodeEnv === 'development') {
    console.error('Error:', err);
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
    });
    return;
  }

  // Handle SQLite constraint errors
  if (err.message && err.message.includes('UNIQUE constraint failed')) {
    res.status(409).json({
      error: 'A record with this value already exists.',
    });
    return;
  }

  if (err.message && err.message.includes('FOREIGN KEY constraint failed')) {
    res.status(400).json({
      error: 'Referenced record does not exist.',
    });
    return;
  }

  // Default error
  res.status(500).json({
    error: config.nodeEnv === 'development' ? err.message : 'Internal server error',
  });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: `Route ${req.method} ${req.path} not found`,
  });
}
