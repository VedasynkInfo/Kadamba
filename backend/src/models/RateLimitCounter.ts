import mongoose, { Document, Schema } from 'mongoose';

/**
 * Durable hit counters for `express-rate-limit`.
 *
 * The default MemoryStore forgets every counter on restart, which means a
 * deploy (or a crash loop) resets a brute-force budget. This collection is the
 * Redis-free replacement: one row per limiter key, removed automatically once
 * its window has passed.
 */
export interface IRateLimitCounter extends Document {
  key: string;
  count: number;
  resetAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const rateLimitCounterSchema = new Schema<IRateLimitCounter>(
  {
    key: { type: String, required: true, unique: true },
    count: { type: Number, required: true, default: 0, min: 0 },
    resetAt: { type: Date, required: true },
  },
  { timestamps: true },
);

// Mongo removes a counter after its window ends. The store also treats an
// expired row as absent, so correctness does not depend on TTL timing.
rateLimitCounterSchema.index({ resetAt: 1 }, { expireAfterSeconds: 0 });

export const RateLimitCounter = mongoose.model<IRateLimitCounter>(
  'RateLimitCounter',
  rateLimitCounterSchema,
);
