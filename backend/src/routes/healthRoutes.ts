import { Router } from 'express';
import mongoose from 'mongoose';

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

/** Back-compatible summary endpoint. */
router.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Kadamba API is healthy',
    data: { status: 'ok', database: dbStatus(), timestamp: new Date().toISOString() },
  });
});

export default router;
