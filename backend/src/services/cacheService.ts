import { LRUCache } from 'lru-cache';
import { logger } from '../config/logger';

/**
 * Process-local read cache.
 *
 * No Redis: settings, dashboard aggregates and CMS reads are cached in each
 * process. Every write path that can change a cached response calls
 * `invalidateCache(prefix)`, so a save is visible immediately on the instance
 * that handled it. Other instances converge within the TTL, which is kept
 * short (60s) on purpose.
 *
 * Values are cloned on the way in and out. The dashboard controller mutates
 * its response for finance-redacted staff users; returning a shared object
 * would let that redaction leak into the next admin request.
 */
interface CacheEntry {
  value: unknown;
}

const DEFAULT_TTL_MS = 60_000;

const cache = new LRUCache<string, CacheEntry>({
  max: 1_000,
  ttl: DEFAULT_TTL_MS,
  allowStale: false,
  updateAgeOnGet: false,
});

function clone<T>(value: T): T {
  if (value === undefined || value === null) return value;
  return JSON.parse(JSON.stringify(value)) as T;
}

/** Cache key helper with a stable representation of query objects. */
export function cacheKey(prefix: string, ...parts: unknown[]): string {
  const encoded = parts.map((part) => {
    if (part === undefined) return '';
    if (part === null) return 'null';
    if (typeof part === 'object') return stableStringify(part);
    return String(part);
  });
  return [prefix, ...encoded].join(':');
}

function stableStringify(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

/**
 * Return a cached value, or run `load` once and cache it.
 *
 * The loader is not deduplicated in-flight. Concurrent misses can both load;
 * that is deliberate — a tiny amount of duplicate work is cheaper than a
 * process-wide promise registry that can pin a failed load forever.
 */
export async function cached<T>(
  key: string,
  ttlMs: number,
  load: () => Promise<T>,
): Promise<T> {
  const hit = cache.get(key);
  if (hit !== undefined) return clone(hit.value as T);

  const value = await load();
  cache.set(key, { value: clone(value) }, { ttl: ttlMs });
  return value;
}

/** Invalidate one key, or every key with a prefix (e.g. `cms:`). */
export function invalidateCache(prefixOrKey: string): number {
  let removed = 0;
  for (const key of cache.keys()) {
    if (key === prefixOrKey || key.startsWith(`${prefixOrKey}:`) || key.startsWith(prefixOrKey)) {
      if (cache.delete(key)) removed += 1;
    }
  }
  if (removed) logger.debug({ key: prefixOrKey, removed }, 'Cache invalidated');
  return removed;
}

export function clearCache(): void {
  cache.clear();
}

export function cacheStats(): { size: number; max: number; ttlMs: number } {
  return { size: cache.size, max: cache.max, ttlMs: DEFAULT_TTL_MS };
}

export const CACHE_KEYS = {
  settingsPublic: 'settings:public',
  settingsAdmin: 'settings:admin',
  settingsSmtp: 'settings:smtp',
  dashboard: 'dashboard:summary',
  cmsBlog: 'cms:blog',
  cmsPortfolio: 'cms:portfolio',
  cmsService: 'cms:service',
  cmsGallery: 'cms:gallery',
  cmsCatalog: 'cms:catalog',
} as const;

export const CACHE_TTL = {
  settingsMs: 60_000,
  dashboardMs: 30_000,
  cmsMs: 60_000,
} as const;
