import rateLimit, { ipKeyGenerator, type Options } from 'express-rate-limit';
import { env } from '../config/env';
import { MongoRateLimitStore } from '../services/rateLimitMongoStore';

/** Shared validation config so limiters behave correctly behind a proxy. */
const validate: Options['validate'] = { trustProxy: env.trustProxy > 0 };

/**
 * Rate limiting is disabled under `NODE_ENV=test` so a test file that signs in
 * repeatedly is not throttled by its own setup. Production and development
 * always enforce the limits.
 */
const skipInTest = () => env.isTest;

/** Broad limiter mounted on the whole API to blunt scraping / abuse. */
export const globalApiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  validate,
  skip: skipInTest,
  store: new MongoRateLimitStore('global'),
  message: { success: false, code: 'RATE_LIMITED', message: 'Too many requests. Try again later.' },
});

/** Auth login — modest abuse protection. */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  validate,
  skip: skipInTest,
  store: new MongoRateLimitStore('auth'),
  message: { success: false, code: 'RATE_LIMITED', message: 'Too many auth attempts. Try again later.' },
});

/** Public form posts (contact / leads). */
export const publicWriteRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  validate,
  skip: skipInTest,
  store: new MongoRateLimitStore('public-write'),
  message: { success: false, code: 'RATE_LIMITED', message: 'Too many submissions. Try again later.' },
});

/**
 * Password reset — tight budget. Abuse here costs the studio real email quota
 * and is a classic account-enumeration probe.
 */
export const passwordResetRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  validate,
  skip: skipInTest,
  store: new MongoRateLimitStore('password-reset'),
  message: { success: false, code: 'RATE_LIMITED', message: 'Too many reset attempts. Try again later.' },
});

/**
 * Per-account login throttle, in addition to the per-IP limiter. Keyed on the
 * submitted email so one noisy IP cannot lock out every account, and one
 * account cannot be hammered from a rotating IP pool.
 */
export const loginAccountRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  validate,
  skip: skipInTest,
  store: new MongoRateLimitStore('login-account'),
  keyGenerator: (req) => {
    const email = (req.body as { email?: string } | undefined)?.email;
    // `ipKeyGenerator` normalises IPv6 to a /64 subnet so a single client
    // cannot rotate through its address block to reset the budget.
    return `login:${String(email ?? '').toLowerCase() || ipKeyGenerator(req.ip || '')}`;
  },
  message: {
    success: false,
    code: 'RATE_LIMITED',
    message: 'Too many sign-in attempts for this account. Try again later.',
  },
});
