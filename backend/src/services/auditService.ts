import type { Request } from 'express';
import { AuditLog, computeAuditHash } from '../models/AuditLog';
import type { AuditAction } from '../shared/enums';
import { logger } from '../config/logger';

export interface AuditActor {
  type?: 'user' | 'customer' | 'system';
  id?: string;
  name?: string;
  email?: string;
  role?: string;
}

export interface AuditInput {
  action: AuditAction;
  actor?: AuditActor;
  entityType?: string;
  entityId?: string;
  summary: string;
  changes?: Record<string, unknown>;
  outcome?: 'success' | 'failure';
}

/**
 * Append one audit entry.
 *
 * Writes are serialized through an in-process queue so the `prevHash` chain is
 * linear rather than forked when several admin requests land at once. (Render
 * runs a single instance; if you scale horizontally, ship the logs to an
 * external sink as well — the chain is then per-instance.)
 *
 * Audit writes must never break the business operation, so failures are logged
 * and swallowed.
 */
let auditWriteQueue: Promise<unknown> = Promise.resolve();

export async function recordAudit(input: AuditInput, req?: Request): Promise<void> {
  // Tell the fallback `autoAudit` middleware this request is already covered,
  // so structured events are not duplicated by a generic entry.
  if (req) req.auditRecorded = true;

  const run = async () => {
    try {
      const previous = await AuditLog.findOne()
        .sort({ createdAt: -1, _id: -1 })
        .select('hash')
        .lean();

      const createdAt = new Date();
      const prevHash = previous?.hash;
      const actorId = input.actor?.id;

      const hash = computeAuditHash({
        prevHash,
        action: input.action,
        actorId,
        entityType: input.entityType,
        entityId: input.entityId,
        summary: input.summary,
        outcome: input.outcome ?? 'success',
        createdAt,
      });

      await AuditLog.create({
        action: input.action,
        actorType: input.actor?.type ?? 'user',
        actorId,
        actorName: input.actor?.name,
        actorEmail: input.actor?.email,
        actorRole: input.actor?.role,
        entityType: input.entityType,
        entityId: input.entityId,
        summary: input.summary.slice(0, 500),
        changes: input.changes,
        ip: req?.ip,
        userAgent: req?.header('user-agent')?.slice(0, 400),
        requestId: String(req?.headers['x-request-id'] ?? ''),
        outcome: input.outcome ?? 'success',
        prevHash,
        hash,
        // Pin the timestamp used in the hash — Mongoose would otherwise stamp
        // its own `createdAt`, which can differ by a millisecond and break
        // verification.
        createdAt,
      });
    } catch (error) {
      logger.error({ err: error, action: input.action }, 'Audit write failed');
    }
  };

  const queued = auditWriteQueue.then(run, run);
  // Keep the queue alive even if a write rejects.
  auditWriteQueue = queued.catch(() => undefined);
  await queued;
}

/** Build an actor descriptor from the authenticated request. */
export function actorFromRequest(req: Request): AuditActor {
  return {
    type: req.user?.role === 'customer' ? 'customer' : 'user',
    id: req.user?.id,
    role: req.user?.role,
  };
}

export interface AuditQuery {
  page?: number;
  limit?: number;
  action?: string;
  actorId?: string;
  entityType?: string;
  entityId?: string;
  outcome?: 'success' | 'failure';
  from?: string;
  to?: string;
  q?: string;
}

/** Paginated audit feed for the admin desk. */
export async function listAuditLogs(query: AuditQuery) {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 25));

  const filter: Record<string, unknown> = {};
  if (query.action) filter.action = query.action;
  if (query.actorId) filter.actorId = query.actorId;
  if (query.entityType) filter.entityType = query.entityType;
  if (query.entityId) filter.entityId = query.entityId;
  if (query.outcome) filter.outcome = query.outcome;

  if (query.from || query.to) {
    const range: Record<string, Date> = {};
    if (query.from) range.$gte = new Date(query.from);
    if (query.to) range.$lte = new Date(query.to);
    filter.createdAt = range;
  }

  if (query.q) {
    const { escapeRegex } = await import('../utils/query');
    const regex = new RegExp(escapeRegex(String(query.q)), 'i');
    filter.$or = [{ summary: regex }, { actorEmail: regex }, { actorName: regex }];
  }

  const [items, total] = await Promise.all([
    AuditLog.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    AuditLog.countDocuments(filter),
  ]);

  return {
    items: items.map((row) => ({
      id: String(row._id),
      action: row.action,
      actorType: row.actorType,
      actorId: row.actorId ? String(row.actorId) : undefined,
      actorName: row.actorName,
      actorEmail: row.actorEmail,
      actorRole: row.actorRole,
      entityType: row.entityType,
      entityId: row.entityId,
      summary: row.summary,
      changes: row.changes,
      ip: row.ip,
      outcome: row.outcome,
      createdAt: row.createdAt.toISOString(),
    })),
    pagination: {
      page,
      limit,
      total,
      pages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

/**
 * Walk the chain and report the first broken link. Used by the audit desk's
 * "verify integrity" action and by ops.
 */
export async function verifyAuditChain(limit = 5_000) {
  const rows = await AuditLog.find()
    .sort({ createdAt: 1, _id: 1 })
    .limit(limit)
    .select('hash prevHash action actorId entityType entityId summary outcome createdAt')
    .lean();

  let previousHash: string | undefined;
  for (const row of rows) {
    const expected = computeAuditHash({
      prevHash: row.prevHash,
      action: row.action,
      actorId: row.actorId ? String(row.actorId) : undefined,
      entityType: row.entityType,
      entityId: row.entityId,
      summary: row.summary,
      outcome: row.outcome,
      createdAt: row.createdAt,
    });

    if (row.prevHash && previousHash && row.prevHash !== previousHash) {
      // A fork means two writers raced before the queue existed. Report it,
      // but only as a warning-worthy break rather than a corrupted hash.
      return {
        valid: false,
        checked: rows.length,
        brokenAt: String(row._id),
        reason: 'chain',
      };
    }
    if (expected !== row.hash) {
      return { valid: false, checked: rows.length, brokenAt: String(row._id), reason: 'hash' };
    }
    previousHash = row.hash;
  }

  return { valid: true, checked: rows.length };
}
