import crypto from 'crypto';
import { sendEmail } from '../config/email';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { EmailOutbox, type IEmailOutbox } from '../models/EmailOutbox';

export interface EnqueueEmailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
  kind: string;
  /** Makes repeated enqueues of the same notification a no-op. */
  dedupeKey?: string;
  maxAttempts?: number;
  /** Optional delay before the first attempt. */
  nextAttemptAt?: Date;
}

export interface EnqueueEmailResult {
  id: string;
  duplicate: boolean;
}

export interface EmailOutboxStats {
  pending: number;
  sending: number;
  sent: number;
  failed: number;
  due: number;
}

export interface DrainEmailResult {
  claimed: number;
  sent: number;
  failed: number;
  retried: number;
}

type EmailSender = (options: {
  to: string;
  subject: string;
  html: string;
  text?: string;
  messageId?: string;
}) => Promise<void>;

function isDuplicateKey(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code?: number }).code === 11000,
  );
}

/** Exponential backoff with a small deterministic jitter, capped. */
export function backoffDelayMs(
  attempts: number,
  baseMs = env.emailOutbox.baseBackoffMs,
  maxMs = env.emailOutbox.maxBackoffMs,
): number {
  const exponent = Math.max(0, attempts - 1);
  const raw = Math.min(maxMs, baseMs * 2 ** exponent);
  // Up to 20% jitter keeps a burst of failed messages from retrying in lockstep.
  const jitter = raw * 0.2 * ((attempts * 2654435761) % 1000) / 1000;
  return Math.round(raw + jitter);
}

function terminalExpiry(now = Date.now()): Date {
  return new Date(now + env.emailOutbox.retentionDays * 24 * 60 * 60 * 1000);
}

/**
 * Persist an email instead of sending it inline. The caller gets a durable id;
 * the cron drainer is responsible for actual delivery.
 */
export async function enqueueEmail(input: EnqueueEmailInput): Promise<EnqueueEmailResult> {
  const to = input.to?.trim();
  if (!to) throw new Error('Cannot enqueue email without a recipient');
  if (!input.subject?.trim()) throw new Error('Cannot enqueue email without a subject');

  // A duplicate notification is a no-op. The lookup handles the common case
  // (a retried request); the unique index on `dedupeKey` closes the race
  // between two simultaneous enqueues.
  if (input.dedupeKey) {
    const existing = await EmailOutbox.findOne({ dedupeKey: input.dedupeKey })
      .select('_id')
      .lean();
    if (existing) return { id: String(existing._id), duplicate: true };
  }

  const payload = {
    to,
    subject: input.subject.trim(),
    html: input.html,
    text: input.text,
    kind: input.kind,
    dedupeKey: input.dedupeKey,
    maxAttempts: Math.min(20, Math.max(1, input.maxAttempts ?? env.emailOutbox.maxAttempts)),
    nextAttemptAt: input.nextAttemptAt ?? new Date(),
    status: 'pending' as const,
  };

  try {
    const row = await EmailOutbox.create(payload);
    return { id: String(row._id), duplicate: false };
  } catch (error) {
    if (isDuplicateKey(error) && input.dedupeKey) {
      const existing = await EmailOutbox.findOne({ dedupeKey: input.dedupeKey }).select('_id').lean();
      if (existing) return { id: String(existing._id), duplicate: true };
    }
    throw error;
  }
}

/**
 * Atomically claim one due row.
 *
 * `status: 'sending'` + a lease token is the lock. If the process dies after
 * claiming but before recording the result, the lease expires and the row is
 * reclaimed. A fresh lease prevents a second worker from sending concurrently.
 */
async function claimOne(now: number): Promise<IEmailOutbox | null> {
  const staleBefore = new Date(now - env.emailOutbox.leaseMs);
  return EmailOutbox.findOneAndUpdate(
    {
      $or: [
        { status: 'pending', nextAttemptAt: { $lte: new Date(now) } },
        { status: 'sending', lockedAt: { $lt: staleBefore } },
      ],
    },
    {
      $set: {
        status: 'sending',
        lockedAt: new Date(now),
        lockToken: crypto.randomUUID(),
      },
      $inc: { attempts: 1 },
    },
    { new: true, sort: { createdAt: 1 } },
  );
}

