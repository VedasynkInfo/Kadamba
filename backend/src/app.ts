import cookieParser from 'cookie-parser';
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
import { autoAudit } from './middleware/autoAudit';
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
  // httpOnly refresh cookies (admin + portal). No signing: the value is already
  // an unguessable 384-bit random token whose hash is stored server-side.
  app.use(cookieParser());

  // Serve locally stored uploads (dev + production when UPLOAD_STORAGE=local).
  // Hardened: no dotfiles, nosniff, long-lived immutable caching (filenames are
  // timestamped/unique), and an explicit X-Content-Type-Options header so a
  // mislabelled file can never be sniffed into an active content type.
  app.use(
    '/uploads',
    express.static(path.join(process.cwd(), 'uploads'), {
      dotfiles: 'deny',
      index: false,
      fallthrough: false,
      setHeaders(res) {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      },
    }),
  );

  app.get('/', (_req, res) => {
    res.json({ success: true, message: "Kadamba's Designer Studio API", version: '1.0.0' });
  });

  app.use('/api', globalApiRateLimiter, autoAudit, apiRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
