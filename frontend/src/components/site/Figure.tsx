import type { ReactNode } from 'react';
import { OptimizedImage } from '@/components/media/OptimizedImage';
import { cn } from '@/utils/cn';

export interface FigureProps {
  src: string;
  alt: string;
  /** The caption printed beneath the plate. */
  caption?: ReactNode;
  /** A short label above the caption, e.g. "Look 04". */
  kicker?: ReactNode;
  /** Aspect ratio utility, e.g. "aspect-[4/5]". */
  ratio?: string;
  /** Frame colour: light plates on paper, dark plates on espresso. */
  frame?: 'light' | 'dark' | 'none';
  /** Zoom the image on hover (only when the figure is interactive). */
  hover?: boolean;
  priority?: boolean;
  sizes?: string;
  className?: string;
  imageClassName?: string;
  children?: ReactNode;
}

/**
 * A plate: an image in a mount, with its caption.
 *
 * The mount is the studio habit that the whole site borrows — a photograph is
 * framed with air around it rather than bled to the edge, and the caption is
 * set small and quiet underneath, the way a gallery label is. `children` are
 * laid over the image for a look's title or a play control.
 */
export function Figure({
  src,
  alt,
  caption,
  kicker,
  ratio = 'aspect-[4/5]',
  frame = 'dark',
  hover = false,
  priority = false,
  sizes = '(min-width: 1024px) 33vw, 100vw',
  className,
  imageClassName,
  children,
}: FigureProps) {
  return (
    <figure className={cn('group', className)}>
      <div
        className={cn(
          'plate',
          ratio,
          frame === 'light' && 'plate-frame plate-frame-dark',
          frame === 'dark' && 'plate-frame',
          hover && 'plate-hover',
        )}
      >
        <OptimizedImage
          src={src}
          alt={alt}
          priority={priority}
          sizes={sizes}
          className={cn('h-full w-full object-cover', imageClassName)}
        />
        {children}
      </div>
      {(kicker || caption) && (
        <figcaption className="mt-4 flex items-baseline justify-between gap-4">
          {kicker ? (
            <span className="text-[0.62rem] font-semibold uppercase tracking-[0.28em] text-ink/45">
              {kicker}
            </span>
          ) : (
            <span />
          )}
          {caption ? <span className="text-sm text-ink/65">{caption}</span> : null}
        </figcaption>
      )}
    </figure>
  );
}
