import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { queryClient } from '@/lib/queryClient';
import { qk } from '@/lib/queryKeys';
import { flushRealtimeInvalidation, invalidateForRealtime } from '@/lib/realtimeInvalidation';

/** Seed a query under a key the app really uses, so invalidation has something to mark. */
function seed(queryKey: readonly unknown[]) {
  queryClient.setQueryData(queryKey, { seeded: true });
}

/**
 * A socket event must reach exactly the cache families it claims to. These tests
 * seed queries and then assert which ones the event marked invalid — and
 * invalidation is precisely what makes a mounted page refetch.
 */
describe('realtime invalidation', () => {
  beforeEach(() => {
    queryClient.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    flushRealtimeInvalidation();
  });

  it('marks the order families stale when an order event arrives', () => {
    seed(qk.orders.list({}));
    seed(qk.orders.detail('o1'));
    seed(qk.customers.list({}));
    seed(qk.leads.list({}));

    invalidateForRealtime('notify:order');
    flushRealtimeInvalidation();

    expect(queryClient.getQueryState(qk.orders.list({}))?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(qk.orders.detail('o1'))?.isInvalidated).toBe(true);
    // An order move touches the customer's record too.
    expect(queryClient.getQueryState(qk.customers.list({}))?.isInvalidated).toBe(true);
    // …but not the leads desk, which an order event says nothing about.
    expect(queryClient.getQueryState(qk.leads.list({}))?.isInvalidated).toBe(false);
  });

  it('treats a payment as money: it reaches the books, the order and the portal', () => {
    seed(qk.finance.payments({}));
    seed(qk.orders.list({}));
    seed(qk.portal.payments({}));

    invalidateForRealtime('notify:payment');
    flushRealtimeInvalidation();

    expect(queryClient.getQueryState(qk.finance.payments({}))?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(qk.orders.list({}))?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(qk.portal.payments({}))?.isInvalidated).toBe(true);
  });

  it('keeps a badge hint to the badges, and the CMS out of it entirely', () => {
    seed(qk.dashboard.badges());
    seed(qk.cms.gallery());

    invalidateForRealtime('notify:badge');
    flushRealtimeInvalidation();

    expect(queryClient.getQueryState(qk.dashboard.badges())?.isInvalidated).toBe(true);
    expect(queryClient.getQueryState(qk.cms.gallery())?.isInvalidated).toBe(false);
  });

  it('coalesces a burst into one invalidation pass per family', () => {
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    // One write: an order move, its money and a badge refresh.
    invalidateForRealtime('notify:order');
    invalidateForRealtime('notify:payment');
    invalidateForRealtime('notify:badge');
    flushRealtimeInvalidation();

    // The shared families are invalidated once, not three times over.
    const keys = invalidate.mock.calls.map((call) => {
      const filters = call[0] as { queryKey?: readonly unknown[] } | undefined;
      return JSON.stringify(filters?.queryKey ?? null);
    });
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys).toContain(JSON.stringify(qk.orders.all));
    expect(keys).toContain(JSON.stringify(qk.dashboard.all));
  });

  it('schedules the flush rather than invalidating on every event', () => {
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    invalidateForRealtime('notify:lead');
    expect(invalidate).not.toHaveBeenCalled();

    flushRealtimeInvalidation();
    expect(invalidate).toHaveBeenCalledWith({ queryKey: qk.leads.all });
  });
});
