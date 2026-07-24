import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Button } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { AdminNotifyProvider, useAdminNotify } from '@/hooks/useAdminNotifySocket';
import { brand } from '@/pages/home/data';
import { LeadsProvider } from '@/pages/leads/LeadsContext';
import { PageMeta, staticPageMeta } from '@/seo';
import { cn } from '@/utils/cn';
import { AdminContentProvider } from './AdminContentContext';
import { adminNav } from './data';
import { RequireAdmin } from './RequireAdmin';

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

  function badgeFor(to: string) {
    if (to.startsWith('/admin/leads')) return badges.leads;
    if (to.startsWith('/admin/measurements')) return badges.measurements;
    return 0;
  }

  return (
    <>
      {adminNav.map((item) => {
        const count = badgeFor(item.to);
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            title={item.label}
            className={({ isActive }) =>
              cn(
                mobile
                  ? 'shrink-0 px-3 py-2 text-[0.65rem] uppercase tracking-[0.14em]'
                  : 'rounded-sm px-3 py-2.5 text-sm transition',
                !mobile && collapsed && 'px-2 text-center text-[0.65rem] tracking-wide',
                mobile
                  ? isActive
                    ? 'text-gold'
                    : 'text-cream/55'
                  : isActive
                    ? 'bg-gold/15 text-gold'
                    : 'text-cream/65 hover:bg-cream/5 hover:text-cream',
              )
            }
          >
            {collapsed && !mobile ? (
              item.label.slice(0, 1)
            ) : (
              <span className="inline-flex items-center">
                {item.label}
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
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <RequireAdmin>
      <PageMeta {...staticPageMeta.admin} />
      <AdminContentProvider>
        <AdminNotifyProvider>
          <LeadsProvider>
            <div className="flex min-h-screen bg-[#0a0a0a] text-cream">
              <aside
                className={cn(
                  'hidden shrink-0 flex-col border-r border-gold/15 bg-black transition-[width] duration-300 md:flex',
                  collapsed ? 'w-[4.5rem]' : 'w-60',
                )}
              >
                <div className={cn('px-4 py-8', collapsed && 'px-3')}>
                  {!collapsed ? (
                    <>
                      <p className="font-heading text-2xl tracking-wide text-gold">
                        {brand.shortName}
                      </p>
                      <p className="mt-1 text-[0.62rem] uppercase tracking-[0.28em] text-cream/45">
                        Studio console
                      </p>
                    </>
                  ) : (
                    <p className="text-center font-heading text-xl text-gold">K</p>
                  )}
                </div>

                <nav
                  className="flex flex-1 flex-col gap-0.5 px-2 pb-4"
                  aria-label="Admin navigation"
                >
                  <AdminNavLinks collapsed={collapsed} />
                </nav>

                <div className="mt-auto space-y-3 border-t border-gold/10 px-3 py-5">
                  <button
                    type="button"
                    onClick={() => setCollapsed((c) => !c)}
                    className="w-full text-left text-[0.65rem] uppercase tracking-[0.18em] text-cream/40 transition hover:text-gold"
                  >
                    {collapsed ? '»' : 'Collapse'}
                  </button>
                  {!collapsed && user ? (
                    <p className="truncate text-xs text-cream/50">{user.email}</p>
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
                      'block text-[0.65rem] uppercase tracking-[0.18em] text-cream/40 transition hover:text-gold',
                      collapsed && 'text-center',
                    )}
                  >
                    {collapsed ? '←' : '← Public site'}
                  </a>
                </div>
              </aside>

              <div className="flex min-w-0 flex-1 flex-col">
                <header className="flex items-center justify-between gap-3 border-b border-gold/10 px-4 py-3 md:hidden">
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
                  className="flex gap-1 overflow-x-auto border-b border-gold/10 px-2 py-2 md:hidden"
                  aria-label="Admin mobile"
                >
                  <AdminNavLinks mobile />
                </nav>
                <div className="flex-1 bg-cream text-black">
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
