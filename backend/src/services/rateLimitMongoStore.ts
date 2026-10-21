import type { ClientRateLimitInfo, Options, Store } from 'express-rate-limit';
import { RateLimitCounter } from '../models/RateLimitCounter';

function isDuplicateKey(error: unknown): boolean {
  return Boolean(
    error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code?: number }).code === 11000,
  );
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Mongo-backed store for `express-rate-limit`.
 *
 * This is the Redis-free replacement for the default MemoryStore: hit counts
 * live in Mongo, so a deploy or crash does not hand an attacker a fresh budget.
 * Each limiter gets its own prefix, because the same IP may legitimately be
 * counted separately by the global, auth, write and portal limiters.
 */
export class MongoRateLimitStore implements Store {
  /** No local keys: every instance reads the same shared Mongo counter. */
  readonly localKeys = false;

  /** Namespace for this limiter's keys — each limiter gets its own. */
  readonly prefix: string;

  private windowMs = 60_000;

  constructor(prefix: string) {
    this.prefix = prefix;
  }

  init(options: Options): void {
    this.windowMs = options.windowMs;
  }

  async increment(key: string): Promise<ClientRateLimitInfo> {
    const now = new Date();
    const resetAt = new Date(now.getTime() + this.windowMs);
    const fullKey = `${this.prefix}:${key}`;

    // One atomic pipeline update handles both "window still open" and "window
    // expired" without a read-then-write race between instances.
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const doc = await RateLimitCounter.collection.findOneAndUpdate(
          { key: fullKey },
          [
            {
              $set: {
                count: {
                  $cond: [
                    { $gt: ['$resetAt', now] },
                    { $add: [{ $ifNull: ['$count', 0] }, 1] },
                    1,
                  ],
                },
                resetAt: {
                  $cond: [{ $gt: ['$resetAt', now] }, '$resetAt', resetAt],
                },
              },
            },
          ],
          { upsert: true, returnDocument: 'after' },
        );

        if (doc) {
          return {
            totalHits: Number(doc.count ?? 1),
            resetTime: doc.resetAt instanceof Date ? doc.resetAt : new Date(doc.resetAt),
          };
        }
      } catch (error) {
        // Two first requests can race to insert the same key. The loser retries
        // and hits the existing row instead.
        if (!isDuplicateKey(error) || attempt === 1) throw error;
      }
    }

    throw new Error(`Unable to increment rate-limit counter ${fullKey}`);
  }

  async decrement(key: string): Promise<void> {
    await RateLimitCounter.updateOne(
      { key: `${this.prefix}:${key}`, count: { $gt: 0 } },
      { $inc: { count: -1 } },
    );
  }

  async resetKey(key: string): Promise<void> {
    await RateLimitCounter.deleteOne({ key: `${this.prefix}:${key}` });
  }

  async resetAll(): Promise<void> {
    await RateLimitCounter.deleteMany({
      key: { $regex: `^${escapeRegex(this.prefix)}:` },
    });
  }

  async get(key: string): Promise<ClientRateLimitInfo | undefined> {
    const doc = await RateLimitCounter.findOne({ key: `${this.prefix}:${key}` }).lean();
    if (!doc) return undefined;
    if (doc.resetAt.getTime() <= Date.now()) return undefined;
    return { totalHits: doc.count, resetTime: doc.resetAt };
  }

  async shutdown(): Promise<void> {
    // Nothing to close: Mongo connections are owned by the app, not the store.
  }
}
