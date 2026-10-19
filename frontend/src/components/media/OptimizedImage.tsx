import { useEffect, useState, type CSSProperties, type ImgHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';
import { mediaUrl } from '@/utils/mediaUrl';
import { blurhashToDataUrl } from '@/utils/blurhashPlaceholder';
import { resolveAsset, type AssetVariant, type ResolvedAsset } from '@/services/media/assetResolver';

export interface OptimizedImageProps
  extends Omit<
    ImgHTMLAttributes<HTMLImageElement>,
    'src' | 'alt' | 'loading' | 'width' | 'height' | 'sizes' | 'srcSet'
  > {
  src: string;
  alt: string;
  /** Load eagerly with high fetch priority (heroes, above-the-fold art). */
  priority?: boolean;
  /** Intrinsic size hints. Server metadata wins when available. */
  width?: number;
  height?: number;
  /**
   * CSS `sizes` for the layout slot. Worth setting on grids and heroes — it is
   * what stops a 3-up card grid from each downloading a full-width image.
   */
  sizes?: string;
  /** Opt out of responsive variants (tiny logos, decorative marks). */
  responsive?: boolean;
  /** Classes applied to the `<picture>` wrapper, when one is rendered. */
  pictureClassName?: string;
}

/** React 19 types `fetchPriority`; older React DOM needs the lowercase form. */
type WithFetchPriority = { fetchPriority?: 'high' | 'low' | 'auto' };

function srcSetFor(variants: AssetVariant[], format: string): string | undefined {
  const matches = variants
    .filter((variant) => variant.format === format && variant.width > 0)
    .sort((a, b) => a.width - b.width);

  if (matches.length === 0) return undefined;
  return matches.map((variant) => `${variant.url} ${variant.width}w`).join(', ');
}

/**
 * Responsive image.
 *
 * Emits a real `<picture>` — AVIF, then WebP, then a JPEG/format fallback — with
 * `srcset`/`sizes`, intrinsic `width`/`height` (which is what keeps CLS at 0),
 * and a blurhash or dominant-colour placeholder so something is visible before
 * the bytes land.
 *
 * Everything degrades: if the asset cannot be resolved, or the URL is not one
 * of ours (a legacy record, an SVG logo), this renders a plain `<img>` with
 * correct loading/decoding/sizing attributes and nothing is fetched twice.
 */
export function OptimizedImage({
  src,
  alt,
  priority = false,
  width,
  height,
  sizes = '100vw',
  responsive = true,
  pictureClassName,
  className,
  style,
  onLoad,
  ...rest
}: OptimizedImageProps) {
  const resolvedSrc = mediaUrl(src);

  const [asset, setAsset] = useState<ResolvedAsset | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!responsive) {
      setAsset(null);
      return;
    }

    let active = true;
    void resolveAsset(resolvedSrc).then((result) => {
      if (active) setAsset(result);
    });

    return () => {
      active = false;
    };
  }, [resolvedSrc, responsive]);

  if (!src) return null;

  const variants = asset?.variants ?? [];
  const avifSrcSet = srcSetFor(variants, 'avif');
  const webpSrcSet = srcSetFor(variants, 'webp');
  const fallbackSrcSet = srcSetFor(variants, 'jpeg');

  // Intrinsic dimensions: server metadata is authoritative because it accounts
  // for EXIF rotation; the props are only a hint for unresolved images. Passing
  // both to the <img> is what reserves the correct space and keeps CLS at 0.
  const intrinsicWidth = asset?.width ?? width;
  const intrinsicHeight = asset?.height ?? height;

  // Placeholder treatment: blurhash once it decodes, dominant colour otherwise.
  const placeholderUrl = !loaded ? blurhashToDataUrl(asset?.blurhash) : null;
  const placeholderStyle: CSSProperties = !loaded
    ? placeholderUrl
      ? {
          backgroundImage: `url(${placeholderUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }
      : asset?.dominantColor
        ? { backgroundColor: asset.dominantColor }
        : {}
    : {};

  const img = (
    <img
      src={resolvedSrc}
      srcSet={fallbackSrcSet}
      sizes={fallbackSrcSet ? sizes : undefined}
      alt={alt}
      width={intrinsicWidth}
      height={intrinsicHeight}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      {...({ fetchPriority: priority ? 'high' : 'auto' } as WithFetchPriority)}
      className={cn(className)}
      style={{ ...placeholderStyle, ...style }}
      onLoad={(event) => {
        setLoaded(true);
        onLoad?.(event);
      }}
      {...rest}
    />
  );

  if (!avifSrcSet && !webpSrcSet) return img;

  return (
    <picture className={cn(pictureClassName)}>
      {avifSrcSet ? <source type="image/avif" srcSet={avifSrcSet} sizes={sizes} /> : null}
      {webpSrcSet ? <source type="image/webp" srcSet={webpSrcSet} sizes={sizes} /> : null}
      {img}
    </picture>
  );
}
