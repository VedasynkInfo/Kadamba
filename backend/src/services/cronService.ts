import { env } from '../config/env';
import { logger } from '../config/logger';
import { drainEmailOutbox } from './emailOutboxService';
import { lastCronRunAt, runWithCronLock } from './cronLockService';
import {
  cleanupOrphans,
  runNightlyBackup,
  sendFollowUpReminders,
  sendTrialDeliveryReminders,
} from './cronJobs';

/**
 * In-process scheduler.
 *
 * There is no Redis and no external cron service: the API process wakes on a
 * timer and runs the jobs itself. Every job body is wrapped in a Mongo-backed
 * lock, so running several instances (or overlapping a deploy) still executes
 * each job exactly once per window.
 *
 * Timers are unref'd so they never keep the process alive on its own, and the
 * whole scheduler is disabled under `NODE_ENV=test` so tests drive the jobs
 * explicitly.
 */
export interface CronJobDefinition {
  name: string;
  /** How often the job is attempted. */
  intervalMs: number;
  /**
   * Local server time the job should first run on a given day. Jobs with this
   * set are attempted once per calendar day, at or after that time.
   */
  dailyAt?: { hour: number; minute: number };
  /** Lease length; must exceed the job's expected runtime. */
  lockTtlMs: number;
  run: () => Promise<unknown>;
}

export const CRON_JOBS: CronJobDefinition[] = [
  {
    name: 'email-outbox',
    intervalMs: env.cron.emailDrainIntervalMs,
    lockTtlMs: 5 * 60_000,
    run: () => (env.emailOutbox.enabled ? drainEmailOutbox() : Promise.resolve(undefined)),
  },
  {
    name: 'lead-followups',
    intervalMs: env.cron.followUpIntervalMs,
    lockTtlMs: 10 * 60_000,
    run: () => sendFollowUpReminders(),
  },
  {
    name: 'order-reminders',
    intervalMs: env.cron.reminderIntervalMs,
    lockTtlMs: 10 * 60_000,
    run: () => sendTrialDeliveryReminders(),
  },
  {
    name: 'orphan-cleanup',
    intervalMs: 24 * 60 * 60_000,
    dailyAt: { hour: env.cron.cleanupHour, minute: env.cron.cleanupMinute },
    lockTtlMs: 30 * 60_000,
    run: () => cleanupOrphans(),
  },
  {
    name: 'nightly-backup',
    intervalMs: 24 * 60 * 60_000,
    dailyAt: { hour: env.cron.backupHour, minute: env.cron.backupMinute },
    lockTtlMs: 60 * 60_000,
    run: () => runNightlyBackup(),
  },
];

interface JobState {
  lastRunAt: number;
  running: boolean;
}

const states = new Map<string, JobState>();
let timer: NodeJS.Timeout | null = null;

/** True when the job may run at `now` given its schedule and last run. */
export function isJobDue(job: CronJobDefinition, now: number, lastRunAt: number): boolean {
  if (job.dailyAt) {
    const date = new Date(now);
    const dueAt = new Date(date);
    dueAt.setHours(job.dailyAt.hour, job.dailyAt.minute, 0, 0);
    if (now < dueAt.getTime()) return false;
    if (!lastRunAt) return true;
    // Once per calendar day.
    const last = new Date(lastRunAt);
    return (
      last.getFullYear() !== date.getFullYear() ||
      last.getMonth() !== date.getMonth() ||
      last.getDate() !== date.getDate()
    );
  }
  return now - lastRunAt >= job.intervalMs;
}

/** Run one job now, honouring its lock. Exposed for tests and manual runs. */
export async function runCronJob(name: string): Promise<unknown> {
  const job = CRON_JOBS.find((j) => j.name === name);
  if (!job) throw new Error(`Unknown cron job: ${name}`);

  const state = states.get(name) ?? { lastRunAt: 0, running: false };
  if (state.running) {
    logger.debug({ job: name }, 'Cron job already running in this process — skipping');
    return undefined;
  }
  state.running = true;
  states.set(name, state);

  try {
    const outcome = await runWithCronLock(name, job.lockTtlMs, job.run);
    if (outcome.error) {
      logger.error({ job: name, err: outcome.error }, 'Cron job failed');
    } else if (outcome.ran) {
      logger.info({ job: name, durationMs: outcome.durationMs, result: outcome.result }, 'Cron job finished');
    }
    // Only a run that actually happened counts as "last run" — a job skipped
    // because another instance held the lock has not run here.
    if (outcome.ran) state.lastRunAt = Date.now();
    return outcome.result;
  } finally {
    state.running = false;
    states.set(name, state);
  }
}

async function tick() {
  const now = Date.now();
  for (const job of CRON_JOBS) {
    const state = states.get(job.name) ?? { lastRunAt: 0, running: false };
    if (state.running) continue;

    // The shared lock row is the source of truth for "when did this job last
    // run". An in-process clock would let every instance run the nightly
    // backup on its own; the shared record means the first instance to finish
    // marks the job done for everyone.
    const lastRunAt = await lastCronRunAt(job.name);
    if (!isJobDue(job, now, lastRunAt)) continue;

    // Fire and forget — the job's own lock keeps a slow run from overlapping.
    void runCronJob(job.name).catch((error) => {
      logger.error({ job: job.name, err: error }, 'Cron job crashed');
    });
  }
}

/** Start the scheduler. No-op in tests or when `CRON_ENABLED=false`. */
export function startScheduler(): void {
  if (env.isTest || !env.cron.enabled) return;
  if (timer) return;

  // Run the outbox drain almost immediately so queued mail goes out promptly
  // after a deploy, then settle into the regular interval.
  if (env.emailOutbox.enabled) {
    void runCronJob('email-outbox').catch(() => undefined);
  }

  timer = setInterval(() => {
    void tick();
  }, env.cron.tickMs);
  timer.unref();

  logger.info(
    { jobs: CRON_JOBS.map((j) => j.name), tickMs: env.cron.tickMs },
    'Cron scheduler started',
  );
}

/** Stop the scheduler and clear the timers. */
export function stopScheduler(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
    logger.info('Cron scheduler stopped');
  }
}

/** Snapshot of the scheduler for the health endpoint. */
export function schedulerStatus(): {
  running: boolean;
  enabled: boolean;
  jobs: Array<{ name: string; intervalMs: number; lastRunAt: string | null; running: boolean }>;
} {
  return {
    running: Boolean(timer),
    enabled: env.cron.enabled && !env.isTest,
    jobs: CRON_JOBS.map((job) => {
      const state = states.get(job.name);
      return {
        name: job.name,
        intervalMs: job.intervalMs,
        lastRunAt: state?.lastRunAt ? new Date(state.lastRunAt).toISOString() : null,
        running: state?.running ?? false,
      };
    }),
  };
}
