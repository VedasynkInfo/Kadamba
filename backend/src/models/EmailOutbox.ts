import mongoose, { Document, Schema } from 'mongoose';

/**
 * Durable outbox for outbound email.
 *
 * Email is not sent inside the request that caused it. The request writes a
 * row here and returns; a cron drainer claims due rows, sends them through the
 * configured SMTP transport, and records the result. That is what lets a
 * process be killed mid-send without losing the message: the row is still in
 * Mongo on the next boot.
 *
 * Delivery is at-least-once by nature (SMTP has no cross-process idempotency
 * key), so every enqueue carries an optional `dedupeKey` and every send carries
 * a stable Message-ID derived from the row id. A retry after a crash can be
 * recognised by receivers that honour duplicate Message-IDs, while ordinary
 * application retries cannot create a second row at all.
 */
export const EMAIL_OUTBOX_STATUSES = ['pending', 'sending', 'sent', 'failed'] as const;
export type EmailOutboxStatus = (typeof EMAIL_OUTBOX_STATUSES)[number];

export interface IEmailOutbox extends Document {
  /** Stable key that makes enqueueing the same notification idempotent. */
  dedupeKey?: string;
  to: string;
  subject: string;
  html: string;
  text?: string;
  /** Logical notification kind, for logs and dashboards. */
  kind: string;
  status: EmailOutboxStatus;
  attempts: number;
  maxAttempts: number;
  nextAttemptAt: Date;
  /** Lease held by the drainer currently sending this row. */
  lockedAt?: Date;
  lockToken?: string;
  lastError?: string;
  sentAt?: Date;
  failedAt?: Date;
  /** Set on terminal states so Mongo TTL can bound the ledger. */
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const emailOutboxSchema = new Schema<IEmailOutbox>(
  {
    dedupeKey: { type: String, trim: true, maxlength: 300 },
    to: { type: String, required: true, trim: true, maxlength: 320 },
    subject: { type: String, required: true, trim: true, maxlength: 500 },
    html: { type: String, required: true },
    text: { type: String },
    kind: { type: String, required: true, trim: true, maxlength: 80, index: true },
    status: {
      type: String,
      enum: EMAIL_OUTBOX_STATUSES,
      default: 'pending',
      index: true,
    },
    attempts: { type: Number, default: 0, min: 0 },
    maxAttempts: { type: Number, default: 5, min: 1, max: 20 },
    nextAttemptAt: { type: Date, default: () => new Date(), index: true },
    lockedAt: { type: Date },
    lockToken: { type: String, maxlength: 120 },
    lastError: { type: String, maxlength: 2000 },
    sentAt: { type: Date },
    failedAt: { type: Date },
    expiresAt: { type: Date },
  },
  { timestamps: true },
);

// Drainer query: due pending rows, oldest first.
emailOutboxSchema.index({ status: 1, nextAttemptAt: 1, createdAt: 1 });
// Stale lease recovery: sending rows whose lease expired after a crash.
emailOutboxSchema.index({ status: 1, lockedAt: 1 });
// Idempotent enqueue. Sparse because most rows have no dedupe key.
emailOutboxSchema.index({ dedupeKey: 1 }, { unique: true, sparse: true });
// Terminal rows are retained for a bounded audit window.
emailOutboxSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const EmailOutbox = mongoose.model<IEmailOutbox>('EmailOutbox', emailOutboxSchema);
