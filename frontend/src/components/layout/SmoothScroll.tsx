import { useEffect } from 'react';
import Lenis from 'lenis';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

/**
 * Public-site smooth scrolling.
 *
 * Lenis is intentionally scoped to `MainLayout`: a long editorial page benefits
 * from eased wheel scrolling, while the console and portal need direct, precise
 * scrolling for tables, boards and forms. Reduced-motion visitors keep the
 * browser's native scroll entirely.
 */
export function SmoothScroll() {
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) return;

    const lenis = new Lenis({
      autoRaf: true,
      lerp: 0.09,
      smoothWheel: true,
      anchors: true,
      // Links inside an overlay (lightboxes, drawers) are handled by the
      // browser; Lenis should not also try to animate them.
      prevent: (node) =>
        node instanceof HTMLElement &&
        Boolean(node.closest('[data-lenis-prevent], [role="dialog"], [role="menu"]')),
    });

    return () => lenis.destroy();
  }, [reduced]);

  return null;
}
