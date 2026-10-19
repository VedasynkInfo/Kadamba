import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Button } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { AdminNotifyProvider, useAdminNotify } from '@/hooks/useAdminNotifySocket';
import { brand } from '@/pages/home/data';
import { LeadsProvider } from '@/pages/leads/LeadsContext';
import { useTheme } from '@/context/ThemeContext';
import { PageMeta, staticPageMeta } from '@/seo';
import { cn } from '@/utils/cn';
import { AdminContentProvider } from './AdminContentContext';
import { OptimizedImage } from '@/components/media/OptimizedImage';
import { adminNav } from './data';
import { RequireAdmin } from './RequireAdmin';

const navIcons: Record<string, string> = {
  '/admin': '📊',
  '/admin/gallery': '📸',
  '/admin/services': '✂️',
  '/admin/portfolio': '✨',
  '/admin/blogs': '✍️',
  '/admin/leads': '🎯',
  '/admin/customers': '👥',
  '/admin/products': '👗',
  '/admin/orders': '📦',
  '/admin/measurements': '📏',
  '/admin/invoices': '🧾',
  '/admin/payments': '💳',
  '/admin/staff': '🧑‍🎨',
  '/admin/finance': '📈',
  '/admin/reports': '📋',
  '/admin/settings': '⚙️',
  '/admin/users': '🔐',
  '/admin/audit': '📜',
  '/admin/media': '🖼️',
  '/admin/profile': '👤',
};

function NavBadge({ count }: { count: number }) {
  if (!count) return null;
  return (
    <span className="ml-1.5 inline-flex min-w-[1.15rem] items-center justify-center rounded-sm bg-gold/25 px-1 py-0.5 text-[0.6rem] font-semibold text-gold">
      {count > 99 ? '99+' : count}
    </span>
  );
}

function AdminNavLinks({ collapsed, mobile }: { collapsed?: boolean; mobile?: boolean }) {
  const { badges } = useAdminNotify();
  const { user } = useAuth();

  /** Admins see everything; staff only see what they can actually open. */
  const visibleNav = adminNav.filter((item) => {
    if (!item.permission) return true;
    if (!user) return false;
    if (user.role === 'admin') return true;
    return (user.permissions ?? []).includes(item.permission);
  });

  function badgeFor(to: string) {
    if (to.startsWith('/admin/leads')) return badges.leads;
    if (to.startsWith('/admin/measurements')) return badges.measurements;
    return 0;
  }

  return (
    <>
      {visibleNav.map((item) => {
        const count = badgeFor(item.to);
        const icon = navIcons[item.to] || '📁';
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            title={item.label}
            style={({ isActive }) => ({
              color: isActive ? 'var(--color-accent, #ffd700)' : 'var(--admin-sidebar-text, #f3f4f6)',
              backgroundColor: isActive ? 'rgba(255, 215, 0, 0.12)' : undefined,
            })}
            className={({ isActive }) =>
              cn(
                'group flex items-center gap-2.5 transition rounded-md',
                mobile
                  ? 'shrink-0 px-3 py-2 text-[0.65rem] uppercase tracking-[0.14em]'
                  : 'px-3 py-2.5 text-sm',
                !mobile && collapsed && 'justify-center px-2 py-2 text-center text-xs',
                !isActive && 'opacity-75 hover:opacity-100 hover:bg-white/[0.06]',
                isActive && 'font-semibold',
              )
            }
          >
            <span className={cn('text-sm shrink-0', collapsed && !mobile && 'text-base')}>
              {icon}
            </span>
            {collapsed && !mobile ? null : (
              <span className="inline-flex flex-1 items-center justify-between">
                <span className="truncate">{item.label}</span>
                <NavBadge count={count} />
              </span>
            )}
          </NavLink>
        );
      })}
    </>
  );
}

/**
 * Phase 12 admin shell — collapsible atelier console with live notify badges.
 */
