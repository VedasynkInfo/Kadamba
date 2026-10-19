import type { Area } from 'react-easy-crop';

/**
 * Client-side cropping helpers.
 *
 * Nothing here re-encodes an original on disk — the crop happens in the browser
 * before upload, and the result becomes a brand-new file. That keeps the
 * "originals are immutable" rule intact: cropping a hero banner never rewrites
 * the source photo somebody else may still be using.
 */

/** Longest side of a crop's output. Matches the largest generated variant. */
export const CROP_MAX_OUTPUT = 2400;

/** Quality for lossy crop output; high enough to survive a second resize. */
const LOSSY_QUALITY = 0.92;

export interface CropPreset {
  label: string;
  /** `null` means free-form (no aspect lock). */
  aspect: number | null;
}

/**
 * Aspect presets mirroring `defaultWebsiteSettings.media.bannerPresets`, so what
 * the crop dialog offers is the same shape list the settings screen documents.
 */
export const CROP_PRESETS: CropPreset[] = [
  { label: 'Free', aspect: null },
  { label: 'Hero banner 16:9', aspect: 16 / 9 },
  { label: 'Lookbook 4:5', aspect: 4 / 5 },
  { label: 'Portrait 3:4', aspect: 3 / 4 },
  { label: 'Square 1:1', aspect: 1 },
  { label: 'Share card 1.91:1', aspect: 1.91 },
];

/** Output MIME type: keep PNG (transparency) and WebP, otherwise re-encode JPEG. */
export function cropOutputType(sourceType: string): string {
  if (sourceType === 'image/png') return 'image/png';
  if (sourceType === 'image/webp') return 'image/webp';
  return 'image/jpeg';
}

export function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Could not read that image'));
    image.src = src;
  });
}

export interface CroppedResult {
  blob: Blob;
  width: number;
  height: number;
}

/**
 * Draw the selected region of `src` to a canvas and return it as a Blob.
 *
 * Drawing from the decoded `<img>` element (rather than re-parsing the raw
 * bytes) means the browser has already applied any EXIF orientation, so the
 * pixels cropped are the pixels the user positioned in the dialog.
 */
export async function cropImageToBlob(
  src: string,
  area: Area,
  options: { sourceType?: string; maxSize?: number } = {},
): Promise<CroppedResult> {
  const maxSize = options.maxSize ?? CROP_MAX_OUTPUT;
  const image = await loadImageElement(src);

  // Never upscale: a crop is capped, but only downwards.
  const scale = Math.min(1, maxSize / Math.max(area.width, area.height));
  const width = Math.max(1, Math.round(area.width * scale));
  const height = Math.max(1, Math.round(area.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext('2d');
  if (!context) throw new Error('Your browser could not process that image');

  context.imageSmoothingQuality = 'high';
  context.drawImage(image, area.x, area.y, area.width, area.height, 0, 0, width, height);

  const type = cropOutputType(options.sourceType ?? 'image/jpeg');
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, type, type === 'image/png' ? undefined : LOSSY_QUALITY);
  });

  if (!blob) throw new Error('Could not encode the cropped image');
  return { blob, width, height };
}
