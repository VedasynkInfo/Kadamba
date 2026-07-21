import type { ImgHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

export interface OptimizedImageProps
  extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'alt' | 'loading'> {
  src: string;
  alt: string;
  /** When true, loads eagerly with high fetch priority (heroes). */
  priority?: boolean;
  /** Target display width for Cloudinary `w_` transform. */
  width?: number;
  height?: number;
}

function isCloudinaryUrl(src: string): boolean {
  return /res\.cloudinary\.com\//i.test(src);
}

/**
 * Applies f_auto,q_auto (+ optional width) to Cloudinary delivery URLs.
 * Non-Cloudinary URLs are returned unchanged.
 */
export function cloudinaryOptimizedUrl(src: string, width?: number): string {
  if (!isCloudinaryUrl(src)) return src;

  const uploadMarker = '/upload/';
  const idx = src.indexOf(uploadMarker);
  if (idx === -1) return src;

  const before = src.slice(0, idx + uploadMarker.length);
  const after = src.slice(idx + uploadMarker.length);

  if (/\bf_auto\b/.test(after) && /\bq_auto\b/.test(after)) return src;

  const transforms = ['f_auto', 'q_auto'];
  if (width && width > 0) transforms.push(`w_${Math.round(width)}`);

  return `${before}${transforms.join(',')}/${after}`;
}

/**
 * Public-facing image with lazy loading defaults and Cloudinary-aware URLs.
 */
export function OptimizedImage({
  src,
  alt,
  priority = false,
  width,
  height,
  className,
  sizes,
  ...rest
}: OptimizedImageProps) {
  const optimizedSrc = cloudinaryOptimizedUrl(src, width);

  return (
    <img
      src={optimizedSrc}
      alt={alt}
      width={width}
      height={height}
      sizes={sizes}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      fetchPriority={priority ? 'high' : 'auto'}
      className={cn(className)}
      {...rest}
    />
  );
}
