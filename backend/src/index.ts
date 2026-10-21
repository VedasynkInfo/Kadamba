import type { Server } from 'http';
import { createApp } from './app';
import { connectDB, disconnectDB } from './config/database';
import { env } from './config/env';
import { logger } from './config/logger';
import { initPortalSocket } from './realtime/portalSocket';
import { startScheduler, stopScheduler } from './services/cronService';
import { drainJobPools } from './services/jobPool';
import { ensurePhase10Indexes } from './services/phase10Bootstrap';

async function bootstrap() {
  await connectDB();
  await ensurePhase10Indexes();

  const app = createApp();
  const server: Server = app.listen(env.port, () => {
    logger.info(`Server running on port ${env.port} (${env.nodeEnv})`);
  });

  initPortalSocket(server);
  startScheduler();
  setupGracefulShutdown(server);
}

function setupGracefulShutdown(server: Server) {
  let shuttingDown = false;

  const shutdown = async (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    logger.info({ signal }, 'Shutting down gracefully');

    // Force-exit if cleanup hangs.
    const forceExit = setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10_000);
    forceExit.unref();

    server.close(async () => {
      try {
        // Stop accepting new scheduled work, then let in-flight jobs finish.
        // Anything still queued lives in Mongo (email outbox, job rows), so a
        // hard kill here loses nothing.
        stopScheduler();
        await drainJobPools(5_000);
        await disconnectDB();
        clearTimeout(forceExit);
        process.exit(0);
      } catch (error) {
        logger.error({ err: error }, 'Error during shutdown');
        process.exit(1);
      }
    });
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

bootstrap().catch((error) => {
  logger.error({ err: error }, 'Failed to start server');
  process.exit(1);
});
