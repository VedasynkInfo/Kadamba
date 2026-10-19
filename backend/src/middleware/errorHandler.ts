import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { ApiError } from '../utils/ApiError';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { defaultErrorCode, type ErrorCode } from '../shared/enums';

/** Extract a human-readable message from any thrown value. */
function extractMessage(err: unknown): string {
  if (typeof err === 'string') return err;
  if (err instanceof Error) return err.message;
  if (err && typeof err === 'object' && 'message' in err) {
    const msg = (err as { message: unknown }).message;
    if (typeof msg === 'string') return msg;
  }
  // Last resort - guard against "[object Object]" garbage.
  try {
    const json = JSON.stringify(err);
    if (json !== undefined && json !== '{}') return json;
  } catch {
    // Circular references - ignore.
  }
  return 'An unexpected error occurred';
}

/**
 * Send the canonical error envelope. Every failure path funnels through here so
 * the `code` field is never missing, whatever produced the error.
 */
function sendError(
  res: Response,
  statusCode: number,
  message: string,
  options: { code?: ErrorCode; errors?: unknown[]; requestId?: unknown } = {},
) {
  return res.status(statusCode).json({
    success: false,
    code: options.code ?? defaultErrorCode(statusCode),
    message,
    ...(options.errors ? { errors: options.errors } : {}),
    ...(options.requestId ? { requestId: options.requestId } : {}),
  });
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (res.headersSent) return;

  if (err instanceof ApiError) {
    return sendError(res, err.statusCode, err.message, {
      code: err.code,
      errors: err.errors,
    });
  }

  if (err instanceof multer.MulterError) {
    return sendError(
      res,
      400,
      err.code === 'LIMIT_FILE_SIZE'
        ? 'Each file must be under 25MB'
        : err.code === 'LIMIT_FILE_COUNT'
          ? 'Only one file can be uploaded at a time'
          : err.message,
      { code: 'UPLOAD_INVALID' },
    );
  }

  // MongoDB duplicate key (unique index violation) -> clean 409, not a 500.
  if (err && typeof err === 'object' && 'code' in err && (err as { code?: number }).code === 11000) {
    const keyValue = (err as { keyValue?: Record<string, unknown> }).keyValue;
    return sendError(res, 409, 'A record with these details already exists', {
      code: 'CONFLICT',
      errors: keyValue ? [{ duplicate: keyValue }] : undefined,
    });
  }

  // Mongoose validation error -> 400 with field-level detail.
  if (err instanceof Error && err.name === 'ValidationError') {
    return sendError(res, 400, err.message, {
      code: 'VALIDATION_FAILED',
      errors: Object.values(
        (err as Error & { errors?: Record<string, { message: string }> }).errors ?? {},
      ).map((e) => ({ message: e.message })),
    });
  }

  // Malformed ObjectId etc. -> 400 rather than 500.
  if (err instanceof Error && err.name === 'CastError') {
    return sendError(res, 400, 'Invalid identifier supplied', { code: 'BAD_REQUEST' });
  }

  if (
    err instanceof Error &&
    (err.message === 'Only image uploads are allowed' ||
      err.message === 'Only image or video uploads are allowed')
  ) {
    return sendError(res, 400, err.message, { code: 'UPLOAD_INVALID' });
  }

  const requestId = res.getHeader('x-request-id');
  logger.error({ err, requestId }, 'Unhandled error');

  return sendError(res, 500, env.isProduction ? 'Internal server error' : extractMessage(err), {
    code: 'INTERNAL',
    requestId,
  });
}

export function notFoundHandler(_req: Request, res: Response) {
  sendError(res, 404, 'Route not found', { code: 'NOT_FOUND' });
}
