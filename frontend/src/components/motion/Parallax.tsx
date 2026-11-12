import { useRef, type ReactNode } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { cn } from '@/utils/cn';

export interface ParallaxProps {
  children: ReactNode;
  /** How much the inner layer travels, as a fraction of the container height. */
  speed?: number;
  className?: string;
  /** Extra scale applied to the inner layer so the parallax never reveals edges. */
  scale?: number;
}

/**
 * A scroll-driven depth layer.
 *
 * The container clips; the inner content travels a short distance against the
 * scroll. One property, one transform, compositor-friendly. Reduced motion
 * returns the plain tree.
 */
export function Parallax({ children, speed = 0.16, className, scale = 1.12 }: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [`-${speed * 100}%`, `${speed * 100}%`]);

  return (
    <div ref={ref} className={cn('relative overflow-hidden', className)}>
      <motion.div
        className="h-full w-full will-change-transform"
        style={reduced ? undefined : { y, scale }}
      >
        {children}
      </motion.div>
    </div>
  );
}