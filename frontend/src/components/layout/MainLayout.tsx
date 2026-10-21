import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { PublicContentProvider } from '@/hooks/usePublicContent';
import { RouteFallback } from '@/components/layout/RouterShell';
import { Footer } from './Footer';
import { Navbar } from './Navbar';

export function MainLayout() {
  return (
    <PublicContentProvider>
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
            <Outlet />
          </Suspense>
        </main>
        <Footer />
      </div>
    </PublicContentProvider>
  );
}
