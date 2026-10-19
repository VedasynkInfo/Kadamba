import type { NextFunction, Request, Response } from 'express';
import { env } from '../config/env';
import { ApiError } from '../utils/ApiError';

/**
 * Origin guard for endpoints that consume an httpOnly refresh cookie.
 *
 * The SPA authenticates normal API calls with an in-memory Bearer token, so
 * those are immune to CSRF. The refresh and logout endpoints are the only ones
 * that rely on a cookie. A cross-site page can *send* that cookie, but it cannot
 * read the response (CORS blocks it) — the residual risk is a forced rotation
 * that signs the real user out. Rejecting foreign origins removes even that.
 *
 * Requests with no `Origin` header (curl, server-to-server, supertest) are
 * allowed: browsers always attach `Origin` to cross-site state-changing
 * requests, so the absence of one means this is not a browser CSRF attempt.
 */
export function requireTrustedOrigin(req: Request, _res: Response, next: NextFunction) {
  const origin = req.header('origin');

  if (!origin) {
    return next();
  }

  const normalized = origin.replace(/\/$/, '');
  if (env.allowedOrigins.includes(normalized)) {
    return next();
  }

  next(new ApiError(403, 'Request origin is not allowed'));
}
