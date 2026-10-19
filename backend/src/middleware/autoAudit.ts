import type { NextFunction, Request, Response } from 'express';
import { recordAudit, actorFromRequest } from '../services/auditService';

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Fallback audit trail for admin/staff writes.
 *
 * High-value operations (sign-in, payments, order transitions, staff and
 * permission changes) record their own structured event via `recordAudit`,
 * which flags the request as covered. Everything else — a catalog edit, a
 * content tweak, a settings save — would otherwise vanish. This middleware
 * closes that gap so *every* successful mutation leaves an immutable trace.
 *
 * Runs at the request stage but writes on `finish`, so it sees the final status
 * code and the identity that `authenticate` attached midway through the chain.
 */
export function autoAudit(req: Request, res: Response, next: NextFunction) {
  if (!WRITE_METHODS.has(req.method)) return next();

  res.on('finish', () => {
    // Only successful, authenticated admin/staff actions. Failures on the
    // sensitive paths are already recorded explicitly with their reason.
    if (res.statusCode < 200 || res.statusCode >= 400) return;
    if (req.auditRecorded) return;

    const role = req.user?.role;
    if (role !== 'admin' && role !== 'staff') return;

    // Log the route shape only — never the query string, which can carry
    // search terms or identifiers we do not need to duplicate.
    const route = `${req.baseUrl}${req.path}`;
    const segments = route.split('/').filter(Boolean);
    const entityType = segments[1] ?? segments[0] ?? 'request';

    void recordAudit(
      {
        action: 'admin.request',
        actor: actorFromRequest(req),
        entityType,
        summary: `${req.method} ${route}`,
        changes: { status: res.statusCode },
      },
      req,
    ).catch(() => undefined);
  });

  next();
}
