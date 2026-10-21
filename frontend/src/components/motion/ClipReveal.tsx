import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { cn } from '@/utils/cn';

export interface ClipRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

/**
 * Image reveal by clipping, not fading.
 *
 * The frame is already in place; the photograph is uncovered. That reads as
 * couture work being revealed rather than a card loading, and it is one
 * compositor-friendly property (`clip-path`) instead of a layout animation.
 */
export function ClipReveal({ children, className, delay = 0 }: ClipRevealProps) {
  const reduced = usePrefersReducedMotion();

  return (
    <motion.div
      className={cn('overflow-hidden', className)}
      initial={reduced ? false : { clipPath: 'inset(0 0 100% 0)' }}
      animate={reduced ? { clipPath: 'inset(0 0 0% 0)' } : undefined}
      whileInView={reduced ? undefined : { clipPath: 'inset(0 0 0% 0)' }}
      viewport={{ once: true, margin: '-8%' }}
      transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
