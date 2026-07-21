import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import type { AuthPayload } from './auth';

/**
 * Attach user if a valid Bearer token is present; never fail the request.
 * Used so public list/get can return unpublished items for admins.
 */
export function optionalAuthenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.header('Authorization');
    const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
    if (token) {
      req.user = jwt.verify(token, env.jwtSecret) as AuthPayload;
    }
  } catch {
    // ignore invalid token on optional auth
  }
  next();
}

export function isAdminRequest(req: Request): boolean {
  return req.user?.role === 'admin';
}
