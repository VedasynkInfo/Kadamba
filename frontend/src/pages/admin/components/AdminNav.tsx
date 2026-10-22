import { useMemo, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Icon } from '@/components/icons';
import { Tooltip } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { useAdminNotify } from '@/hooks/useAdminNotifySocket';
import { cn } from '@/utils/cn';
import { isAdminNavItemActive, visibleAdminNavGroups, type AdminNavItem } from '../data';

const CLOSED_GROUPS_KEY = 'kadamba_admin_nav_closed_groups';

function readClosedGroups(): string[] {
  try {
    const raw = localStorage.getItem(CLOSED_GROUPS_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : [];
  } catch {
    // A corrupt value is not worth breaking the console over; forget it.
    return [];
  }
}

function NavBadge({ count }: { count: number }) {
  if (!count) return null;
  return (
    <span className="relative ml-1.5 inline-flex min-w-[1.15rem] items-center justify-center rounded-sm bg-brand/15 px-1 py-0.5 text-[0.6rem] font-semibold text-brand-strong">
      {count > 99 ? '99+' : count}
    </span>
  );
}

export interface AdminNavProps {
  /** Icon-only rail: labels move into tooltips and groups become rules. */
  collapsed?: boolean;
  /** Called after a link is followed, so the mobile drawer can close itself. */
  onNavigate?: () => void;
  /**
   * Two nav lists can be mounted at once (rail + drawer), and a shared-layout
   * animation is keyed by id — so each list names its own.
   */
  scope: 'rail' | 'drawer';
}

/**
 * The console's navigation.
 *
 * Groups are collapsible and the open one is derived, not stored: a group that
 * contains the page you are on is always open, whatever the stored state says.
 * Hiding the current page inside a collapsed group is the one way a nav can lie
 * to you.
 */
export function AdminNav({ collapsed = false, onNavigate, scope }: AdminNavProps) {
  const { badges } = useAdminNotify();
  const { user } = useAuth();
  const { pathname } = useLocation();
  const reducedMotion = useReducedMotion();
  const [closedGroups, setClosedGroups] = useState<string[]>(readClosedGroups);

  /** Admins see everything; staff only see what they can actually open. */
  const groups = useMemo(() => visibleAdminNavGroups(user), [user]);

  const activeGroupId = groups.find((group) =>
    group.items.some((item) => isAdminNavItemActive(item, pathname)),
  )?.id;

  function toggleGroup(id: string) {
    setClosedGroups((previous) => {
      const next = previous.includes(id) ? previous.filter((x) => x !== id) : [...previous, id];
      localStorage.setItem(CLOSED_GROUPS_KEY, JSON.stringify(next));
      return next;
    });
  }

  function badgeFor(to: string) {
    if (to.startsWith('/admin/leads')) return badges.leads;
    if (to.startsWith('/admin/measurements')) return badges.measurements;
    return 0;
  }

  function renderItem(item: AdminNavItem) {
    const link = (
      <NavLink
        to={item.to}
        end={item.end}
        onClick={onNavigate}
        className={({ isActive }) =>
          cn(
            'group relative flex items-center rounded-md text-sm transition-colors',
            collapsed ? 'justify-center px-2 py-2' : 'gap-2.5 px-3 py-2',
            isActive
              ? 'font-semibold text-brand-strong'
              : 'text-ink/70 hover:bg-ink/[0.05] hover:text-ink',
          )
        }
      >
        {({ isActive }) => (
          <>
            {isActive ? (
              <motion.span
                aria-hidden
                layoutId={reducedMotion ? undefined : `admin-nav-active-${scope}`}
                transition={
                  reducedMotion ? { duration: 0 } : { type: 'spring', stiffness: 520, damping: 40 }
                }
                className="absolute inset-0 rounded-md bg-brand/10 ring-1 ring-inset ring-brand/25"
              />
            ) : null}
            <Icon name={item.icon} size={collapsed ? 18 : 16} className="relative shrink-0" />
            {collapsed ? null : (
              <span className="relative flex-1 truncate">{item.label}</span>
            )}
            {collapsed ? null : <NavBadge count={badgeFor(item.to)} />}
          </>
        )}
      </NavLink>
    );

    if (!collapsed) return link;
    return (
      <Tooltip key={item.to} label={item.label} side="right">
        {link}
      </Tooltip>
    );
  }

  return (
    <nav
      className={cn('flex flex-1 flex-col overflow-y-auto px-2 pb-4', collapsed ? 'gap-0.5' : 'gap-3')}
      aria-label={scope === 'drawer' ? 'Admin navigation (drawer)' : 'Admin navigation'}
    >
      {groups.map((group, index) => {
        if (collapsed) {
          return (
            <div key={group.id} className="flex flex-col gap-0.5">
              {index > 0 ? (
                <div className="mx-2 my-1.5 border-t border-line" aria-hidden />
              ) : null}
              {group.items.map((item) => renderItem(item))}
            </div>
          );
        }

        const open = !closedGroups.includes(group.id) || group.id === activeGroupId;
        return (
          <div key={group.id}>
            <button
              type="button"
              onClick={() => toggleGroup(group.id)}
              aria-expanded={open}
              aria-controls={`admin-nav-group-${group.id}`}
              className="flex w-full items-center justify-between rounded-md px-3 py-1 text-[0.62rem] uppercase tracking-[0.2em] text-ink/70 transition-colors hover:text-ink/80"
            >
              <span>{group.label}</span>
              <Icon name={open ? 'chevronDown' : 'chevronRight'} size={12} />
            </button>
            <motion.div
              id={`admin-nav-group-${group.id}`}
              initial={false}
              animate={{ height: open ? 'auto' : 0, opacity: open ? 1 : 0 }}
              transition={
                reducedMotion ? { duration: 0 } : { duration: 0.2, ease: [0.22, 1, 0.36, 1] }
              }
              // Closed groups keep their links in the DOM for the measurement the
              // animation needs; `inert` is what takes them out of the tab order.
              inert={!open}
              className="overflow-hidden"
            >
              <div className="flex flex-col gap-0.5 pt-0.5">
                {group.items.map((item) => renderItem(item))}
              </div>
            </motion.div>
          </div>
        );
      })}
    </nav>
  );
}
