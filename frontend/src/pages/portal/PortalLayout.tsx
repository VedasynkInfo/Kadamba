import { useCallback, useEffect, useState } from 'react';
import { NavLink, Outlet, Navigate, useLocation, Link } from 'react-router-dom';
import { brand } from '@/pages/home/data';
import { usePortalAuth } from '@/hooks/usePortalAuth';
import { PortalNotifyProvider, usePortalNotify } from '@/hooks/usePortalNotifySocket';
import { portalApi } from '@/services/portal/portalService';
import { cn } from '@/utils/cn';
import { PageMeta } from '@/seo';

const nav = [
  { to: '/portal/dashboard', label: 'Home', end: true },
  { to: '/portal/orders', label: 'Orders' },
  { to: '/portal/measurements', label: 'Measurements' },
  { to: '/portal/chat', label: 'Chat', badgeKey: 'chat' as const },
  { to: '/portal/payments', label: 'Invoices' },
  { to: '/portal/requests', label: 'Request' },
];

function RequirePortal({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = usePortalAuth();
  const location = useLocation();
  if (!isAuthenticated) {
    return <Navigate to="/portal/login" replace state={{ from: location.pathname }} />;
  }
  return <>{children}</>;
}

function PortalShell() {
  const { user, logout } = usePortalAuth();
  const notify = usePortalNotify();
  const [unreadChat, setUnreadChat] = useState(0);

  const refreshUnread = useCallback(async () => {
    try {
      const dash = await portalApi.dashboard();
      setUnreadChat(dash.unreadChatCount || 0);
    } catch {
      // keep last
    }
  }, []);

  useEffect(() => {
    void refreshUnread();
  }, [refreshUnread, notify.refreshTick]);

  useEffect(() => {
    return notify.onSoftRefresh((kinds) => {
      if (kinds.includes('chat') || kinds.includes('dashboard')) {
        void refreshUnread();
      }
    });
  }, [notify, refreshUnread]);

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_#2a2118_0%,_#0c0a08_55%)] text-cream">
      <header className="border-b border-gold/20 bg-black/40 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link to="/portal/dashboard" className="min-w-0">
            <p className="font-heading text-xl tracking-wide text-gold sm:text-2xl">
              {brand.shortName}
            </p>
            <p className="truncate text-[0.62rem] uppercase tracking-[0.28em] text-cream/50">
              Customer portal · {brand.location}
            </p>
          </Link>
          <div className="flex items-center gap-3 text-right">
            <div className="hidden sm:block">
              <p className="text-sm text-cream/90">{user?.name}</p>
              {user?.referenceId ? (
                <p className="font-mono text-[0.65rem] text-gold/80">{user.referenceId}</p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={logout}
              className="rounded-sm border border-gold/30 px-3 py-1.5 text-[0.65rem] uppercase tracking-[0.18em] text-gold/90 transition hover:border-gold hover:bg-gold/10"
            >
              Sign out
            </button>
          </div>
        </div>
        <nav
          className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-2 pb-3 sm:px-6"
          aria-label="Portal"
        >
          {nav.map((item) => {
            const badge = item.badgeKey === 'chat' ? unreadChat : 0;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'shrink-0 rounded-sm px-3 py-2 text-xs uppercase tracking-[0.16em] transition',
                    isActive
                      ? 'bg-gold/15 text-gold'
                      : 'text-cream/55 hover:bg-white/5 hover:text-cream',
                  )
                }
              >
                <span className="inline-flex items-center gap-1.5">
                  {item.label}
                  {badge > 0 ? (
                    <span className="inline-flex min-w-[1.1rem] items-center justify-center rounded-sm bg-gold/30 px-1 text-[0.6rem] font-semibold text-gold">
                      {badge > 99 ? '99+' : badge}
                    </span>
                  ) : null}
                </span>
              </NavLink>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        <Outlet />
      </main>
    </div>
  );
}

export function PortalLayout() {
  return (
    <RequirePortal>
      <PageMeta
        title="Customer Portal"
        description="Track your Kadamba orders and measurements."
        path="/portal/dashboard"
      />
      <PortalNotifyProvider>
        <PortalShell />
      </PortalNotifyProvider>
    </RequirePortal>
  );
}
