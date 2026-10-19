import dotenv from 'dotenv';

dotenv.config();

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';
const isTest = nodeEnv === 'test';

/** Collected configuration problems, thrown together so misconfig is obvious. */
const problems: string[] = [];

function required(key: string, devFallback?: string): string {
  const value = process.env[key];
  if (value && value.trim()) return value.trim();
  if (!isProduction && devFallback !== undefined) return devFallback;
  problems.push(`Missing required environment variable: ${key}`);
  return '';
}

function optional(key: string, fallback = ''): string {
  const value = process.env[key];
  return value && value.trim() ? value.trim() : fallback;
}

const DEV_JWT_FALLBACK = 'dev_only_change_me_kadamba_secret_key_min_32c';

const mongodbUri = required('MONGODB_URI', 'mongodb://localhost:27017/kadamba');
const jwtSecret = required('JWT_SECRET', DEV_JWT_FALLBACK);
const frontendUrlRaw = required('FRONTEND_URL', 'http://localhost:5173');

// Production-only safety checks.
if (isProduction) {
  if (jwtSecret && jwtSecret.length < 32) {
    problems.push('JWT_SECRET must be at least 32 characters in production');
  }
  if (jwtSecret === DEV_JWT_FALLBACK) {
    problems.push('JWT_SECRET is still the development fallback — set a strong secret');
  }
  if (mongodbUri.includes('localhost') || mongodbUri.includes('127.0.0.1')) {
    problems.push('MONGODB_URI must point at a managed database (not localhost) in production');
  }
  if (frontendUrlRaw && !frontendUrlRaw.startsWith('https://')) {
    problems.push('FRONTEND_URL must be an https origin in production');
  }
}

if (problems.length && !isTest) {
  const detail = problems.map((p) => `  - ${p}`).join('\n');
  throw new Error(`Invalid environment configuration:\n${detail}`);
}

/** Comma-separated list of allowed browser origins for CORS. */
const allowedOrigins = frontendUrlRaw
  .split(',')
  .map((o) => o.trim().replace(/\/$/, ''))
  .filter(Boolean);

/**
 * Cookie policy.
 *
 * The SPA and API normally live on different sites in production
 * (Vercel frontend ↔ Render API), so the refresh cookie must be
 * `SameSite=None; Secure`. In local development both run on `localhost`
 * (different ports are still the same site), where `Lax` works and `Secure`
 * would be rejected over plain HTTP.
 */
const cookieSameSite = (optional('COOKIE_SAMESITE', isProduction ? 'none' : 'lax').toLowerCase() as
  | 'lax'
  | 'strict'
  | 'none');
const cookieSecure = optional('COOKIE_SECURE', String(isProduction)) === 'true';

export const env = {
  nodeEnv,
  isProduction,
  isTest,
  port: Number(process.env.PORT || 4000),
  /** Primary origin (first entry) — used where a single value is needed. */
  frontendUrl: allowedOrigins[0] || 'http://localhost:5173',
  allowedOrigins,
  mongodbUri,
  jwtSecret,
  /** Access-token lifetime. Short by design — the refresh cookie renews it. */
  jwtExpiresIn: optional('JWT_EXPIRES_IN', '15m'),
  /** Refresh-token lifetime (rotating, single-use). */
  refreshExpiresIn: optional('REFRESH_EXPIRES_IN', '30d'),
  jwtIssuer: optional('JWT_ISSUER', 'kadamba-api'),
  jwtAudience: optional('JWT_AUDIENCE', 'kadamba-web'),
  cookie: {
    sameSite: cookieSameSite,
    secure: cookieSecure,
    /** Optional parent domain, e.g. `.kadamba.com`. Empty = host-only. */
    domain: optional('COOKIE_DOMAIN'),
    /** Access token cookie is optional — the SPA keeps it in memory. */
    accessName: optional('ACCESS_COOKIE_NAME', 'kadamba_at'),
    refreshName: optional('REFRESH_COOKIE_NAME', 'kadamba_rt'),
  },
  /** Brute-force lockout policy. */
  security: {
    maxFailedLogins: Number(process.env.MAX_FAILED_LOGINS || 5),
    lockoutMinutes: Number(process.env.LOCKOUT_MINUTES || 15),
    /** Require TOTP enrolment for admin accounts. */
    requireAdminMfa: optional('REQUIRE_ADMIN_MFA', 'false') === 'true',
  },
  /** Trust N proxy hops (Render/Vercel sit behind a load balancer). */
  trustProxy: Number(process.env.TRUST_PROXY || (isProduction ? 1 : 0)),
  logLevel: optional('LOG_LEVEL', isTest ? 'silent' : isProduction ? 'info' : 'debug'),
  /**
   * Upload backend. Only `local` (disk / Render Persistent Disk) is
   * implemented — the third-party CDN path was removed in Phase 4 so that all
   * media lives on infrastructure we control, per the project constraints.
   * The value is still read so an old deployment with `cloudinary` set gets a
   * loud warning instead of silently changing behaviour.
   */
  uploadStorage: optional('UPLOAD_STORAGE', 'local').toLowerCase(),
  /**
   * Absolute path to the canonical uploads directory.
   *
   * Defaults to `<cwd>/uploads`, which is where every existing file and every
   * stored URL already points — so the default is fully backward compatible.
   * On Render, point this at the Persistent Disk mount (e.g.
   * `/var/data/uploads`) so uploads survive deploys. Originals are never
   * relocated automatically; use `npm run uploads:migrate` for that.
   */
  uploadDir: optional('UPLOAD_DIR'),
  /** Image variant generation (sharp). */
  image: {
    /** Master switch — disable to store originals only. */
    optimize: optional('IMAGE_OPTIMIZE', 'true') === 'true',
    /** Widths generated for every raster upload. */
    widths: (optional('IMAGE_WIDTHS', '400,800,1200,1600,2400'))
      .split(',')
      .map((w) => Number(w.trim()))
      .filter((w) => Number.isFinite(w) && w > 0)
      .sort((a, b) => a - b),
    /**
     * AVIF encode ceiling. AVIF is markedly slower than WebP/JPEG, so it is
     * generated only for widths at or below this value.
     */
    avifMaxWidth: Number(process.env.IMAGE_AVIF_MAX_WIDTH || 1600),
    /** Reject absurd source dimensions (decompression-bomb guard). */
    maxPixels: Number(process.env.IMAGE_MAX_PIXELS || 80_000_000),
    webpQuality: Number(process.env.IMAGE_WEBP_QUALITY || 82),
    avifQuality: Number(process.env.IMAGE_AVIF_QUALITY || 62),
    jpegQuality: Number(process.env.IMAGE_JPEG_QUALITY || 84),
  },
  /** Optional public API origin for absolute local upload URLs (e.g. https://api.example.com). */
  publicApiUrl: optional('PUBLIC_API_URL', optional('RENDER_EXTERNAL_URL')),
  email: {
    host: optional('EMAIL_HOST', 'smtp.gmail.com'),
    port: Number(process.env.EMAIL_PORT || 587),
    user: optional('EMAIL_USER'),
    pass: optional('EMAIL_PASS'),
    from: optional('EMAIL_FROM', process.env.EMAIL_USER || ''),
    /** Inbox for contact-form notifications (falls back to EMAIL_USER). */
    to: optional('EMAIL_TO', process.env.EMAIL_USER || ''),
  },
};
