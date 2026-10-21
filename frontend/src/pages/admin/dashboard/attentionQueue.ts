import type { GlyphName } from '@/components/icons';
import type { DashboardSummary } from '@/services/dashboard/dashboardService';

export interface AttentionItem {
  /** Stable identity, used as the list key. */
  id: string;
  label: string;
  value: number;
  format: 'count' | 'currency';
  to: string;
  icon: GlyphName;
}

/**
 * What is waiting on a person.
 *
 * A dashboard of totals says how the studio is doing; this says what to do
 * next. Only queues with something in them survive — four zeroes are not a
 * to-do list — and the order is urgency, not size: a fixed priority is the
 * only comparison that makes sense when one queue is counted in orders and
 * another in rupees.
 *
 * `overdueOrders` is a server count rather than a filter over `actionOrders`,
 * because that list is capped at five and sorting a sample would quietly
 * under-report a backlog.
 */
export function buildAttentionQueue(summary: DashboardSummary): AttentionItem[] {
  const { metrics } = summary;

  const queue: AttentionItem[] = [
    {
      id: 'overdue-orders',
      label: 'Orders past their delivery date',
      value: metrics.overdueOrders,
      format: 'count',
      to: '/admin/orders',
      icon: 'warning',
    },
    {
      id: 'fit-approvals',
      label: 'Fits waiting for approval',
      value: metrics.pendingMeasurementApprovals,
      format: 'count',
      to: '/admin/measurements',
      icon: 'measurements',
    },
    {
      id: 'enquiries',
      label: 'Enquiries waiting for a reply',
      value: metrics.enquiriesPending,
      format: 'count',
      to: '/admin/leads',
      icon: 'leads',
    },
    {
      id: 'outstanding',
      label: 'Balance outstanding',
      value: Math.round(metrics.outstandingBalance ?? 0),
      format: 'currency',
      to: '/admin/invoices',
      icon: 'outstanding',
    },
  ];

  return queue.filter((item) => item.value > 0);
}

/** The figure as it reads: money gets a rupee sign and Indian grouping. */
export function formatAttentionValue(item: AttentionItem): string {
  return item.format === 'currency'
    ? `₹${item.value.toLocaleString('en-IN')}`
    : String(item.value);
}
