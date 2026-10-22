/**
 * Clear the development rate-limit counters.
 *
 * The auth limiter allows 30 attempts per 15 minutes per IP, and the counters
 * live in Mongo so they survive a restart — which means a morning of testing
 * can lock you out of your own console until the window rolls over.
 *
 *   npx tsx src/scripts/clearRateLimits.ts
 */
import { connectDB, disconnectDB } from '../config/database';
import { logger } from '../config/logger';
import { RateLimitCounter } from '../models/RateLimitCounter';

async function main() {
  await connectDB();
  const result = await RateLimitCounter.deleteMany({});
  logger.info({ deleted: result.deletedCount }, 'Rate-limit counters cleared');
  await disconnectDB();
}

main().catch((error) => {
  logger.error({ err: error }, 'clearRateLimits failed');
  process.exitCode = 1;
  void disconnectDB();
});
