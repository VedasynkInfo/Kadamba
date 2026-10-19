import fs from 'fs';
import path from 'path';
import { env } from './env';
import { logger } from './logger';

/**
 * Canonical on-disk layout for uploaded media.
 *
 *   <uploadsDir>/<timestamp>-<name>.png         ← originals, unchanged
 *   <uploadsDir>/optimized/<hash>/800.webp      ← generated variants
 *
 * Originals sit directly in `uploadsDir` and are never moved or rewritten.
 * That keeps every URL already stored in the database working verbatim, and it
 * means enabling optimisation can never invalidate existing content. Variants
 * are additional files under `optimized/`, so deleting the whole `optimized/`
 * tree at any time only costs a regeneration — never an original.
 *
 * In production `uploadsDir` is the Render Persistent Disk mount
 * (`UPLOAD_DIR=/var/data/uploads`). In development it defaults to
 * `<cwd>/uploads`, which is where the existing files already live.
 */
export const uploadsDir = env.uploadDir
  ? path.resolve(env.uploadDir)
  : path.join(process.cwd(), 'uploads');

/** Generated variants, keyed by content hash. */
export const optimizedDir = path.join(uploadsDir, 'optimized');

/** Public URL prefix that maps to `uploadsDir`. */
export const UPLOAD_URL_PREFIX = '/uploads';

if (env.uploadStorage !== 'local') {
  // Only local disk storage is implemented (see config/env.ts). Surface the
  // misconfiguration loudly rather than silently writing somewhere unexpected.
  logger.warn(
    { uploadStorage: env.uploadStorage, uploadsDir },
    'UPLOAD_STORAGE is not "local"; only local disk storage is implemented — using local disk',
  );
}

/** Create the directories the server needs. Safe to call repeatedly. */
export function ensureUploadDirs(): void {
  fs.mkdirSync(uploadsDir, { recursive: true });
  fs.mkdirSync(optimizedDir, { recursive: true });
}

/** True when `candidate` resolves to a path inside `uploadsDir`. */
export function isInsideUploads(candidate: string): boolean {
  const resolved = path.resolve(candidate);
  const root = uploadsDir.endsWith(path.sep) ? uploadsDir : uploadsDir + path.sep;
  return resolved === uploadsDir || resolved.startsWith(root);
}

/** Directory holding the variants for one content hash. */
export function assetVariantDir(hash: string): string {
  return path.join(optimizedDir, hash);
}

/** Public URL for a generated variant. */
export function variantUrl(hash: string, filename: string): string {
  return `${UPLOAD_URL_PREFIX}/optimized/${hash}/${filename}`;
}

/**
 * Absolute URL for an original stored in `uploadsDir`.
 *
 * Derived ONLY from trusted configuration (PUBLIC_API_URL / RENDER_EXTERNAL_URL
 * or the local dev origin). `x-forwarded-host`/`proto` are deliberately never
 * consulted — on Render they are client-controllable and would let an attacker
 * poison the URL that gets persisted.
 */
export function publicUploadUrl(filename: string): string {
  const base = env.publicApiUrl || (env.isProduction ? '' : `http://localhost:${env.port}`);
  const encoded = encodeURIComponent(filename);
  if (!base) {
    // Production without an explicit origin — fall back to a path-only URL,
    // which the SPA resolves against the API origin via `mediaUrl()`.
    return `${UPLOAD_URL_PREFIX}/${encoded}`;
  }
  return `${base.replace(/\/$/, '')}${UPLOAD_URL_PREFIX}/${encoded}`;
}
