import { RouterProvider } from 'react-router-dom';
import { ErrorBoundary } from '@/components/feedback/ErrorBoundary';
import { ToastProvider } from '@/components/ui';
import { QueryErrorBridge } from '@/lib/QueryErrorBridge';
import { AuthProvider } from '@/hooks/useAuth';
import { PortalAuthProvider } from '@/hooks/usePortalAuth';
import { ThemeProvider } from '@/context/ThemeContext';
import { router } from '@/router';

/**
 * Providers, then the router — in that order, so every route (and every route
 * loader) can reach the session, theme, toast and query contexts.
 *
 * The route tree itself lives in `@/router` (its page inventory in
 * `@/router/pages`); a data router is configured once at module scope rather
 * than declared as JSX.
 */
export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <PortalAuthProvider>
          <ThemeProvider>
            <ToastProvider>
              <QueryErrorBridge />
              <RouterProvider router={router} />
            </ToastProvider>
          </ThemeProvider>
        </PortalAuthProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
