import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import sharp, { type Sharp, type Metadata } from 'sharp';
import { encode as encodeBlurhash } from 'blurhash';
import { env } from '../config/env';
import { assetVariantDir, variantUrl } from '../config/storage';
import type { ImageVariant, ImageVariantFormat } from '../models/ImageAsset';
import { logger } from '../config/logger';

/** Formats emitted for each width. AVIF is gated by `env.image.avifMaxWidth`. */
function formatsFor(width: number): ImageVariantFormat[] {
  const formats: ImageVariantFormat[] = [];
  if (width <= env.image.avifMaxWidth) formats.push('avif');
  formats.push('webp', 'jpeg');
  return formats;
}

const EXT: Record<ImageVariantFormat, string> = { avif: 'avif', webp: 'webp', jpeg: 'jpg' };
const CONTENT_TYPE: Record<ImageVariantFormat, string> = {
  avif: 'image/avif',
  webp: 'image/webp',
  jpeg: 'image/jpeg',
};

/** Source formats we will happily re-encode. Anything else is stored as-is. */
const ENCODABLE = new Set(['jpeg', 'png', 'webp', 'avif', 'tiff', 'bmp', 'heif']);

export interface ProcessedImage {
  hash: string;
  kind: 'image' | 'video';
  format?: string;
  width?: number;
  height?: number;
  aspectRatio?: number;
  bytes: number;
  blurhash?: string;
  dominantColor?: string;
  variants: ImageVariant[];
}

/** sha256 of the raw bytes — stable identity for an asset. */
export async function hashFile(absPath: string): Promise<string> {
  const buf = await fs.readFile(absPath);
  return crypto.createHash('sha256').update(buf).digest('hex');
}

