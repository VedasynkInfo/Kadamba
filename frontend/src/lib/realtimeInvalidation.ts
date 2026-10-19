import { queryClient } from './queryClient';
import { qk } from './queryKeys';

/**
 * What the realtime channel is allowed to do to the cache: make things stale.
 *
 * A socket event is a *hint* that something changed, never the data itself. The
 * previous design treated it as a command — every list page subscribed to a
 * "soft refresh" signal and re-ran its own hand-rolled fetch, so one order edit
 * could fire a dozen uncoordinated requests, and a page that forgot to subscribe
 * silently stopped updating. Inverting that (an event invalidates, and whoever is
 * looking refetches once, through the same query layer as everything else) means
 * correctness no longer depends on each surface remembering to listen.
 *
 * Invalidation is deliberately coarse — a whole family at a time. A write
 * touches more than the row it names: confirming an order moves its lead, the
 * customer's history, the badge counts and the dashboard. Enumerating those
 * precisely would be a second, quietly-wrong copy of the server's rules.
 */
export const REALTIME_EVENTS = [
  'notify:lead',
  'notify:order',
  'notify:measurement',
  'notify:payment',
  'notify:badge',
  'portal:chat',
] as const;

export type RealtimeEvent = (typeof REALTIME_EVENTS)[number];

const SOCKET_INVALIDATION: Record<RealtimeEvent, readonly (readonly unknown[])[]> = {
  // A new enquiry lands in the leads desk and the admin badge counts.
  'notify:lead': [qk.leads.all, qk.dashboard.all],
  // An order move is visible on the order itself, in the lists, on the
  // customer's record and on the customer's own portal.
  'notify:order': [qk.orders.all, qk.customers.all, qk.dashboard.all, qk.portal.all],
  'notify:measurement': [qk.measurements.all, qk.customers.all, qk.dashboard.all, qk.portal.all],
  // A payment is money: it moves the order balance, the invoice and the books.
  'notify:payment': [
    qk.finance.all,
    qk.orders.all,
    qk.customers.all,
    qk.dashboard.all,
    qk.portal.all,
  ],
  'notify:badge': [qk.dashboard.all],
  'portal:chat': [qk.portal.all, qk.dashboard.all],
};

/**
 * How long to gather events before refetching.
 *
 * One write usually produces several events in the same tick (an order move also
 * pokes a lead, a badge and the customer's view). TanStack Query already
 * collapses requests it is already making, but a burst that arrives across a few
 * frames would otherwise refetch the same family more than once. A short window
 * turns the burst into a single pass.
 */
const COALESCE_MS = 200;

const pendingKeys = new Set<readonly unknown[]>();
let timer: ReturnType<typeof setTimeout> | null = null;

function flush() {
  timer = null;
  const keys = [...pendingKeys];
  pendingKeys.clear();
  for (const queryKey of keys) {
    void queryClient.invalidateQueries({ queryKey });
  }
}

/**
 * Record a realtime event: every affected family is marked stale, and whoever is
 * currently rendering it refetches once.
 */
export function invalidateForRealtime(event: RealtimeEvent): void {
  for (const queryKey of SOCKET_INVALIDATION[event]) {
    pendingKeys.add(queryKey);
  }
  if (timer) return;
  timer = setTimeout(flush, COALESCE_MS);
}

/** Flush immediately instead of waiting out the coalescing window (tests, teardown). */
export function flushRealtimeInvalidation(): void {
  if (timer) clearTimeout(timer);
  flush();
}
