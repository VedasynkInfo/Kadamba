import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { cn } from '@/utils/cn';

/**
 * A small entrance for each public route.
 *
 * A real exit transition needs the old route to stay mounted while the new one
 * arrives, which fights the data router's ownership of the outlet. React Router
 * 7's View Transitions API covers that case where the browser supports it (see
 * `viewTransition` on links); this is the dependable fallback: the new page
 * fades up once, cheaply, on the compositor.
 */
export function RouteTransition({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const reduced = usePrefersReducedMotion();
  // `viewTransition` links already animate the root snapshot where the API
  // exists. Running the CSS entrance as well would fade the new snapshot twice.
  const nativeTransition = typeof document !== 'undefined' && 'startViewTransition' in document;

  return (
    <div key={pathname} className={cn(!reduced && !nativeTransition && 'route-enter')}>
      {children}
    </div>
  );
}
