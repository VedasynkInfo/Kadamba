import { logger } from '../config/logger';
import { ApiError } from '../utils/ApiError';

/**
 * A bounded in-process work queue.
 *
 * Phase 10 deliberately does not add a Redis/Bull dependency. Heavy work that
 * used to run inline (image encoding, CSV/report exports, bulk catalogue
 * imports) is queued here instead: requests wait for their own job, but only
 * `concurrency` jobs touch the CPU at once, so one large upload cannot starve
 * the event loop for every other request.
 *
 * This is not a durable queue. Durable, cross-process work (email) lives in
 * `EmailOutbox`; this pool is for request-scoped work where losing the process
 * simply loses the request too.
 */
export interface JobPoolOptions {
  name: string;
  concurrency: number;
  maxQueue?: number;
}

export interface JobPoolStats {
  name: string;
  concurrency: number;
  active: number;
  queued: number;
  completed: number;
  failed: number;
  rejected: number;
  oldestQueuedMs: number | null;
}

interface QueuedJob {
  label: string;
  enqueuedAt: number;
  task: () => Promise<unknown>;
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
}

export class JobPool {
  readonly name: string;
  readonly concurrency: number;
  readonly maxQueue: number;

  private readonly queue: QueuedJob[] = [];
  private active = 0;
  private completed = 0;
  private failed = 0;
  private rejected = 0;

  constructor(options: JobPoolOptions) {
    if (!Number.isInteger(options.concurrency) || options.concurrency < 1) {
      throw new Error('JobPool concurrency must be a positive integer');
    }
    this.name = options.name;
    this.concurrency = options.concurrency;
    this.maxQueue = options.maxQueue ?? 100;
  }

  /**
   * Queue `task` and resolve with its result. Rejects immediately when the
   * backlog is full rather than growing without bound.
   */
  run<T>(label: string, task: () => Promise<T>): Promise<T> {
    if (this.queue.length >= this.maxQueue) {
      this.rejected += 1;
      logger.warn(
        { pool: this.name, label, queued: this.queue.length, maxQueue: this.maxQueue },
        'Job pool queue is full',
      );
      return Promise.reject(
        new ApiError(503, 'The server is busy. Please try again in a moment.', undefined, 'INTERNAL'),
      );
    }

    return new Promise<T>((resolve, reject) => {
      this.queue.push({
        label,
        enqueuedAt: Date.now(),
        task,
        resolve: resolve as (value: unknown) => void,
        reject,
      });
      this.pump();
    });
  }

  stats(): JobPoolStats {
    return {
      name: this.name,
      concurrency: this.concurrency,
      active: this.active,
      queued: this.queue.length,
      completed: this.completed,
      failed: this.failed,
      rejected: this.rejected,
      oldestQueuedMs: this.queue.length ? Date.now() - this.queue[0].enqueuedAt : null,
    };
  }

  /** Wait until every queued job has started and finished (bounded by caller). */
  async waitForIdle(timeoutMs = 10_000): Promise<boolean> {
    const deadline = Date.now() + timeoutMs;
    while (this.active > 0 || this.queue.length > 0) {
      if (Date.now() >= deadline) return false;
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
    return true;
  }

  private pump() {
    while (this.active < this.concurrency && this.queue.length > 0) {
      const job = this.queue.shift();
      if (!job) return;
      this.active += 1;
      void this.execute(job);
    }
  }

  private async execute(job: QueuedJob) {
    const startedAt = Date.now();
    try {
      const result = await job.task();
      this.completed += 1;
      job.resolve(result);
      logger.debug(
        { pool: this.name, label: job.label, durationMs: Date.now() - startedAt },
        'Job completed',
      );
    } catch (error) {
      this.failed += 1;
      job.reject(error);
      logger.error(
        {
          pool: this.name,
          label: job.label,
          durationMs: Date.now() - startedAt,
          err: error,
        },
        'Job failed',
      );
    } finally {
      this.active -= 1;
      this.pump();
    }
  }
}

/** Image decode/encode jobs. Sharp already uses libuv threads; this bounds requests. */
export const imageJobPool = new JobPool({ name: 'images', concurrency: 2, maxQueue: 100 });

/** CSV and report generation — CPU-light but potentially long-running. */
export const exportJobPool = new JobPool({ name: 'exports', concurrency: 2, maxQueue: 25 });

/** Catalogue imports and bulk writes, serialised to keep Mongo writes predictable. */
export const bulkJobPool = new JobPool({ name: 'bulk', concurrency: 1, maxQueue: 10 });

export function allJobPoolStats(): JobPoolStats[] {
  return [imageJobPool.stats(), exportJobPool.stats(), bulkJobPool.stats()];
}

/** Graceful shutdown: let in-flight work finish, but never hang the process. */
export async function drainJobPools(timeoutMs = 8_000): Promise<boolean> {
  const results = await Promise.all([
    imageJobPool.waitForIdle(timeoutMs),
    exportJobPool.waitForIdle(timeoutMs),
    bulkJobPool.waitForIdle(timeoutMs),
  ]);
  return results.every(Boolean);
}
