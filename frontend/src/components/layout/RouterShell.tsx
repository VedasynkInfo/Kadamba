import { Suspense, useEffect, useRef } from 'react';
import { Outlet, ScrollRestoration, useLocation } from 'react-router-dom';
import { Spinner } from '@/components/ui';
import { OfflineBanner } from '@/components/feedback/OfflineBanner';

/**
 * The frame every route renders inside.
 *
 * `ScrollRestoration` is why this exists at all. Without it the window keeps the
 * previous page's offset, so following a link from halfway down the gallery
 * lands you halfway down the service page — and returning to a long list loses
 * your place. Only a data router can do both halves of that (reset on a push,
 * restore on back/forward).
 *
 * `OfflineBanner` sits here rather than in each layout so the public site, the
 * console and the portal all report the connection, and none of them can forget
 * to.
 *
 * The `Suspense` boundary sits above every route, so a page whose chunk is still
 * downloading shows this fallback instead of an empty shell.
 */
export function RouterShell() {
  const location = useLocation();
  const firstRender = useRef(true);

  useEffect(() => {
    // A client-side route change replaces the page without moving focus, so a
    // keyboard or screen-reader user stays parked on the old page's link while
    // the new page renders. Once per real navigation, put focus at the start of
    // the new content. `preventScroll` leaves `ScrollRestoration` in charge.
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }

    const main =
      document.getElementById('admin-main') ??
      document.getElementById('main-content') ??
      document.getElementById('portal-main');

    main?.focus({ preventScroll: true });
  }, [location.pathname]);

  return (
    <>
      <OfflineBanner />
      <ScrollRestoration />
      <Suspense fallback={<RouteFallback />}>
        <Outlet />
      </Suspense>
    </>
  );
}

/** Shown while a route's lazy chunk downloads. */
export function RouteFallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center bg-surface">
      <Spinner size="lg" label="Loading page" />
    </div>
  );
}
