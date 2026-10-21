import crypto from 'crypto';
import os from 'os';
import { logger } from '../config/logger';
import { CronLock } from '../models/CronLock';

export interface CronLockHandle {
  name: string;
  token: string;
  owner: string;
}

export interface CronRunResult {
  ran: boolean;
  skipped?: 'locked';
  durationMs?: number;
  result?: unknown;
  error?: string;
}

function isDuplicateKey(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code?: number }).code === 11000,
  );
}

/** Identity of this process, so a stuck lock can be traced back to a host. */
export const CRON_OWNER = `${os.hostname()}:${process.pid}`;

/**
 * Try to take a named lease.
 *
 * The unique index on `name` is what makes this safe with several app
 * instances: the loser of an `upsert` race gets a duplicate-key error, which
 * it reads as "someone else holds the lock" and skips. A lease that is not
 * renewed expires on its own, so a crashed process never blocks a job forever.
 */
export async function acquireCronLock(
  name: string,
  ttlMs: number,
  owner = CRON_OWNER,
): Promise<CronLockHandle | null> {
  const now = new Date();
  const token = crypto.randomUUID();

  try {
    const doc = await CronLock.findOneAndUpdate(
      {
        name,
        $or: [{ lockedUntil: { $exists: false } }, { lockedUntil: { $lte: now } }],
      },
      {
        $set: {
          lockedUntil: new Date(now.getTime() + ttlMs),
          lockedBy: owner,
          lockToken: token,
        },
        $inc: { runCount: 1 },
      },
      { upsert: true, new: true },
    );
    if (doc) return { name, token, owner };
  } catch (error) {
    if (!isDuplicateKey(error)) throw error;
    // Another instance created the row first and holds a live lease.
    return null;
  }

  return null;
}

/** Release a lease. Only the holder's token can clear it. */
export async function releaseCronLock(handle: CronLockHandle): Promise<void> {
  await CronLock.updateOne(
    { name: handle.name, lockToken: handle.token },
    { $set: { lockedUntil: new Date(0) }, $unset: { lockToken: 1 } },
  );
}

/**
 * Run `fn` under a named lease.
 *
 * This is the de-duplication guarantee for the scheduler: even with several
 * app instances, a given job body runs at most once per lease window.
 */
export async function runWithCronLock<T>(
  name: string,
  ttlMs: number,
  fn: () => Promise<T>,
): Promise<CronRunResult> {
  const handle = await acquireCronLock(name, ttlMs);
  if (!handle) {
    logger.debug({ job: name }, 'Cron job skipped — another instance holds the lock');
    return { ran: false, skipped: 'locked' };
  }

  const startedAt = Date.now();
  try {
    const result = await fn();
    await CronLock.updateOne(
      { name: handle.name, lockToken: handle.token },
      { $set: { lastRunAt: new Date(), lastStatus: 'success' }, $unset: { lastError: '' } },
    );
    return { ran: true, durationMs: Date.now() - startedAt, result };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await CronLock.updateOne(
      { name: handle.name, lockToken: handle.token },
      { $set: { lastRunAt: new Date(), lastStatus: 'failure', lastError: message.slice(0, 2000) } },
    );
    return { ran: true, durationMs: Date.now() - startedAt, error: message };
  } finally {
    await releaseCronLock(handle);
  }
}

/** Rows whose lease expired long ago — safe to prune. */
export async function pruneStaleCronLocks(olderThanMs = 24 * 60 * 60 * 1000): Promise<number> {
  const cutoff = new Date(Date.now() - olderThanMs);
  const result = await CronLock.deleteMany({
    lockedUntil: { $exists: true, $lte: cutoff },
    lastRunAt: { $lt: cutoff },
  });
  return result.deletedCount ?? 0;
}

/**
 * When the named job last actually ran, according to the shared record.
 *
 * This is the scheduler's source of truth. An in-process timer would let
 * every instance run the nightly backup on its own; reading the shared row
 * means the first instance to finish marks the job as done for everyone.
 */
export async function lastCronRunAt(name: string): Promise<number> {
  const row = await CronLock.findOne({ name }).select('lastRunAt').lean();
  return row?.lastRunAt ? row.lastRunAt.getTime() : 0;
}