function rgbToHex(r: number, g: number, b: number): string {
  const to2 = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${to2(r)}${to2(g)}${to2(b)}`;
}

/**
 * Extra small placeholder artefacts derived from one decoded copy:
 * a 32px resize for the blurhash and a 1px resize for the average colour.
 * Both come from a single decode pass to avoid re-reading the file twice.
 */
async function computePlaceholders(input: Sharp): Promise<{
  blurhash?: string;
  dominantColor?: string;
}> {
  try {
    const { data, info } = await input
      .clone()
      .resize(32, 32, { fit: 'inside' })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    const blurhash = encodeBlurhash(
      new Uint8ClampedArray(data),
      info.width,
      info.height,
      4,
      3,
    );
    return { blurhash };
  } catch {
    return {};
  }
}

async function averageColor(input: Sharp): Promise<string | undefined> {
  try {
    const { data, info } = await input
      .clone()
      .resize(1, 1, { fit: 'fill' })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    if (info.channels < 3) return undefined;
    return rgbToHex(data[0], data[1], data[2]);
  } catch {
    return undefined;
  }
}

/** Choose the variant widths for a source of `srcWidth` pixels. */
export function targetWidths(srcWidth: number): number[] {
  const configured = env.image.widths.length ? env.image.widths : [400, 800, 1200, 1600, 2400];
  const under = configured.filter((w) => w <= srcWidth);

  // Never upscale. The final entry is always the source width itself so every
  // image gets a full-resolution modern-format variant — converting a large
  // PNG to WebP/AVIF is usually a bigger saving than any downscale.
  if (under.length === 0) return [srcWidth];
  if (under[under.length - 1] < srcWidth) under.push(srcWidth);
  return under;
}

/** Run `tasks` with at most `limit` in flight. */
async function pool<T>(tasks: Array<() => Promise<T>>, limit = 4): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let next = 0;
  async function worker() {
    while (next < tasks.length) {
      const index = next++;
      results[index] = await tasks[index]();
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, worker));
  return results;
}

async function encodeVariant(
  source: Buffer,
  hash: string,
  dir: string,
  width: number,
  format: ImageVariantFormat,
): Promise<ImageVariant> {
  const filename = `${width}.${EXT[format]}`;
  const absPath = path.join(dir, filename);

  // Idempotent: an existing non-empty file is reused (the backfill reruns).
  try {
    const stat = await fs.stat(absPath);
    if (stat.size > 0) {
      return { width, format, url: variantUrl(hash, filename), bytes: stat.size };
    }
  } catch {
    /* not yet generated */
  }

  let pipeline = sharp(source, { limitInputPixels: env.image.maxPixels })
    // Auto-orient from EXIF *before* metadata is dropped, otherwise portrait
    // photos come back sideways. Output carries no EXIF (sharp strips it
    // unless withMetadata() is called).
    .rotate()
    .resize({ width, withoutEnlargement: true });

  if (format === 'avif') {
    pipeline = pipeline.avif({ quality: env.image.avifQuality, effort: 4 });
  } else if (format === 'webp') {
    pipeline = pipeline.webp({ quality: env.image.webpQuality });
  } else {
    pipeline = pipeline.jpeg({ quality: env.image.jpegQuality, mozjpeg: true });
  }

  const out = await pipeline.toBuffer();
  await fs.writeFile(absPath, out);
  return { width, format, url: variantUrl(hash, filename), bytes: out.byteLength };
}

/**
 * Generate every variant for one already-stored original.
 *
 * Never touches the original file. Failure is non-fatal for the caller: the
 * caller stores the original regardless, so a pipeline error degrades to
 * "originals only" rather than losing the upload.
 */
export async function processImageFile(absPath: string, hash: string): Promise<ProcessedImage> {
  const bytes = (await fs.stat(absPath)).size;
  const source = await fs.readFile(absPath);

  let meta: Metadata;
  try {
    meta = await sharp(source, { limitInputPixels: env.image.maxPixels }).metadata();
  } catch (error) {
    logger.warn({ err: error, absPath }, 'Could not read image metadata; storing original only');
    return { hash, kind: 'image', bytes, variants: [] };
  }

  const format = meta.format;

  // EXIF orientation 5–8 all involve a 90° rotation, so the dimensions sharp
  // reports (which are pre-rotation) have to be swapped to describe what the
  // browser will actually display. Getting this wrong is not cosmetic: the
  // stored width/height drive the aspect-ratio box that holds CLS at 0, and
  // the variant widths below would otherwise be computed for the wrong axis.
  const rotated = typeof meta.orientation === 'number' && meta.orientation >= 5;
  const width = rotated ? meta.height : meta.width;
  const height = rotated ? meta.width : meta.height;

  const base: ProcessedImage = {
    hash,
    kind: 'image',
    format,
    width,
    height,
    aspectRatio: width && height ? Number((width / height).toFixed(4)) : undefined,
    bytes,
    variants: [],
  };

  if (!env.image.optimize) return base;
  if (!format || !ENCODABLE.has(format)) {
    // Animated GIF and friends: flattening them would lose the animation, so
    // the original is served verbatim and no variants are claimed.
    return base;
  }
  if (!width || !height) return base;

  const input = sharp(source, { limitInputPixels: env.image.maxPixels });
  const placeholders = await computePlaceholders(input);
  const dominantColor = await averageColor(input);

  const dir = assetVariantDir(hash);
  await fs.mkdir(dir, { recursive: true });

  const widths = targetWidths(width);
  const tasks = widths.flatMap((w) =>
    formatsFor(w).map(
      (formatName) => () => encodeVariant(source, hash, dir, w, formatName),
    ),
  );

  let variants: ImageVariant[] = [];
  try {
    variants = await pool(tasks, 4);
  } catch (error) {
    // Partial success is still useful — keep whatever was written.
    logger.error({ err: error, hash }, 'Image variant generation failed');
  }

  return { ...base, ...placeholders, dominantColor, variants };
}

/** Content type for a variant format (used by the media library previews). */
export function variantContentType(format: ImageVariantFormat): string {
  return CONTENT_TYPE[format];
}
