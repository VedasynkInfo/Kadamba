import type { NextFunction, Request, Response } from 'express';
import type { UserRole } from '../models/User';
import type { Permission } from '../shared/enums';
import { ApiError } from '../utils/ApiError';
import { verifyAccessToken, getUserState, type AccessClaims } from '../services/tokenService';

export interface AuthPayload {
  id: string;
  role: UserRole;
  customerId?: string;
  /** Token version — compared against the user's current version. */
  tv?: number;
  /** Session family, used for "active sessions" and targeted revocation. */
  sid?: string;
  /**
   * Capabilities resolved from the database on each request (never taken from
   * the token, so a permission change takes effect immediately). Not part of
   * the signed JWT.
   */
  permissions?: string[];
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
      /**
       * Set by `recordAudit` when a handler writes its own structured audit
       * entry. The fallback `autoAudit` middleware uses it to avoid logging the
       * same request twice.
       */
      auditRecorded?: boolean;
    }
  }
}

function extractToken(req: Request): string | undefined {
  const header = req.header('Authorization');
  if (header?.startsWith('Bearer ')) {
    return header.slice(7).trim();
  }
  return undefined;
}

/**
 * Verify the access token, then confirm the session is still valid.
 *
 * Two independent revocation nets:
 *  1. `tokenVersion` must match the user's current version (password change,
 *     forced sign-out, role change).
 *  2. `status` must be `active` (disable a user → dead within the 60s cache).
 */
export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const token = extractToken(req);
    if (!token) {
      throw ApiError.unauthenticated('No authentication token found');
    }

    let claims: AccessClaims;
    try {
      claims = verifyAccessToken(token);
    } catch (err) {
      const expired = err instanceof Error && err.name === 'TokenExpiredError';
      throw expired
        ? ApiError.tokenExpired('Access token expired')
        : ApiError.unauthenticated('Invalid access token');
    }

    if (!claims.id) {
      throw ApiError.unauthenticated('Invalid access token');
    }

    const state = await getUserState(claims.id);
    if (!state) {
      throw new ApiError(401, 'Session no longer valid');
    }
    if (state.status !== 'active') {
      throw new ApiError(403, 'Account is disabled');
    }
    if ((claims.tv ?? 0) !== state.tokenVersion) {
      throw new ApiError(401, 'Session has been revoked. Please sign in again.');
    }

    req.user = {
      id: claims.id,
      role: state.role as UserRole,
      customerId: claims.customerId,
      tv: claims.tv,
      sid: claims.sid,
      permissions: state.role === 'admin' ? ['*'] : state.permissions,
    };
    next();
  } catch (err) {
    next(err);
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

/**
 * Fine-grained capability gate. Admins implicitly hold every permission.
 *
 * Capabilities come from `req.user.permissions`, which `authenticate` resolves
 * from the database (60s cache) — never from the token. That means a permission
 * change takes effect on the user's next request without forcing a re-login.
 */
export function requirePermission(...permissions: Permission[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ApiError(401, 'Authentication required'));
    }
    if (req.user.role === 'admin') {
      return next();
    }

    const granted = new Set(req.user.permissions ?? []);
    const missing = permissions.filter((permission) => !granted.has(permission));
    if (missing.length > 0) {
      return next(new ApiError(403, 'Insufficient permissions', [{ missing }]));
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
