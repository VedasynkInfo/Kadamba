import type { CookieOptions, Response } from 'express';
import { env } from '../config/env';
import { expiresInToSeconds } from '../services/tokenService';

/**
 * Refresh-token cookie.
 *
 * Scoped to `/api/auth` so it is not sent on every API call — it only travels
 * to the two endpoints that need it (refresh + logout), which also shrinks the
 * CSRF surface. The portal uses a separate cookie so an admin session and a
 * customer session can coexist in one browser.
 */
function baseOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: env.cookie.secure,
    sameSite: env.cookie.sameSite,
    path: '/api/auth',
    ...(env.cookie.domain ? { domain: env.cookie.domain } : {}),
  };
}

export function setRefreshCookie(res: Response, token: string, name?: string) {
  res.cookie(name || env.cookie.refreshName, token, {
    ...baseOptions(),
    maxAge: expiresInToSeconds(env.refreshExpiresIn) * 1000,
  });
}

export function clearRefreshCookie(res: Response, name?: string) {
  res.clearCookie(name || env.cookie.refreshName, baseOptions());
}

/** Portal cookie is scoped to `/api/portal` for the same reason. */
export function setPortalRefreshCookie(res: Response, token: string, name?: string) {
  res.cookie(name || `${env.cookie.refreshName}_portal`, token, {
    ...baseOptions(),
    path: '/api/portal',
    maxAge: expiresInToSeconds(env.refreshExpiresIn) * 1000,
  });
}

export function clearPortalRefreshCookie(res: Response, name?: string) {
  res.clearCookie(name || `${env.cookie.refreshName}_portal`, {
    ...baseOptions(),
    path: '/api/portal',
  });
}

export function refreshCookieName() {
  return env.cookie.refreshName;
}

export function portalRefreshCookieName() {
  return `${env.cookie.refreshName}_portal`;
}
