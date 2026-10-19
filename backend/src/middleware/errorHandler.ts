import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { ApiError } from '../utils/ApiError';
import { env } from '../config/env';
import { logger } from '../config/logger';

/** Extract a human-readable message from any thrown value. */
function extractMessage(err: unknown): string {
  if (typeof err === 'string') return err;
  if (err instanceof Error) return err.message;
  if (err && typeof err === 'object' && 'message' in err) {
    const msg = (err as { message: unknown }).message;
    if (typeof msg === 'string') return msg;
  }
  // Last resort — guard against "[object Object]" garbage.
  try {
    const json = JSON.stringify(err);
    if (json !== undefined && json !== '{}') return json;
  } catch {
    // Circular references — ignore.
  }
  return 'An unexpected error occurred';
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors,
    });
  }

  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      message:
        err.code === 'LIMIT_FILE_SIZE'
          ? 'Each file must be under 25MB'
          : err.code === 'LIMIT_FILE_COUNT'
            ? 'Only one file can be uploaded at a time'
            : err.message,
    });
  }

  // MongoDB duplicate key (unique index violation) → clean 409, not a 500.
  if (
    err &&
    typeof err === 'object' &&
    'code' in err &&
    (err as { code?: number }).code === 11000
  ) {
    const keyValue = (err as { keyValue?: Record<string, unknown> }).keyValue;
    return res.status(409).json({
      success: false,
      message: 'A record with these details already exists',
      errors: keyValue ? [{ duplicate: keyValue }] : undefined,
    });
  }

  // Mongoose validation error → 400 with field-level detail.
  if (err instanceof Error && err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: err.message,
      errors: Object.values(
        (err as Error & { errors?: Record<string, { message: string }> }).errors ?? {},
      ).map((e) => ({ message: e.message })),
    });
  }

  // Malformed ObjectId etc. → 400 rather than 500.
  if (err instanceof Error && err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Invalid identifier supplied',
    });
  }

  if (err instanceof Error && (
    err.message === 'Only image uploads are allowed' ||
    err.message === 'Only image or video uploads are allowed'
  )) {
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }

  const requestId = res.getHeader('x-request-id');
  logger.error({ err, requestId }, 'Unhandled error');

  return res.status(500).json({
    success: false,
    message: env.isProduction ? 'Internal server error' : extractMessage(err),
    requestId,
  });
}

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
}
