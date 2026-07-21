import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Spinner } from '@/components/ui';

/**
 * JWT gate for the studio console — admin role required.
 */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated || !user) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />;
  }

  if (user.role !== 'admin') {
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

/** Lightweight placeholder while auth hydrates from storage (sync today). */
export function AdminGateFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
      <Spinner />
    </div>
  );
}