export function AdminLayout() {
  const { user, logout } = useAuth();
  const { logoDarkUrl, logoUrl } = useTheme();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('kadamba_admin_sidebar_collapsed') === 'true';
  });

  const activeLogo = logoDarkUrl || logoUrl;

  const toggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('kadamba_admin_sidebar_collapsed', String(next));
      return next;
    });
  };

  return (
    <RequireAdmin>
      <PageMeta {...staticPageMeta.admin} />
      <AdminContentProvider>
        <AdminNotifyProvider>
          <LeadsProvider>
            <div
              className="flex min-h-screen font-admin"
              style={{
                backgroundColor: 'var(--admin-bg, #0b0f17)',
                color: 'var(--admin-text, #f3f4f6)',
              }}
            >
              <aside
                className={cn(
                  'hidden shrink-0 flex-col border-r border-white/10 transition-[width] duration-300 md:flex',
                  collapsed ? 'w-[4.25rem]' : 'w-60',
                )}
                style={{
                  backgroundColor: 'var(--admin-sidebar, #111827)',
                  color: 'var(--admin-sidebar-text, #f3f4f6)',
                }}
              >
                <div className={cn('px-4 py-6', collapsed && 'px-2 text-center')}>
                  {!collapsed ? (
                    <div className="flex items-center gap-2">
                      {activeLogo ? (
                        <OptimizedImage
                          src={activeLogo}
                          alt={brand.shortName}
                          responsive={false}
                          priority
                          className="h-7 w-auto object-contain"
                        />
                      ) : (
                        <p className="font-heading text-xl font-bold tracking-wide text-gold">
                          {brand.shortName}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-center font-heading text-xl font-extrabold text-gold">K</p>
                  )}
                  {!collapsed && (
                    <p className="mt-1 text-[0.62rem] uppercase tracking-[0.25em] opacity-60">
                      Studio Console
                    </p>
                  )}
                </div>

                <nav
                  className="flex flex-1 flex-col gap-1 px-2 pb-4 overflow-y-auto"
                  aria-label="Admin navigation"
                >
                  <AdminNavLinks collapsed={collapsed} />
                </nav>

                <div className="mt-auto space-y-3 border-t border-white/10 px-3 py-5">
                  <button
                    type="button"
                    onClick={toggleCollapse}
                    className="w-full text-left text-[0.65rem] uppercase tracking-[0.18em] opacity-60 transition hover:opacity-100 hover:text-gold"
                  >
                    {collapsed ? '»' : 'Collapse'}
                  </button>
                  {!collapsed && user ? (
                    <p className="truncate text-xs opacity-60">{user.email}</p>
                  ) : null}
                  <Button
                    variant="secondary"
                    size="sm"
                    className={cn('w-full', collapsed && 'px-1 text-[0.6rem]')}
                    onClick={() => {
                      logout();
                      navigate('/admin/login');
                    }}
                  >
                    {collapsed ? 'Out' : 'Sign out'}
                  </Button>
                  <a
                    href="/"
                    className={cn(
                      'block text-[0.65rem] uppercase tracking-[0.18em] opacity-60 transition hover:opacity-100 hover:text-gold',
                      collapsed && 'text-center',
                    )}
                  >
                    {collapsed ? '←' : '← Public site'}
                  </a>
                </div>
              </aside>

              <div className="flex min-w-0 flex-1 flex-col">
                <header
                  className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 md:hidden"
                  style={{
                    backgroundColor: 'var(--admin-sidebar, #111827)',
                    color: 'var(--admin-sidebar-text, #f3f4f6)',
                  }}
                >
                  <p className="font-heading text-lg text-gold">{brand.shortName}</p>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      logout();
                      navigate('/admin/login');
                    }}
                  >
                    Sign out
                  </Button>
                </header>
                <nav
                  className="flex gap-1 overflow-x-auto border-b border-white/10 px-2 py-2 md:hidden"
                  style={{
                    backgroundColor: 'var(--admin-sidebar, #111827)',
                    color: 'var(--admin-sidebar-text, #f3f4f6)',
                  }}
                  aria-label="Admin mobile"
                >
                  <AdminNavLinks mobile />
                </nav>
                <div
                  className="flex-1 transition-colors min-h-screen admin-scope"
                  style={{
                    backgroundColor: 'var(--admin-bg, #0b0f17)',
                    color: 'var(--admin-text, #f3f4f6)',
                  }}
                >
                  <Outlet />
                </div>
              </div>
            </div>
          </LeadsProvider>
        </AdminNotifyProvider>
      </AdminContentProvider>
    </RequireAdmin>
  );
}
