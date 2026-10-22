import { useMemo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@/components/icons';
import { DataTable, type Column } from '@/components/ui';
import type { Order } from '@/services/orders/orderService';
import { ORDER_STATUS_CONFIG } from './types';
import { cn } from '@/utils/cn';

function formatINR(value: number) {
  return `â¹${value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function formatDate(iso?: string) {
  if (!iso) return 'â';
  try {
    return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  } catch {
    return iso;
  }
}

interface OrdersTableProps {
  items: Order[];
  loading?: boolean;
  selectedKeys: string[];
  onSelectionChange: (keys: string[]) => void;
  onBulkExport: (keys: string[]) => void;
  onPreview: (order: Order) => void;
  emptyState: ReactNode;
}

/**
 * The orders desk, as a `DataTable`.
 *
 * Selection is for the one bulk action an orders list actually needs â handing
 * a filtered set to a spreadsheet â and the table stays virtualised because a
 * studio's order history only grows.
 */
export function OrdersTable({
  items,
  loading = false,
  selectedKeys,
  onSelectionChange,
  onBulkExport,
  onPreview,
  emptyState,
}: OrdersTableProps) {
  const columns = useMemo<Column<Order>[]>(
    () => [
      {
        key: 'order',
        header: 'Order & Garments',
        sortable: true,
        sortValue: (order) => order.orderNumber,
        render: (order) => (
          <div className="min-w-[220px]">
            <div className="flex items-center gap-1.5">
              <span className="rounded border border-line bg-surface-sunken px-1.5 py-0.5 font-mono text-[10px] font-bold">
                #{order.orderNumber}
              </span>
              <button
                type="button"
                onClick={() => onPreview(order)}
                className="block max-w-[180px] truncate rounded-sm text-left text-xs font-semibold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
              >
                {order.title || 'Untitled Order'}
              </button>
            </div>
            <div className="mt-1 flex items-center gap-1 text-[11px] text-ink/65">
              <span>{order.lineItems?.length || 1} garment(s)</span>
              {order.lineItems?.[0]?.name ? (
                <span className="max-w-[150px] truncate">Â· {order.lineItems[0].name}</span>
              ) : null}
            </div>
          </div>
        ),
      },
      {
        key: 'client',
        header: 'Client / Contact',
        sortable: true,
        sortValue: (order) => order.customerId?.name ?? '',
        render: (order) => (
          <div className="max-w-[170px] truncate">
            <span className="block truncate text-xs font-semibold">
              {order.customerId?.name || 'Walk-in Client'}
            </span>
            <span className="mt-0.5 block text-[11px] text-ink/65">
              {order.customerId?.phone || 'â'}
            </span>
          </div>
        ),
      },
      {
        key: 'status',
        header: 'Atelier Stage',
        sortable: true,
        sortValue: (order) => order.status,
        render: (order) => {
          const config = ORDER_STATUS_CONFIG[order.status] ?? {
            label: order.status,
            color: 'bg-zinc-500/15 text-zinc-300 border-zinc-500/30',
            dotColor: 'bg-zinc-400',
          };
          return (
            <span
              className={cn(
                'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                config.color,
              )}
            >
              <span className={cn('size-1.5 rounded-full', config.dotColor)} />
              {config.label}
            </span>
          );
        },
      },
      {
        key: 'payment',
        header: 'Payment Summary',
        hide: 'md',
        sortValue: (order) => order.paymentSummary?.balance ?? 0,
        render: (order) => {
          const quoted = order.paymentSummary?.totalQuoted || 0;
          const paid = order.paymentSummary?.totalPaid || 0;
          const balance = order.paymentSummary?.balance || 0;
          const paidPercent = quoted > 0 ? Math.min(100, Math.round((paid / quoted) * 100)) : 0;
          return (
            <div className="min-w-[150px]">
              <div className="flex items-center justify-between text-[11px] font-medium">
                <span>{formatINR(paid)}</span>
                <span className="font-mono text-[10px] text-ink/65">{paidPercent}%</span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-line">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-300',
                    paidPercent === 100
                      ? 'bg-emerald-500'
                      : paidPercent > 0
                        ? 'bg-amber-500'
                        : 'bg-rose-500',
                  )}
                  style={{ width: `${paidPercent}%` }}
                />
              </div>
              <div className="mt-0.5 flex items-center justify-between text-[10px] text-ink/65">
                <span>Quoted: {formatINR(quoted)}</span>
                {balance > 0 ? (
                  <span className="font-semibold text-amber-500">Due: {formatINR(balance)}</span>
                ) : (
                  <span className="text-emerald-500">Paid</span>
                )}
              </div>
            </div>
          );
        },
      },
      {
        key: 'dates',
        header: 'Target Dates',
        hide: 'lg',
        render: (order) => (
          <div className="whitespace-nowrap text-[11px]">
            <div className="flex items-center gap-1">
              <span className="text-ink/65">Fitting:</span>
              <span className="font-semibold">{formatDate(order.expectedTrialAt)}</span>
            </div>
            <div className="mt-0.5 flex items-center gap-1">
              <span className="text-ink/65">Delivery:</span>
              <span className="font-medium">{formatDate(order.expectedDeliveryAt)}</span>
            </div>
          </div>
        ),
      },
      {
        key: 'priority',
        header: 'Priority',
        sortable: true,
        sortValue: (order) => order.priority,
        render: (order) => (
          <span
            className={cn(
              'inline-flex items-center whitespace-nowrap rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
              order.priority === 'rush'
                ? 'border-rose-500/30 bg-rose-500/15 text-rose-400'
                : order.priority === 'high'
                  ? 'border-amber-500/30 bg-amber-500/15 text-amber-400'
                  : 'border-line text-ink/65',
            )}
          >
            {order.priority || 'normal'}
          </span>
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        className: 'text-right',
        render: (order) => (
          <div className="flex items-center justify-end gap-1">
            <button
              type="button"
              onClick={() => onPreview(order)}
              aria-label={`Preview order ${order.orderNumber}`}
              className="inline-flex size-8 items-center justify-center rounded-lg border border-line transition hover:bg-current/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
              <Icon name="view" size={14} />
            </button>
            <Link
              to={`/admin/orders/${order.id}`}
              aria-label={`Open order ${order.orderNumber}`}
              className="inline-flex size-8 items-center justify-center rounded-lg border border-line transition hover:bg-current/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
              <Icon name="arrowRight" size={14} />
            </Link>
          </div>
        ),
      },
    ],
    [onPreview],
  );

  return (
    <DataTable
      columns={columns}
      data={items}
      rowKey={(order) => order.id}
      loading={loading}
      selectedKeys={selectedKeys}
      onSelectionChange={onSelectionChange}
      selectAllLabel="Select all orders on this page"
      selectRowLabel="Select order"
      bulkActions={[
        {
          label: 'Export CSV',
          icon: 'file',
          onClick: onBulkExport,
        },
      ]}
      emptyState={emptyState}
      maxHeight={620}
      virtualize={{ threshold: 40, rowHeight: 72 }}
      ariaLabel="Production orders"
    />
  );
}
