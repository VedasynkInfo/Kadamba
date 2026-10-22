import { useEffect, useRef, useState, type ReactNode } from 'react';
import { motion, useInView } from 'framer-motion';
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
 *
 * The visibility decision is made by `useInView` and applied through `animate`
 * rather than `whileInView`. Two reasons: a fully clipped element can report a
 * zero-area intersection, and an element above the viewport on mount (a deep
 * link, a restored scroll, a `#catalogue` jump) never intersects at all. Both
 * cases used to leave a card invisible; the mount check covers the second, and
 * driving a plain animate value covers the first.
 */
export function ClipReveal({ children, className, delay = 0 }: ClipRevealProps) {
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-8%' });
  const [past, setPast] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (element && element.getBoundingClientRect().top < 0) setPast(true);
  }, []);

  const shown = reduced || past || inView;

  return (
    <motion.div
      ref={ref}
      className={cn('overflow-hidden', className)}
      initial={false}
      animate={{ clipPath: shown ? 'inset(0 0 0% 0)' : 'inset(0 0 100% 0)' }}
      transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
