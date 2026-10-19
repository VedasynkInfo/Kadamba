/**
 * Batched resolver for responsive image metadata.
 *
 * The server stores an `ImageAsset` per uploaded file (intrinsic dimensions,
 * a blurhash, and the generated AVIF/WebP/JPEG variant list). Sending that with
 * every content payload would bloat every list response, so instead each
 * `OptimizedImage` asks here and the requests are coalesced: every URL needed
 * during a render pass is fetched in a single call, and the result is cached
 * for the lifetime of the page.
 *
 * Failures degrade silently — an image that cannot be resolved is simply served
 * as a plain original, which is exactly how it behaved before this existed.
 */

export interface AssetVariant {
  width: number;
  format: string;
  url: string;
}

export interface ResolvedAsset {
  hash: string;
  width?: number;
  height?: number;
  aspectRatio?: number;
  blurhash?: string;
  dominantColor?: string;
  kind: 'image' | 'video' | string;
  posterUrl?: string;
  variants: AssetVariant[];
}

/** Successful lookups (including "no asset for this URL"). */
const cache = new Map<string, ResolvedAsset | null>();

/** URLs waiting for the next flush, and the callbacks to wake. */
const queue = new Set<string>();
const waiters = new Map<string, Array<(asset: ResolvedAsset | null) => void>>();
let flushHandle: ReturnType<typeof setTimeout> | null = null;

function apiBase(): string {
  const raw = (import.meta.env.VITE_API_URL as string | undefined) ?? '/api';
  return raw.replace(/\/$/, '');
}

/** Only our own uploads can have variants. */
export function isResolvableUrl(url: string): boolean {
  return url.includes('/uploads/');
}

function settle(url: string, asset: ResolvedAsset | null, cacheResult: boolean): void {
  if (cacheResult) cache.set(url, asset);

  const pending = waiters.get(url);
  if (!pending) return;
  waiters.delete(url);
  for (const resolve of pending) resolve(asset);
}

async function flush(): Promise<void> {
  flushHandle = null;
  const urls = [...queue];
  queue.clear();
  if (urls.length === 0) return;

  const params = new URLSearchParams();
  for (const url of urls) params.append('urls', url);

  try {
    const response = await fetch(`${apiBase()}/media/resolve?${params.toString()}`, {
      // Public endpoint; no credentials needed and none should be sent.
      credentials: 'omit',
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const body = (await response.json()) as { data?: { items?: Record<string, ResolvedAsset> } };
    const items = body?.data?.items ?? {};

    for (const url of urls) {
      // A URL the server does not know about is a definitive "no variants",
      // so it is cached; a transport error is not (see below), leaving a later
      // mount free to retry.
      settle(url, items[url] ?? null, true);
    }
  } catch {
    for (const url of urls) settle(url, null, false);
  }
}

function scheduleFlush(): void {
  if (flushHandle !== null) return;
  // A macrotask, so every component mounting in the same render pass joins the
  // same request.
  flushHandle = setTimeout(() => {
    void flush();
  }, 0);
}

/** Resolve one URL. Cached results (including misses) return immediately. */
export function resolveAsset(url: string): Promise<ResolvedAsset | null> {
  if (!url || !isResolvableUrl(url)) return Promise.resolve(null);

  const cached = cache.get(url);
  if (cached !== undefined) return Promise.resolve(cached);

  return new Promise((resolve) => {
    const pending = waiters.get(url) ?? [];
    pending.push(resolve);
    waiters.set(url, pending);

    queue.add(url);
    scheduleFlush();
  });
}

/** Resolve many URLs at once, reusing warm cache entries. */
export async function resolveAssets(urls: string[]): Promise<Map<string, ResolvedAsset | null>> {
  const result = new Map<string, ResolvedAsset | null>();
  await Promise.all(
    [...new Set(urls)].map(async (url) => {
      result.set(url, await resolveAsset(url));
    }),
  );
  return result;
}

/** Test seam: forget everything (also useful after a bulk upload). */
export function clearAssetCache(): void {
  cache.clear();
}

/** Pre-warm the cache for URLs known ahead of time (e.g. a detail page). */
export function primeAssetCache(urls: string[]): void {
  for (const url of urls) {
    if (isResolvableUrl(url) && !cache.has(url)) void resolveAsset(url);
  }
}
