import { Router } from 'express';
import mongoose from 'mongoose';
import { schedulerStatus } from '../services/cronService';
import { getEmailOutboxStats } from '../services/emailOutboxService';
import { allJobPoolStats } from '../services/jobPool';
import { cacheStats } from '../services/cacheService';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

function dbStatus(): string {
  const state = mongoose.connection.readyState;
  return state === 1 ? 'connected' : state === 2 ? 'connecting' : 'disconnected';
}

/** Liveness — process is up. Always 200 if the event loop is responsive. */
router.get('/live', (_req, res) => {
  res.status(200).json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } });
});

/** Readiness — safe to receive traffic only when the database is connected. */
router.get('/ready', (_req, res) => {
  const database = dbStatus();
  const ready = database === 'connected';
  res.status(ready ? 200 : 503).json({
    success: ready,
    data: { status: ready ? 'ready' : 'not-ready', database, timestamp: new Date().toISOString() },
  });
});

/**
 * Back-compat summary plus the Phase 10 background-work view: the email
 * outbox depth, the scheduler, the in-process job pools and the LRU cache.
 */
router.get(
  '/',
  asyncHandler(async (_req, res) => {
    let outbox = null;
    try {
      outbox = await getEmailOutboxStats();
    } catch {
      // The database may be down; liveness must not depend on it.
      outbox = null;
    }

    res.status(200).json({
      success: true,
      message: 'Kadamba API is healthy',
      data: {
        status: 'ok',
        database: dbStatus(),
        timestamp: new Date().toISOString(),
        background: {
          outbox,
          scheduler: schedulerStatus(),
          jobs: allJobPoolStats(),
          cache: cacheStats(),
        },
      },
    });
  }),
);

export default router;
