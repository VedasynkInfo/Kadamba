import rateLimit, { type Options } from 'express-rate-limit';
import { env } from '../config/env';

/** Shared validation config so limiters behave correctly behind a proxy. */
const validate: Options['validate'] = { trustProxy: env.trustProxy > 0 };

/** Broad limiter mounted on the whole API to blunt scraping / abuse. */
export const globalApiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  validate,
  message: { success: false, message: 'Too many requests. Try again later.' },
});

/** Auth login — modest abuse protection. */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  validate,
  message: { success: false, message: 'Too many auth attempts. Try again later.' },
});

/** Public form posts (contact / leads). */
export const publicWriteRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  validate,
  message: { success: false, message: 'Too many submissions. Try again later.' },
});
