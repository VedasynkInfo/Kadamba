import { useLayoutEffect, useRef } from 'react';
import { gsap } from '@/motion/gsap';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

export interface ScrollRevealOptions {
  /** Elements to reveal, relative to the returned scope. */
  selector?: string;
  /** Vertical distance in pixels. */
  y?: number;
  /** How far into the viewport the trigger starts. */
  start?: string;
  /** Delay between batched elements. */
  stagger?: number;
}

/**
 * GSAP ScrollTrigger storytelling for a section.
 *
 * Framer Motion is excellent for a component's own state changes; ScrollTrigger
 * is better when several elements share one scroll position and need to be
 * choreographed against it (a timeline line drawing while its steps arrive).
 * Reduced motion returns the unanimated tree, exactly as the framer sections do.
 */
export function useScrollReveal<T extends HTMLElement>({
  selector = '[data-reveal]',
  y = 34,
  start = 'top 86%',
  stagger = 0.08,
}: ScrollRevealOptions = {}) {
  const ref = useRef<T>(null);
  const reduced = usePrefersReducedMotion();

  useLayoutEffect(() => {
    const scope = ref.current;
    if (!scope || reduced) return;

    const ctx = gsap.context(() => {
      const targets = gsap.utils.toArray<HTMLElement>(selector, scope);
      if (targets.length === 0) return;

      targets.forEach((target, index) => {
        gsap.from(target, {
          opacity: 0,
          y,
          duration: 0.85,
          delay: index * stagger,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: target,
            start,
            once: true,
          },
        });
      });

      const line = scope.querySelector<HTMLElement>('[data-reveal-line]');
      if (line) {
        gsap.from(line, {
          scaleX: 0,
          transformOrigin: 'left center',
          duration: 1.1,
          ease: 'power2.inOut',
          scrollTrigger: {
            trigger: line,
            start: 'top 88%',
            once: true,
          },
        });
      }
    }, scope);

    return () => ctx.revert();
  }, [reduced, selector, start, stagger, y]);

  return ref;
}
