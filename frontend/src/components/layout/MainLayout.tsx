import { Suspense, useEffect, useState } from 'react';
import { useOutlet } from 'react-router-dom';
import { PublicContentProvider } from '@/hooks/usePublicContent';
import { RouteFallback } from '@/components/layout/RouterShell';
import { SitePreloader } from '@/components/motion/SitePreloader';
import { GlobalChrome } from '@/components/motion/GlobalChrome';
import { Footer } from './Footer';
import { Navbar } from './Navbar';
import { RouteTransition } from './RouteTransition';
import { SmoothScroll } from './SmoothScroll';

/**
 * Keep the closing spread out of the initial viewport until the route's own
 * content has stopped growing. The footer is still in the DOM (crawlers and
 * screen readers get it), but it is visually hidden during the first layout
 * pass — the pass where a lazy route chunk or an image could otherwise push it
 * down and register as CLS in a Core Web Vitals report.
 */
function DeferredFooter() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const main = document.getElementById('main-content');
    let settleTimer = 0;
    let fallbackTimer = 0;

    const show = () => setVisible(true);
    const settle = () => {
      window.clearTimeout(settleTimer);
      settleTimer = window.setTimeout(show, 450);
    };

    const observer = main ? new ResizeObserver(settle) : null;
    if (main && observer) observer.observe(main);
    fallbackTimer = window.setTimeout(show, 1400);

    return () => {
      observer?.disconnect();
      window.clearTimeout(settleTimer);
      window.clearTimeout(fallbackTimer);
    };
  }, []);

  return (
    <div className={visible ? 'opacity-100 transition-opacity duration-500' : 'invisible'}>
      <Footer />
    </div>
  );
}

export function MainLayout() {
  const outlet = useOutlet();

  return (
    <PublicContentProvider>
      <SmoothScroll />
      <SitePreloader />
      <GlobalChrome />
      {/* `public-shell` re-points the type and adds the editorial utilities.
          See the note in index.css: the console and the portal never inherit
          the serif, because they are never inside this element. */}
      <div className="public-shell flex min-h-screen flex-col bg-surface">
        <a
          href="#main-content"
          className="on-dark sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-espresso focus:px-4 focus:py-2 focus:text-sm focus:text-ink-inverse focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        >
          Skip to content
        </a>
        <Navbar />
        <main id="main-content" tabIndex={-1} className="min-h-[calc(100dvh+5rem)] flex-1">
          <Suspense fallback={<RouteFallback />}>
            <RouteTransition>{outlet}</RouteTransition>
          </Suspense>
        </main>
        <DeferredFooter />
      </div>
    </PublicContentProvider>
  );
}
