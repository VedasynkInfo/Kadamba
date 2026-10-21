import { describe, expect, it } from 'vitest';
import type { DashboardSummary } from '@/services/dashboard/dashboardService';
import {
  buildAttentionQueue,
  formatAttentionValue,
} from '@/pages/admin/dashboard/attentionQueue';

function summary(metrics: Partial<DashboardSummary['metrics']> = {}): DashboardSummary {
  return {
    range: { from: '2026-01-01', to: '2026-12-31' },
    metrics: {
      leadsOpen: 0,
      enquiriesPending: 0,
      ordersActive: 0,
      deliverablesDue: 0,
      revenueMtd: 0,
      outstandingBalance: 0,
      pendingMeasurementApprovals: 0,
      overdueOrders: 0,
      ...metrics,
    },
    series: {
      leadsByMonth: [],
      revenueByMonth: [],
      ordersByStatus: [],
      leadsBySource: [],
      visitors: null,
    },
    recentLeads: [],
    actionOrders: [],
  };
}

describe('buildAttentionQueue', () => {
  it('is empty when nothing is waiting', () => {
    expect(buildAttentionQueue(summary())).toEqual([]);
  });

  it('drops the queues that are already clear', () => {
    const queue = buildAttentionQueue(summary({ enquiriesPending: 4, overdueOrders: 0 }));

    expect(queue.map((item) => item.id)).toEqual(['enquiries']);
  });

  it('orders by urgency, not by magnitude', () => {
    const queue = buildAttentionQueue(
      summary({
        overdueOrders: 2,
        pendingMeasurementApprovals: 3,
        enquiriesPending: 900,
        outstandingBalance: 100000,
      }),
    );

    expect(queue.map((item) => item.id)).toEqual([
      'overdue-orders',
      'fit-approvals',
      'enquiries',
      'outstanding',
    ]);
  });

  it('counts overdue orders from the server total, not from the sampled action list', () => {
    const data = summary({ overdueOrders: 12 });
    data.actionOrders = [];

    expect(buildAttentionQueue(data)[0]).toMatchObject({ id: 'overdue-orders', value: 12 });
  });

  it('rounds money, because a balance is read, not reconciled', () => {
    const queue = buildAttentionQueue(summary({ outstandingBalance: 12345.6 }));
    expect(queue[0]).toMatchObject({ id: 'outstanding', value: 12346, format: 'currency' });
  });
});

describe('formatAttentionValue', () => {
  it('prints counts plainly', () => {
    expect(
      formatAttentionValue({ id: 'x', label: 'x', value: 7, format: 'count', to: '/', icon: 'leads' }),
    ).toBe('7');
  });

  it('prints money in Indian grouping with a rupee sign', () => {
    expect(
      formatAttentionValue({
        id: 'x',
        label: 'x',
        value: 123456,
        format: 'currency',
        to: '/',
        icon: 'outstanding',
      }),
    ).toBe('₹1,23,456');
  });
});
