import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import path from 'path';
import { randomUUID } from 'crypto';
import { env } from './config/env';
import { logger } from './config/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { globalApiRateLimiter } from './middleware/rateLimit';
import apiRoutes from './routes';

/**
 * Builds the Express application without binding a port, so it can be
 * exercised directly by Supertest and reused by the server bootstrap.
 */
export function createApp(): Express {
  const app = express();

  // Behind Render/Vercel proxies — required for correct client IPs + rate limits.
  if (env.trustProxy > 0) {
    app.set('trust proxy', env.trustProxy);
  }

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  app.use(
    cors({
      origin(origin, callback) {
        // Allow same-origin / non-browser clients (no Origin header).
        if (!origin) {
          return callback(null, true);
        }
        // Allow any origin whose host:port matches the backend itself
        // (covers Vite dev proxy with changeOrigin:true).
        const serverOrigin = `http://localhost:${env.port}`;
        if (origin === serverOrigin || env.allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        // Use callback(null, false) instead of callback(new Error) so the
        // cors library handles denial gracefully and doesn't throw into
        // Express error-handling middleware.
        return callback(null, false);
      },
      credentials: true,
    }),
  );

  app.use(
    pinoHttp({
      logger,
      genReqId: (req, res) => {
        const existing = req.headers['x-request-id'];
        const id = (Array.isArray(existing) ? existing[0] : existing) || randomUUID();
        res.setHeader('x-request-id', id);
        return id;
      },
      // Keep noisy health probes at debug level.
      customLogLevel: (_req, res, err) => {
        if (err || res.statusCode >= 500) return 'error';
        if (res.statusCode >= 400) return 'warn';
        return 'info';
      },
    }),
  );

  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Local disk uploads are only used in development (Cloudinary in production).
  if (!env.isProduction) {
    app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
  }

  app.get('/', (_req, res) => {
    res.json({ success: true, message: "Kadamba's Designer Studio API", version: '1.0.0' });
  });

  app.use('/api', globalApiRateLimiter, apiRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