async function deliverClaimed(
  row: IEmailOutbox,
  send: EmailSender,
  now: number,
): Promise<'sent' | 'retried' | 'failed'> {
  try {
    await send({
      to: row.to,
      subject: row.subject,
      html: row.html,
      text: row.text,
      // A stable Message-ID lets receiving systems collapse a retry after a
      // crash. SMTP cannot promise true exactly-once, but this is the strongest
      // idempotency signal available without a provider-side API.
      messageId: `<outbox-${String(row._id)}@kadamba.local>`,
    });

    await EmailOutbox.updateOne(
      { _id: row._id, lockToken: row.lockToken },
      {
        $set: { status: 'sent', sentAt: new Date(now), expiresAt: terminalExpiry(now) },
        $unset: { lockedAt: 1, lockToken: 1, lastError: 1 },
      },
    );
    return 'sent';
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const terminal = row.attempts >= row.maxAttempts;
    const nextAttemptAt = new Date(now + backoffDelayMs(row.attempts));

    await EmailOutbox.updateOne(
      { _id: row._id, lockToken: row.lockToken },
      {
        $set: terminal
          ? {
              status: 'failed',
              failedAt: new Date(now),
              expiresAt: terminalExpiry(now),
              lastError: message.slice(0, 2000),
            }
          : {
              status: 'pending',
              nextAttemptAt,
              lastError: message.slice(0, 2000),
            },
        $unset: { lockedAt: 1, lockToken: 1 },
      },
    );

    logger.warn(
      {
        emailId: String(row._id),
        kind: row.kind,
        attempts: row.attempts,
        terminal,
        nextAttemptAt: terminal ? undefined : nextAttemptAt,
        err: error,
      },
      'Email outbox delivery failed',
    );
    return terminal ? 'failed' : 'retried';
  }
}

/**
 * Drain up to `limit` due emails. Safe to call concurrently: each row is
 * claimed atomically, and a stale lease is recovered after a crash.
 */
export async function drainEmailOutbox(
  options: { limit?: number; now?: number; send?: EmailSender } = {},
): Promise<DrainEmailResult> {
  const limit = Math.max(1, options.limit ?? env.emailOutbox.batchSize);
  const now = options.now ?? Date.now();
  const send = options.send ?? sendEmail;

  const claimed: IEmailOutbox[] = [];
  for (let i = 0; i < limit; i += 1) {
    const row = await claimOne(now);
    if (!row) break;
    claimed.push(row);
  }

  if (claimed.length === 0) {
    return { claimed: 0, sent: 0, failed: 0, retried: 0 };
  }

  const outcomes = await Promise.allSettled(claimed.map((row) => deliverClaimed(row, send, now)));
  const result: DrainEmailResult = { claimed: claimed.length, sent: 0, failed: 0, retried: 0 };
  for (const outcome of outcomes) {
    if (outcome.status === 'rejected') {
      result.failed += 1;
      logger.error({ err: outcome.reason }, 'Email outbox drain worker crashed');
      continue;
    }
    result[outcome.value] += 1;
  }
  return result;
}

export async function getEmailOutboxStats(now = Date.now()): Promise<EmailOutboxStats> {
  const [pending, sending, sent, failed, due] = await Promise.all([
    EmailOutbox.countDocuments({ status: 'pending' }),
    EmailOutbox.countDocuments({ status: 'sending' }),
    EmailOutbox.countDocuments({ status: 'sent' }),
    EmailOutbox.countDocuments({ status: 'failed' }),
    EmailOutbox.countDocuments({ status: 'pending', nextAttemptAt: { $lte: new Date(now) } }),
  ]);
  return { pending, sending, sent, failed, due };
}

/** Remove terminal rows immediately (the normal path is Mongo TTL). */
export async function purgeTerminalEmails(olderThanDays = env.emailOutbox.retentionDays): Promise<number> {
  const cutoff = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
  const result = await EmailOutbox.deleteMany({
    status: { $in: ['sent', 'failed'] },
    updatedAt: { $lt: cutoff },
  });
  return result.deletedCount ?? 0;
}
