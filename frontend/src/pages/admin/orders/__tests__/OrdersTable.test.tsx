import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { OrdersTable } from '@/pages/admin/orders/OrdersTable';
import type { Order } from '@/services/orders/orderService';

const order: Order = {
  id: 'o1',
  orderNumber: 42,
  customerId: { id: 'c1', name: 'Sravani Reddy', phone: '9876543210' },
  status: 'stitching',
  priority: 'rush',
  title: 'Bridal Lehenga',
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
};

afterEach(cleanup);

function renderTable(selectedKeys: string[] = []) {
  const onExport = vi.fn();
  render(
    <MemoryRouter>
      <OrdersTable
        items={[order]}
        selectedKeys={selectedKeys}
        onSelectionChange={() => {}}
        onBulkExport={onExport}
        onPreview={() => {}}
        emptyState={<p>No orders</p>}
      />
    </MemoryRouter>,
  );
  return onExport;
}

describe('OrdersTable', () => {
  it('renders the order, its stage and its payment position', () => {
    renderTable();

    expect(screen.getByRole('button', { name: /bridal lehenga/i })).toBeTruthy();
    expect(screen.getByText('Sravani Reddy')).toBeTruthy();
    expect(screen.getByText('Tailoring / Stitching')).toBeTruthy();
    expect(screen.getByText(/Due:/)).toBeTruthy();
  });

  it('exports exactly the selected rows', () => {
    const onExport = renderTable(['o1']);

    fireEvent.click(screen.getByRole('button', { name: /export csv/i }));

    expect(onExport).toHaveBeenCalledWith(['o1']);
  });
});
