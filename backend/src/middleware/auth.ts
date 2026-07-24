import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import type { UserRole } from '../models/User';
import { ApiError } from '../utils/ApiError';

export interface AuthPayload {
  id: string;
  role: UserRole;
  customerId?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.header('Authorization');
    const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;

    if (!token) {
      throw new ApiError(401, 'No authentication token found');
    }

    const verified = jwt.verify(token, env.jwtSecret) as AuthPayload;
    req.user = verified;
    next();
  } catch {
    next(new ApiError(401, 'Invalid or expired token'));
  }
}

export function authorize(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return next(new ApiError(403, 'Insufficient permissions'));
    }
    next();
  };
}

/** Customer portal JWT gate — requires role customer + customerId claim. */
export function requireCustomer(req: Request, _res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== 'customer' || !req.user.customerId) {
    return next(new ApiError(403, 'Customer portal access required'));
  }
  next();
}
