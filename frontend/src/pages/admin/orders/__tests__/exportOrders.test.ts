import { describe, expect, it } from 'vitest';
import { csvField, ordersToCsv } from '@/pages/admin/orders/exportOrders';
import type { Order } from '@/services/orders/orderService';

function order(overrides: Partial<Order> = {}): Order {
  return {
    id: 'o1',
    orderNumber: 12,
    customerId: { id: 'c1', name: 'Sravani, Reddy', phone: '9876543210' },
    status: 'stitching',
    priority: 'rush',
    title: 'Bridal "Lehenga"',
    lineItems: [{ name: 'Lehenga', qty: 1 }],
    measurementProfileIds: [],
    assignedStaff: [],
    tags: [],
    notes: [],
    timeline: [],
    paymentSummary: { totalQuoted: 50000, advance: 10000, totalPaid: 10000, balance: 40000 },
    attachments: [],
    createdAt: '2026-10-01T00:00:00.000Z',
    updatedAt: '2026-10-02T00:00:00.000Z',
    ...overrides,
  };
}

describe('csvField', () => {
  it('quotes fields containing commas, quotes or newlines', () => {
    expect(csvField('Sravani, Reddy')).toBe('"Sravani, Reddy"');
    expect(csvField('Bridal "Lehenga"')).toBe('"Bridal ""Lehenga"""');
    expect(csvField('line one\nline two')).toBe('"line one\nline two"');
  });

  it('leaves plain fields alone and renders missing values empty', () => {
    expect(csvField('silk')).toBe('silk');
    expect(csvField(0)).toBe('0');
    expect(csvField(null)).toBe('');
    expect(csvField(undefined)).toBe('');
  });
});

describe('ordersToCsv', () => {
  it('writes a header and one row per order', () => {
    const csv = ordersToCsv([order(), order({ id: 'o2', orderNumber: 13 })]);
    const lines = csv.split('\r\n');

    expect(lines).toHaveLength(3);
    expect(lines[0]).toContain('Order Number,Title,Customer');
    expect(lines[1]).toContain('12');
    expect(lines[2]).toContain('13');
  });

  it('escapes customer names and titles without breaking rows', () => {
    const csv = ordersToCsv([order()]);

    expect(csv).toContain('"Sravani, Reddy"');
    expect(csv).toContain('"Bridal ""Lehenga"""');
  });
});
