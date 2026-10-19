import { Suspense } from 'react';
import { Outlet, ScrollRestoration } from 'react-router-dom';
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
    <div className="flex min-h-[50vh] items-center justify-center bg-cream">
      <Spinner size="lg" label="Loading page" />
    </div>
  );
}
