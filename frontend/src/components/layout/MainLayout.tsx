import { Suspense } from 'react';
import { useOutlet } from 'react-router-dom';
import { PublicContentProvider } from '@/hooks/usePublicContent';
import { RouteFallback } from '@/components/layout/RouterShell';
import { SitePreloader } from '@/components/motion/SitePreloader';
import { Footer } from './Footer';
import { Navbar } from './Navbar';
import { RouteTransition } from './RouteTransition';
import { SmoothScroll } from './SmoothScroll';

export function MainLayout() {
  const outlet = useOutlet();

  return (
    <PublicContentProvider>
      <SmoothScroll />
      <SitePreloader />
      <div className="flex min-h-screen flex-col bg-surface">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-black focus:px-4 focus:py-2 focus:text-sm focus:text-ink-inverse focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        >
          Skip to content
        </a>
        <Navbar />
        <main id="main-content" tabIndex={-1} className="flex-1">
          <Suspense fallback={<RouteFallback />}>
            <RouteTransition>{outlet}</RouteTransition>
          </Suspense>
        </main>
        <Footer />
      </div>
    </PublicContentProvider>
  );
}
