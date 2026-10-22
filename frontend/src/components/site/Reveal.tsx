import { useEffect, useRef, useState, type ElementType, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { cn } from '@/utils/cn';

export interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Seconds to wait before this element arrives. */
  delay?: number;
  /** Distance travelled, in pixels. */
  y?: number;
  as?: ElementType;
}

/**
 * The house entrance.
 *
 * One motion, used everywhere: a short rise and a fade, once, when the element
 * first comes into view. Sections that reach for a different effect each time
 * read as a demo; this is the reason the public pages move as one document.
 *
 * Reduced motion returns the plain element — not an element that animates
 * instantly, which would still shift layout.
 *
 * Elements already above the viewport at mount (deep links, restored scroll)
 * are shown at once; see the note in `ClipReveal`.
 */
export function Reveal({ children, className, delay = 0, y = 26, as = 'div' }: RevealProps) {
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [past, setPast] = useState(false);
  const MotionTag = motion[as as 'div'];
  const Tag = as;

  useEffect(() => {
    const element = ref.current;
    if (element && element.getBoundingClientRect().top < 0) setPast(true);
  }, []);

  if (reduced) {
    return <Tag className={className}>{children}</Tag>;
  }

  return (
    <MotionTag
      ref={ref}
      className={cn(className)}
      initial={past ? false : { opacity: 0, y }}
      animate={past ? { opacity: 1, y: 0 } : undefined}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.75, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </MotionTag>
  );
}
