import pino from 'pino';
import { env } from './env';

/**
 * Application logger. Pretty output in development, structured JSON in
 * production. Sensitive headers and secrets are redacted.
 */
export const logger = pino({
  level: env.logLevel,
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'res.headers["set-cookie"]',
      '*.password',
      '*.newPassword',
      '*.currentPassword',
      '*.token',
    ],
    censor: '[redacted]',
  },
  transport:
    env.isProduction || env.isTest
      ? undefined
      : {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'SYS:HH:MM:ss', ignore: 'pid,hostname' },
        },
});
