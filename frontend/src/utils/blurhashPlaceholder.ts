import { decode } from 'blurhash';

/**
 * Decode a blurhash to a tiny PNG data URL for use as a placeholder.
 *
 * A 32px decode is a few hundred microseconds and the result is a ~1 KB data
 * URL, so it is a far cheaper "something is there" than a spinner, and it makes
 * an LCP image appear instantly while the real bytes stream in.
 *
 * Results are memoised by blurhash string, so a grid of cards sharing a
 * placeholder decodes once.
 */
const cache = new Map<string, string | null>();

const DECODE_WIDTH = 32;
const DECODE_HEIGHT = 32;

export function blurhashToDataUrl(hash?: string | null): string | null {
  if (!hash) return null;

  const cached = cache.get(hash);
  if (cached !== undefined) return cached;

  let dataUrl: string | null = null;
  try {
    // Guard against server-side rendering / non-DOM environments.
    if (typeof document === 'undefined') return null;

    const pixels = decode(hash, DECODE_WIDTH, DECODE_HEIGHT);
    const canvas = document.createElement('canvas');
    canvas.width = DECODE_WIDTH;
    canvas.height = DECODE_HEIGHT;

    const context = canvas.getContext('2d');
    if (!context) return null;

    const imageData = context.createImageData(DECODE_WIDTH, DECODE_HEIGHT);
    imageData.data.set(pixels);
    context.putImageData(imageData, 0, 0);

    dataUrl = canvas.toDataURL('image/png');
  } catch {
    // A malformed hash must never break rendering.
    dataUrl = null;
  }

  cache.set(hash, dataUrl);
  return dataUrl;
}
