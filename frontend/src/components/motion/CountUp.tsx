import { useEffect, useRef } from 'react';
import { animate, motion, useInView, useMotionValue, useTransform } from 'framer-motion';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

export interface CountUpProps {
  /** The number to arrive at. */
  value: number;
  /** Seconds. */
  duration?: number;
  /** How the number reads: currency, percentage, plain. */
  format?: (value: number) => string;
  className?: string;
}

/**
 * A number that counts up to its value.
 *
 * A figure that has just changed deserves a beat of attention: the count-up
 * is the cheapest way to say "this is new" without a badge or a colour. It
 * runs once, when the figure scrolls into view, and it never runs at all for
 * anyone who has asked the system not to animate.
 */
export function CountUp({ value, duration = 0.9, format, className }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-10% 0px' });
  const reducedMotion = usePrefersReducedMotion();
  const motionValue = useMotionValue(0);

  const text = useTransform(motionValue, (latest) => {
    const rounded = Math.round(latest);
    return format ? format(rounded) : rounded.toLocaleString('en-IN');
  });

  useEffect(() => {
    if (reducedMotion) {
      motionValue.set(value);
      return;
    }
    if (!inView) return;
    const controls = animate(motionValue, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
    });
    return () => controls.stop();
  }, [inView, value, duration, reducedMotion, motionValue]);

  return (
    <motion.span ref={ref} className={className}>
      {text}
    </motion.span>
  );
}
