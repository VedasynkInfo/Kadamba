import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Spinner } from '@/components/ui';

/**
 * Session gate for the studio console.
 *
 * The access token lives in memory, so on a hard refresh there is a brief
 * window while the httpOnly refresh cookie is exchanged for a new one. We show
 * the fallback during that window instead of redirecting to the login page
 * (which would make every reload look like a sign-out).
 */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <AdminGateFallback />;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  if (user.role !== 'admin' && user.role !== 'staff') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#0a0a0a] px-6 text-center text-cream">
        <p className="font-heading text-2xl text-gold">Access limited</p>
        <p className="max-w-sm text-sm text-cream/70">
          This console is for studio administrators only.
        </p>
        <a href="/" className="text-xs uppercase tracking-[0.2em] text-gold/80 hover:text-gold">
          ← Public site
        </a>
      </div>
    );
  }

  return <>{children}</>;
}

/** Lightweight placeholder while the session is restored from the cookie. */
export function AdminGateFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
      <Spinner />
    </div>
  );
}
