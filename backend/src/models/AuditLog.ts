import crypto from 'crypto';
import mongoose, { Document, Schema } from 'mongoose';
import { AUDIT_ACTIONS } from '../shared/enums';
import type { AuditAction } from '../shared/enums';

/**
 * Append-only audit trail for privileged actions.
 *
 * Each entry stores the hash of the previous entry (`prevHash`) and its own
 * `hash`, forming a chain. Deleting or editing a row in the middle breaks the
 * chain and is detectable by `verifyAuditChain()`. This is not a substitute for
 * external log shipping, but it makes silent tampering obvious.
 */
export interface IAuditLog extends Document {
  action: AuditAction;
  /** `user` for admin/staff actions, `customer` for portal actions. */
  actorType: 'user' | 'customer' | 'system';
  actorId?: mongoose.Types.ObjectId;
  actorName?: string;
  actorEmail?: string;
  actorRole?: string;
  /** What was acted on. */
  entityType?: string;
  entityId?: string;
  /** Human summary shown in the audit desk. */
  summary: string;
  /** Structured before/after or request detail. Never store secrets here. */
  changes?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
  requestId?: string;
  /** Set when the action failed, e.g. a rejected overpayment. */
  outcome: 'success' | 'failure';
  prevHash?: string;
  hash: string;
  createdAt: Date;
}

const auditLogSchema = new Schema<IAuditLog>(
  {
    action: { type: String, enum: AUDIT_ACTIONS, required: true, index: true },
    actorType: {
      type: String,
      enum: ['user', 'customer', 'system'],
      default: 'user',
      index: true,
    },
    actorId: { type: Schema.Types.ObjectId, index: true },
    actorName: { type: String, maxlength: 120 },
    actorEmail: { type: String, maxlength: 200 },
    actorRole: { type: String, maxlength: 40 },
    entityType: { type: String, maxlength: 60, index: true },
    entityId: { type: String, maxlength: 80, index: true },
    summary: { type: String, required: true, maxlength: 500 },
    changes: { type: Schema.Types.Mixed },
    ip: { type: String, maxlength: 100 },
    userAgent: { type: String, maxlength: 400 },
    requestId: { type: String, maxlength: 100 },
    outcome: { type: String, enum: ['success', 'failure'], default: 'success', index: true },
    prevHash: { type: String, maxlength: 64 },
    hash: { type: String, required: true, maxlength: 64 },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

// Audit reads are almost always "recent first", optionally filtered.
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ actorId: 1, createdAt: -1 });
auditLogSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
// Retain for two years by default — compliance-friendly, bounded growth.
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 730 });

/** Stable hash over the entry's meaningful fields + the previous hash. */
export function computeAuditHash(entry: {
  prevHash?: string;
  action: string;
  actorId?: string;
  entityType?: string;
  entityId?: string;
  summary: string;
  outcome: string;
  createdAt: Date;
}): string {
  const payload = [
    entry.prevHash ?? '',
    entry.action,
    entry.actorId ?? '',
    entry.entityType ?? '',
    entry.entityId ?? '',
    entry.summary,
    entry.outcome,
    entry.createdAt.toISOString(),
  ].join('|');
  return crypto.createHash('sha256').update(payload).digest('hex');
}

export const AuditLog = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
