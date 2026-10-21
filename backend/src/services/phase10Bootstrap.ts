import { logger } from '../config/logger';
import { CronLock } from '../models/CronLock';
import { EmailOutbox } from '../models/EmailOutbox';
import { RateLimitCounter } from '../models/RateLimitCounter';

/**
 * Make sure the Phase 10 indexes exist before the app relies on them.
 *
 * Two guarantees depend on a real index rather than application logic:
 *  - the unique sparse index on `EmailOutbox.dedupeKey` is what makes
 *    notification de-duplication race-free;
 *  - the unique index on `CronLock.name` is what makes the cron lease
 *    race-free across instances.
 *
 * Mongoose builds indexes in the background after the connection opens, so
 * without an explicit wait the very first requests could run before the index
 * exists. This waits for it.
 */
export async function ensurePhase10Indexes(): Promise<void> {
  try {
    await Promise.all([EmailOutbox.init(), CronLock.init(), RateLimitCounter.init()]);
    logger.info('Phase 10 indexes ready');
  } catch (error) {
    // A missing unique index weakens de-duplication but must not stop the API
    // from booting: the application-level lookups still work.
    logger.error({ err: error }, 'Failed to build Phase 10 indexes');
  }
}
