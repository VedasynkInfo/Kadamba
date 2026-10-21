import { useRef, type ReactNode } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { cn } from '@/utils/cn';

export interface MagneticProps {
  children: ReactNode;
  className?: string;
  /** Maximum travel in pixels. Keep it small: this is a hint, not a toy. */
  strength?: number;
}

/**
 * Magnetic hover for a primary action.
 *
 * Pointer-only by construction: touch devices do not hover, and reduced-motion
 * users get a perfectly still button. The child is not cloned or wrapped in an
 * extra interactive element, so keyboard semantics are unchanged.
 */
export function Magnetic({ children, className, strength = 9 }: MagneticProps) {
  const reduced = usePrefersReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 220, damping: 18, mass: 0.25 });
  const springY = useSpring(y, { stiffness: 220, damping: 18, mass: 0.25 });

  const canHover = () =>
    typeof window !== 'undefined' && window.matchMedia('(pointer: fine)').matches;

  return (
    <motion.div
      ref={ref}
      className={cn('inline-block', className)}
      style={reduced ? undefined : { x: springX, y: springY }}
      onPointerMove={(event) => {
        if (reduced || !canHover() || !ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        x.set(((event.clientX - rect.left) / rect.width - 0.5) * strength * 2);
        y.set(((event.clientY - rect.top) / rect.height - 0.5) * strength * 2);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}
