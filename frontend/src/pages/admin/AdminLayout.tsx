import { Outlet, useNavigate } from 'react-router-dom';
import { Suspense, useEffect, useState } from 'react';
import { Button, Drawer, Tooltip } from '@/components/ui';
import { Icon } from '@/components/icons';
import { RouteFallback } from '@/components/layout/RouterShell';
import { useAuth } from '@/hooks/useAuth';
import { AdminNotifyProvider } from '@/hooks/useAdminNotifySocket';
import { brand } from '@/pages/home/data';
import { LeadsProvider } from '@/pages/leads/LeadsContext';
import { useTheme } from '@/context/ThemeContext';
import { PageMeta, staticPageMeta } from '@/seo';
import { cn } from '@/utils/cn';
import { AdminContentProvider } from './AdminContentContext';
import { OptimizedImage } from '@/components/media/OptimizedImage';
import { AdminNav } from './components/AdminNav';
import { CommandPalette } from './components/CommandPalette';
import { RequireAdmin } from './RequireAdmin';

/**
 * Phase 12 admin shell — collapsible atelier console with live notify badges.
 *
 * The chrome below the rail is deliberately bare: desks own their own header
 * (`AdminHorizonBanner`) so that adding a desk never means touching the shell.
 */
export function AdminLayout() {
  const { user, logout } = useAuth();
  const { logoDarkUrl, logoUrl } = useTheme();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('kadamba_admin_sidebar_collapsed') === 'true';
  });
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  // ⌘K / Ctrl+K opens the palette from anywhere in the console.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setPaletteOpen((open) => !open);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const activeLogo = logoDarkUrl || logoUrl;

  const toggleCollapse = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('kadamba_admin_sidebar_collapsed', String(next));
      return next;
    });
  };

  const signOut = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <RequireAdmin>
      <PageMeta {...staticPageMeta.admin} />
      <AdminContentProvider>
        <AdminNotifyProvider>
          <LeadsProvider>
            {/* `.admin-shell` here re-points every semantic token at the
                console's palette (index.css) for the whole chrome — sidebar,
                header and page alike. The colours come from those tokens, never
                from inline styles. */}
            <div className="admin-shell flex min-h-screen font-admin bg-surface text-ink">
              {/* The rail is 4rem of navigation before the keyboard ever reaches
                  a desk; this is the first tab stop in the console. */}
              <a
                href="#admin-main"
                className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-surface-raised focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-ink-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
              >
                Skip to content
              </a>

              <aside
                className={cn(
                  'hidden shrink-0 flex-col border-r border-line transition-[width] duration-300 md:flex',
                  collapsed ? 'w-[4.25rem]' : 'w-60',
                  'bg-sidebar text-sidebar-ink',
                )}
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
                        <p className="font-heading text-xl font-bold tracking-wide text-brand-strong">
                          {brand.shortName}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-center font-heading text-xl font-extrabold text-brand-strong">
                      K
                    </p>
                  )}
                  {!collapsed && (
                    <p className="mt-1 text-[0.62rem] uppercase tracking-[0.25em] text-ink/70">
                      Studio Console
                    </p>
                  )}
                </div>

                {collapsed ? (
                  <Tooltip label="Search the console" side="right">
                    <button
                      type="button"
                      onClick={() => setPaletteOpen(true)}
                      aria-label="Search the console"
                      className="mx-2 mb-3 flex items-center justify-center rounded-lg border border-line bg-surface-sunken p-2 text-ink/70 transition hover:border-brand/40 hover:text-ink"
                    >
                      <Icon name="search" size={16} />
                    </button>
                  </Tooltip>
                ) : (
                  <button
                    type="button"
                    onClick={() => setPaletteOpen(true)}
                    className="mx-2 mb-3 flex items-center gap-2 rounded-lg border border-line bg-surface-sunken px-2.5 py-1.5 text-left text-xs text-ink/70 transition hover:border-brand/40 hover:text-ink"
                  >
                    <Icon name="search" size={14} />
                    <span className="flex-1">Search…</span>
                    <kbd className="rounded border border-line px-1 py-0.5 text-[0.6rem] tracking-wider">
                      ⌘K
                    </kbd>
                  </button>
                )}

                <AdminNav collapsed={collapsed} scope="rail" />

                <div className="mt-auto space-y-3 border-t border-line px-3 py-5">
                  <button
                    type="button"
                    onClick={toggleCollapse}
                    aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[0.65rem] uppercase tracking-[0.18em] text-ink/70 transition-colors hover:bg-ink/[0.05] hover:text-ink',
                      collapsed && 'justify-center',
                    )}
                  >
                    <Icon name={collapsed ? 'chevronRight' : 'chevronLeft'} size={14} />
                    {collapsed ? null : <span>Collapse</span>}
                  </button>

                  {!collapsed && user ? (
                    <p className="truncate px-2 text-xs text-ink/70">{user.email}</p>
                  ) : null}

                  {collapsed ? (
                    <Tooltip label="Sign out" side="right">
                      <Button
                        variant="secondary"
                        size="sm"
                        aria-label="Sign out"
                        className="w-full px-1"
                        onClick={signOut}
                      >
                        <Icon name="logout" size={16} />
                      </Button>
                    </Tooltip>
                  ) : (
                    <Button variant="secondary" size="sm" className="w-full" onClick={signOut}>
                      <Icon name="logout" size={14} />
                      <span>Sign out</span>
                    </Button>
                  )}

                  {collapsed ? (
                    <Tooltip label="Public site" side="right">
                      <a
                        href="/"
                        aria-label="Public site"
                        className="flex items-center justify-center rounded-md px-2 py-1.5 text-ink/70 transition-colors hover:bg-ink/[0.05] hover:text-ink"
                      >
                        <Icon name="arrowLeft" size={16} />
                      </a>
                    </Tooltip>
                  ) : (
                    <a
                      href="/"
                      className="flex items-center gap-2 px-2 text-[0.65rem] uppercase tracking-[0.18em] text-ink/70 transition-colors hover:text-ink"
                    >
                      <Icon name="arrowLeft" size={14} />
                      <span>Public site</span>
                    </a>
                  )}
                </div>
              </aside>

              <div className="flex min-w-0 flex-1 flex-col">
                <header className="flex items-center justify-between gap-3 border-b border-line bg-surface-raised px-4 py-3 text-ink md:hidden">
                  <button
                    type="button"
                    onClick={() => setMobileNavOpen(true)}
                    aria-label="Open navigation"
                    className="flex items-center rounded-md p-1.5 transition-colors hover:bg-ink/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                  >
                    <Icon name="menu" size={20} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaletteOpen(true)}
                    aria-label="Search the console"
                    className="flex items-center rounded-md p-1.5 transition-colors hover:bg-ink/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                  >
                    <Icon name="search" size={18} />
                  </button>
                  <p className="font-heading text-lg text-brand-strong">{brand.shortName}</p>
                  <Button variant="secondary" size="sm" onClick={signOut}>
                    <Icon name="logout" size={14} />
                    <span>Sign out</span>
                  </Button>
                </header>

                {/* A drawer, not a scroll strip. Twenty links in a horizontal
                    strip is a nav you have to swat at. */}
                <Drawer
                  open={mobileNavOpen}
                  onClose={() => setMobileNavOpen(false)}
                  title={brand.shortName}
                  side="left"
                  className="bg-sidebar text-sidebar-ink"
                >
                  <AdminNav scope="drawer" onNavigate={() => setMobileNavOpen(false)} />
                </Drawer>

                <main
                  id="admin-main"
                  tabIndex={-1}
                  className="min-h-screen flex-1 outline-none transition-colors"
                >
                  <Suspense fallback={<RouteFallback />}>
                    <Outlet />
                  </Suspense>
                </main>
              </div>
            </div>

            <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
          </LeadsProvider>
        </AdminNotifyProvider>
      </AdminContentProvider>
    </RequireAdmin>
  );
}
