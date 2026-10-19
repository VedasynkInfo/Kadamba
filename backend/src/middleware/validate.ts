import type { NextFunction, Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { ApiError } from '../utils/ApiError';

export function validateRequest(req: Request, _res: Response, next: NextFunction) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(ApiError.validationFailed('Validation failed', errors.array()));
  }
  next();
}
