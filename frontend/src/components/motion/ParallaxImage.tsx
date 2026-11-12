import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { OptimizedImage } from '@/components/media/OptimizedImage';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { cn } from '@/utils/cn';

export interface ParallaxImageProps {
  src: string;
  alt: string;
  className?: string;
  imageClassName?: string;
  sizes?: string;
  width?: number;
  height?: number;
  priority?: boolean;
  /** Travel as a fraction of the container height. Keep below 0.18. */
  speed?: number;
  /** Overscale so the moving image never exposes an edge. */
  scale?: number;
}

/**
 * A photograph on a slow vertical drift.
 *
 * The frame clips; only the image moves. That is the whole premium effect:
 * the page scrolls at one speed, the image at another, and the composition
 * feels deeper without any layout work. Reduced motion returns the still
 * image in the same frame.
 */
export function ParallaxImage({
  src,
  alt,
  className,
  imageClassName,
  sizes = '100vw',
  width,
  height,
  priority = false,
  speed = 0.1,
  scale = 1.12,
}: ParallaxImageProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [`-${speed * 100}%`, `${speed * 100}%`]);

  return (
    <div ref={ref} className={cn('relative h-full w-full overflow-hidden', className)}>
      <motion.div
        className="absolute inset-0 will-change-transform"
        style={reduced ? undefined : { y, scale }}
      >
        <OptimizedImage
          src={src}
          alt={alt}
          sizes={sizes}
          width={width}
          height={height}
          priority={priority}
          className={cn('h-full w-full object-cover', imageClassName)}
        />
      </motion.div>
    </div>
  );
}
