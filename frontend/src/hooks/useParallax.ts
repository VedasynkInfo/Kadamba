import { useEffect, useRef } from 'react';
import { gsap } from '@/motion/gsap';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

export interface ParallaxOptions {
  /** How far the element drifts, as a percentage of its own height. */
  amount?: number;
  /** The scroll span the drift covers. */
  start?: string;
  end?: string;
  /** The element that moves. Defaults to the returned ref's first child. */
  target?: HTMLElement | null;
}

/**
 * A scroll-driven drift.
 *
 * The element moves against the scroll, so a section with a tall image reads
 * as depth rather than as a flat band. The drift is scrubbed — it follows the
 * scroll position exactly — and it is skipped entirely when the visitor has
 * asked for reduced motion, because a drifting image is the kind of movement
 * that setting exists to stop.
 */
export function useParallax<T extends HTMLElement = HTMLElement>({
  amount = 8,
  start = 'top bottom',
  end = 'bottom top',
  target,
}: ParallaxOptions = {}) {
  const scopeRef = useRef<T>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const scope = scopeRef.current;
    const element = target ?? scope?.firstElementChild;
    if (!scope || !element || reduced) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        element,
        { yPercent: -amount },
        {
          yPercent: amount,
          ease: 'none',
          scrollTrigger: { trigger: scope, start, end, scrub: true },
        },
      );
    }, scope);

    return () => ctx.revert();
  }, [amount, end, reduced, start, target]);

  return scopeRef;
}
