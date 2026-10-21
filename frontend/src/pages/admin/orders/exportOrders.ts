import type { Order } from '@/services/orders/orderService';

/** One CSV field: quotes doubled, and the field quoted when it needs to be. */
export function csvField(value: unknown): string {
  const text = value == null ? '' : String(value);
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/**
 * The orders a studio would hand to a spreadsheet.
 *
 * Deliberately flat: one row per order, with the money already summed, because
 * the point of an export is to be filtered and pivoted somewhere else — not to
 * reproduce the console's nested DTO.
 */
export function ordersToCsv(orders: Order[]): string {
  const header = [
    'Order Number',
    'Title',
    'Customer',
    'Phone',
    'Status',
    'Priority',
    'Garments',
    'Quoted',
    'Paid',
    'Balance',
    'Trial Date',
    'Delivery Date',
    'Created',
  ];

  const rows = orders.map((order) => [
    order.orderNumber,
    order.title,
    order.customerId?.name ?? '',
    order.customerId?.phone ?? '',
    order.status,
    order.priority,
    order.lineItems?.length ?? 0,
    order.paymentSummary?.totalQuoted ?? 0,
    order.paymentSummary?.totalPaid ?? 0,
    order.paymentSummary?.balance ?? 0,
    order.expectedTrialAt ?? '',
    order.expectedDeliveryAt ?? '',
    order.createdAt ?? '',
  ]);

  return [header, ...rows].map((row) => row.map(csvField).join(',')).join('\r\n');
}

/** Hand the CSV to the browser as a download. No server round trip. */
export function downloadOrdersCsv(orders: Order[], filename = 'orders.csv') {
  const blob = new Blob([ordersToCsv(orders)], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
