import { describe, expect, it } from 'vitest';
import { qk } from '@/lib/queryKeys';

const startsWith = (key: readonly unknown[], prefix: readonly unknown[]) =>
  prefix.every((part, index) => key[index] === part);

describe('query key hierarchy', () => {
  it('roots every list/detail key under its domain, so one invalidate clears the domain', () => {
    const cases: Array<[readonly unknown[], readonly unknown[]]> = [
      [qk.leads.list({ page: 2 }), qk.leads.all],
      [qk.leads.detail('lead-1'), qk.leads.all],
      [qk.customers.list({}), qk.customers.all],
      [qk.customers.detail('c-1'), qk.customers.all],
      [qk.orders.list({}), qk.orders.all],
      [qk.orders.detail('o-1'), qk.orders.all],
      [qk.finance.invoices({}), qk.finance.all],
      [qk.finance.invoice('inv-1'), qk.finance.all],
      [qk.dashboard.badges(), qk.dashboard.all],
      [qk.media.library({}), qk.media.all],
      [qk.portal.orders({}), qk.portal.all],
      [qk.portal.invoice('inv-1'), qk.portal.all],
      [qk.staff.list({}), qk.staff.all],
      [qk.users.list({}), qk.users.all],
      [qk.audit.list({}), qk.audit.all],
    ];

    for (const [key, prefix] of cases) {
      expect(startsWith(key, prefix), `${JSON.stringify(key)} should start with ${JSON.stringify(prefix)}`).toBe(
        true,
      );
    }
  });
});

describe('published vs. draft content', () => {
  it('never shares a cache entry between the public site and the admin console', () => {
    // The public list asks for published items only; the admin list asks for
    // everything. If these ever collided, an unpublished draft could be served
    // to a visitor.
    expect(qk.publicContent.gallery({ published: true })).not.toEqual(qk.cms.gallery());
    expect(qk.publicContent.services({ published: true })).not.toEqual(qk.cms.services());
    expect(qk.publicContent.settings()).not.toEqual(qk.cms.settings());
  });

  it('keeps the public and CMS domains separately invalidatable', () => {
    expect(qk.publicContent.all).not.toEqual(qk.cms.all);
    expect(startsWith(qk.publicContent.blogs({}), qk.publicContent.all)).toBe(true);
    expect(startsWith(qk.cms.blogs(), qk.cms.all)).toBe(true);
  });
});

describe('filter-aware keys', () => {
  it('shares one entry for equivalent filters, whatever the object identity', () => {
    expect(qk.orders.list({ page: 1, status: 'New' })).toEqual(qk.orders.list({ page: 1, status: 'New' }));
  });

  it('separates different filters', () => {
    expect(qk.orders.list({ page: 1 })).not.toEqual(qk.orders.list({ page: 2 }));
  });

  it('treats an omitted filter set as the empty set', () => {
    expect(qk.leads.list()).toEqual(qk.leads.list({}));
  });
});
