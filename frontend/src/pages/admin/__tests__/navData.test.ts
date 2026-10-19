import { describe, expect, it } from 'vitest';
import { router } from '@/router';
import type { Permission } from '@/shared/enums';
import { PERMISSIONS } from '@/shared/enums';
import {
  adminNav,
  adminNavGroups,
  isAdminNavItemActive,
  visibleAdminNavGroups,
  type AdminNavViewer,
} from '../data';

interface RouteLike {
  path?: string;
  index?: boolean;
  children?: RouteLike[];
}

/** Full paths, so a nav written by hand can be checked against the real router. */
function collectRoutePaths(routes: RouteLike[], parent = ''): string[] {
  const out: string[] = [];
  for (const route of routes) {
    const path = route.path ? `${parent}/${route.path}`.replace(/\/+/g, '/') : parent;
    out.push(route.index ? parent || '/' : path);
    if (route.children) out.push(...collectRoutePaths(route.children, path));
  }
  return out;
}

/** The nav is hand-written data, so its invariants are worth asserting. */
describe('admin nav map', () => {
  it('points every desk at a route that exists', () => {
    const known = new Set(collectRoutePaths(router.routes as unknown as RouteLike[]));
    const dangling = adminNav.filter((item) => !known.has(item.to)).map((item) => item.to);
    expect(dangling).toEqual([]);
  });

  it('covers every desk once and only once', () => {
    const paths = adminNav.map((item) => item.to);
    expect(new Set(paths).size).toBe(paths.length);
    expect(paths.every((to) => to.startsWith('/admin'))).toBe(true);
    expect(adminNavGroups.every((group) => group.items.length > 0)).toBe(true);
  });

  it('only declares permissions that exist in the shared contract', () => {
    const known = new Set<string>(PERMISSIONS);
    for (const item of adminNav) {
      if (item.permission) expect(known.has(item.permission)).toBe(true);
    }
  });

  it('names an icon for every item', () => {
    expect(adminNav.every((item) => typeof item.icon === 'string' && item.icon.length > 0)).toBe(
      true,
    );
  });

  it('gives an admin the whole map', () => {
    const groups = visibleAdminNavGroups({ role: 'admin' });
    expect(groups.map((group) => group.id)).toEqual(adminNavGroups.map((group) => group.id));
    expect(groups.flatMap((group) => group.items)).toHaveLength(adminNav.length);
  });

  it('gives a staff member only the desks they hold', () => {
    const viewer: AdminNavViewer = { role: 'staff', permissions: ['leads:read'] };
    const groups = visibleAdminNavGroups(viewer);
    expect(groups.map((group) => group.id)).toEqual(['front-desk', 'console']);
    expect(groups[0].items.map((item) => item.label)).toEqual(['Leads']);
    // Profile carries no permission, so it is always somewhere to land.
    expect(groups[1].items.map((item) => item.label)).toEqual(['Profile']);
  });

  it('gives a signed-out viewer only the permissionless desks', () => {
    const groups = visibleAdminNavGroups(null);
    const items = groups.flatMap((group) => group.items);
    expect(items.map((item) => item.label)).toEqual(['Profile']);
  });

  it('treats a permission union as a set, not a list', () => {
    const permissions: Permission[] = ['orders:read', 'measurements:read'];
    const groups = visibleAdminNavGroups({ role: 'staff', permissions });
    expect(groups.map((group) => group.id)).toEqual(['overview', 'atelier', 'console']);
    expect(groups.flatMap((group) => group.items.map((item) => item.label))).toEqual([
      'Dashboard',
      'Orders',
      'Measurements',
      'Profile',
    ]);
  });
});

describe('isAdminNavItemActive', () => {
  const dashboard = adminNav.find((item) => item.to === '/admin')!;
  const orders = adminNav.find((item) => item.to === '/admin/orders')!;

  it('keeps the dashboard off every other desk', () => {
    expect(isAdminNavItemActive(dashboard, '/admin')).toBe(true);
    expect(isAdminNavItemActive(dashboard, '/admin/orders')).toBe(false);
  });

  it('keeps a desk lit on its own detail pages', () => {
    expect(isAdminNavItemActive(orders, '/admin/orders')).toBe(true);
    expect(isAdminNavItemActive(orders, '/admin/orders/abc123')).toBe(true);
  });

  it('does not match a sibling that merely shares a prefix', () => {
    expect(isAdminNavItemActive(orders, '/admin/orders-archive')).toBe(false);
    expect(isAdminNavItemActive(orders, '/admin/invoices')).toBe(false);
  });
});
