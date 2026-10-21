import mongoose, { Document, Schema } from 'mongoose';

/**
 * A Mongo-backed mutex for scheduled work.
 *
 * The application may run on more than one instance (Render can overlap old and
 * new containers during a deploy). Every cron job takes a named lease before it
 * runs, so two instances cannot send the same reminder or start two backups.
 * A crashed holder simply lets its lease expire.
 */
export interface ICronLock extends Document {
  name: string;
  /** Epoch millis at which the current holder's lease expires. */
  lockedUntil?: Date;
  /** Human-readable holder, e.g. `host:pid:uuid`. */
  lockedBy?: string;
  /** Random token so a holder can release only its own lease. */
  lockToken?: string;
  lastRunAt?: Date;
  lastStatus?: 'success' | 'failure';
  lastError?: string;
  runCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const cronLockSchema = new Schema<ICronLock>(
  {
    name: { type: String, required: true, unique: true, trim: true, maxlength: 120 },
    lockedUntil: { type: Date },
    lockedBy: { type: String, maxlength: 200 },
    lockToken: { type: String, maxlength: 120 },
    lastRunAt: { type: Date },
    lastStatus: { type: String, enum: ['success', 'failure'] },
    lastError: { type: String, maxlength: 2000 },
    runCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
);

cronLockSchema.index({ lockedUntil: 1 });

export const CronLock = mongoose.model<ICronLock>('CronLock', cronLockSchema);
