import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { Order } from '@/services/orders/orderService';
import { canTransitionOrder, type OrderStatus } from '@/shared/enums';
import { ORDER_STATUS_CONFIG } from './types';
import { whatsappDeepLink } from '@/utils/whatsapp';
import { EmptyState } from '../components/EmptyState';
import { Skeleton } from '../components/Skeleton';
import { cn } from '@/utils/cn';

const SKELETON_ROWS = 6;

function formatINR(v: number) {
  return `₹${v.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function formatDate(iso?: string) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
    });
  } catch {
    return iso;
  }
}

interface OrdersTableProps {
  items: Order[];
  loading?: boolean;
  hasActiveFilters: boolean;
  onResetFilters: () => void;
  onNewOrder: () => void;
  onPreview: (order: Order) => void;
  onStatusChange: (orderId: string, status: OrderStatus) => void;
}

export function OrdersTable({
  items,
  loading = false,
  hasActiveFilters,
  onResetFilters,
  onNewOrder,
  onPreview,
  onStatusChange,
}: OrdersTableProps) {
  const [menuAnchor, setMenuAnchor] = useState<{
    order: Order;
    top: number;
    right: number;
    showAbove: boolean;
  } | null>(null);

  useEffect(() => {
    if (!menuAnchor) return;
    const handleClose = () => setMenuAnchor(null);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuAnchor(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleClose, true);
    window.addEventListener('resize', handleClose);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleClose, true);
      window.removeEventListener('resize', handleClose);
    };
  }, [menuAnchor]);

  function handleOpenMenu(e: React.MouseEvent<HTMLButtonElement>, order: Order) {
    e.stopPropagation();
    if (menuAnchor?.order.id === order.id) {
      setMenuAnchor(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const menuHeight = 220;
    const spaceBelow = window.innerHeight - rect.bottom;
    const showAbove = spaceBelow < menuHeight && rect.top > menuHeight;

    setMenuAnchor({
      order,
      top: showAbove ? rect.top - 6 : rect.bottom + 6,
      right: window.innerWidth - rect.right,
      showAbove,
    });
  }

  return (
    <div
      className="rounded-xl border shadow-xs overflow-visible transition-colors"
      style={{
        backgroundColor: 'var(--admin-card, #141b26)',
        borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.18))',
        color: 'var(--admin-card-text, var(--admin-text, #f3f4f6))',
      }}
    >
      {loading ? (
        <div className="p-6 space-y-3">
          {Array.from({ length: SKELETON_ROWS }).map((_, i) => (
            <Skeleton key={i} variant="table" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="p-8">
          <EmptyState
            title="No orders found"
            description={
              hasActiveFilters
                ? 'No studio commissions match the active search or filters.'
                : 'Create bridal couture orders, record measurements, and track production workflows.'
            }
            actionLabel={hasActiveFilters ? 'Clear Filters' : '+ New Order'}
            onAction={hasActiveFilters ? onResetFilters : onNewOrder}
          />
        </div>
      ) : (
        <div className="overflow-x-auto overflow-y-hidden">
          <table className="w-full min-w-[950px] text-left border-collapse text-xs table-fixed">
            <thead>
              <tr
                className="border-b text-[0.65rem] uppercase tracking-wider font-semibold opacity-75"
                style={{
                  borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.18))',
                  backgroundColor: 'rgba(128, 128, 128, 0.05)',
                }}
              >
                <th className="py-3 px-4 min-w-[220px]">Order & Garments</th>
                <th className="py-3 px-4 w-[170px]">Client / Contact</th>
                <th className="py-3 px-4 w-[150px]">Atelier Stage</th>
                <th className="py-3 px-4 w-[170px]">Payment Summary</th>
                <th className="py-3 px-4 w-[140px]">Target Dates</th>
                <th className="py-3 px-4 w-[90px]">Priority</th>
                <th className="py-3 px-4 w-[70px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody
              className="divide-y"
              style={{ borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.12))' }}
            >
              {items.map((order) => {
                const isMenuOpen = menuAnchor?.order.id === order.id;
                const stConfig = ORDER_STATUS_CONFIG[order.status] || {
                  label: order.status,
                  color: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
                  dotColor: 'bg-zinc-400',
                };
                const totalQ = order.paymentSummary?.totalQuoted || 0;
                const paid = order.paymentSummary?.totalPaid || 0;
                const balance = order.paymentSummary?.balance || 0;
                const paidPercent = totalQ > 0 ? Math.min(100, Math.round((paid / totalQ) * 100)) : 0;

                return (
                  <tr
                    key={order.id}
                    className="transition hover:bg-current/[0.03] group"
                    style={{ borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.12))' }}
                  >
                    {/* Order Number & Title */}
                    <td className="py-3 px-4">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span
                            className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded border"
                            style={{
                              borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.2))',
                              backgroundColor: 'rgba(128, 128, 128, 0.08)',
                            }}
                          >
                            #{order.orderNumber}
                          </span>
                          <button
                            type="button"
                            onClick={() => onPreview(order)}
                            className="font-semibold text-inherit text-left hover:underline text-xs truncate max-w-[170px] block cursor-pointer"
                          >
                            {order.title || 'Untitled Order'}
                          </button>
                        </div>
                        <div className="flex items-center gap-1 mt-1 text-[11px] opacity-60">
                          <span>{order.lineItems?.length || 1} garment(s)</span>
                          {order.lineItems?.[0]?.name ? (
                            <span className="truncate max-w-[150px]">· {order.lineItems[0].name}</span>
                          ) : null}
                        </div>
                      </div>
                    </td>

                    {/* Client Name & Phone */}
                    <td className="py-3 px-4">
                      <div className="truncate max-w-[160px]">
                        <span className="font-semibold block truncate">
                          {order.customerId?.name || 'Walk-in Client'}
                        </span>
                        <span className="text-[11px] opacity-60 block mt-0.5">
                          {order.customerId?.phone || '—'}
                        </span>
                      </div>
                    </td>

                    {/* Pipeline Stage */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold border uppercase tracking-wider',
                          stConfig.color,
                        )}
                      >
                        <span className={cn('h-1.5 w-1.5 rounded-full', stConfig.dotColor)} />
                        {stConfig.label}
                      </span>
                    </td>

                    {/* Financial Progress Bar */}
                    <td className="py-3 px-4">
                      <div>
                        <div className="flex items-center justify-between text-[11px] font-medium">
                          <span>{formatINR(paid)}</span>
                          <span className="opacity-50 font-mono text-[10px]">{paidPercent}%</span>
                        </div>
                        <div
                          className="mt-1 h-1.5 w-full rounded-full overflow-hidden"
                          style={{ backgroundColor: 'rgba(128, 128, 128, 0.18)' }}
                        >
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
                        <div className="flex items-center justify-between text-[10px] opacity-60 mt-0.5">
                          <span>Quoted: {formatINR(totalQ)}</span>
                          {balance > 0 ? (
                            <span className="text-amber-500 font-semibold">Due: {formatINR(balance)}</span>
                          ) : (
                            <span className="text-emerald-500">Paid</span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Target Dates */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="text-[11px]">
                        <div className="flex items-center gap-1">
                          <span className="opacity-50">Fitting:</span>
                          <span className="font-semibold">{formatDate(order.expectedTrialAt)}</span>
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="opacity-50">Delivery:</span>
                          <span className="font-medium">{formatDate(order.expectedDeliveryAt)}</span>
                        </div>
                      </div>
                    </td>

                    {/* Priority */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={cn(
                          'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider',
                          order.priority === 'rush'
                            ? 'bg-rose-500/15 text-rose-500 border border-rose-500/30'
                            : order.priority === 'high'
                            ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                            : 'opacity-60',
                        )}
                      >
                        {order.priority || 'normal'}
                      </span>
                    </td>

                    {/* Actions Menu */}
                    <td className="py-3 px-4 text-right whitespace-nowrap w-[70px]">
                      <button
                        type="button"
                        onClick={(e) => handleOpenMenu(e, order)}
                        className={cn(
                          'inline-flex h-8 w-8 items-center justify-center rounded-lg border transition cursor-pointer',
                          isMenuOpen
                            ? 'bg-[var(--admin-primary,#b59410)]/15 text-[var(--admin-primary,#b59410)] font-bold'
                            : 'hover:bg-current/[0.08]',
                        )}
                        style={{
                          borderColor: isMenuOpen
                            ? 'var(--admin-primary, #b59410)'
                            : 'var(--admin-border, rgba(128, 128, 128, 0.2))',
                        }}
                        aria-label="Actions menu"
                        aria-expanded={isMenuOpen}
                      >
                        <span className="text-base leading-none font-bold">⋮</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Floating Action Dropdown */}
      {menuAnchor ? (
        <>
          <div
            className="fixed inset-0 z-40 bg-transparent"
            onClick={() => setMenuAnchor(null)}
          />

          <div
            className="fixed z-50 w-52 rounded-xl border p-1 shadow-2xl animate-fade-in text-left text-xs"
            style={{
              top: menuAnchor.showAbove ? undefined : `${menuAnchor.top}px`,
              bottom: menuAnchor.showAbove ? `${window.innerHeight - menuAnchor.top}px` : undefined,
              right: `${menuAnchor.right}px`,
              backgroundColor: 'var(--admin-card, #1f2937)',
              borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.22))',
              color: 'var(--admin-card-text, var(--admin-text, #f3f4f6))',
              boxShadow: '0 12px 32px -4px rgba(0, 0, 0, 0.35)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => {
                const ord = menuAnchor.order;
                setMenuAnchor(null);
                onPreview(ord);
              }}
              className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 font-medium transition hover:bg-current/[0.06] text-inherit cursor-pointer"
            >
              <span className="text-sm">👁️</span>
              <span>Quick Preview</span>
            </button>

            <Link
              to={`/admin/orders/${menuAnchor.order.id}`}
              onClick={() => setMenuAnchor(null)}
              className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 font-medium transition hover:bg-current/[0.06] text-inherit cursor-pointer"
            >
              <span className="text-sm">🧵</span>
              <span>Full Order Workspace</span>
            </Link>

            {menuAnchor.order.customerId?.phone ? (
              <a
                href={whatsappDeepLink(
                  menuAnchor.order.customerId.phone,
                  `Hi ${menuAnchor.order.customerId.name}, this is Kadamba's Designer Studio regarding your order #${menuAnchor.order.orderNumber} (${menuAnchor.order.title}).`,
                )}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMenuAnchor(null)}
                className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 font-medium text-emerald-500 hover:bg-emerald-500/10 transition cursor-pointer"
              >
                <span className="text-sm">💬</span>
                <span>WhatsApp Client</span>
              </a>
            ) : null}

            <div
              className="my-1 border-t"
              style={{ borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.15))' }}
            />

            {/* Only the moves the API will accept from *this* order's stage.
                The previous version offered "Mark Delivered" to an enquiry and
                "Move to Finishing" to a delivered order — both refused. */}
            {canTransitionOrder(menuAnchor.order.status, 'delivery') ? (
              <button
                type="button"
                onClick={() => {
                  const id = menuAnchor.order.id;
                  setMenuAnchor(null);
                  onStatusChange(id, 'delivery');
                }}
                className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 font-medium text-emerald-500 hover:bg-emerald-500/10 cursor-pointer"
              >
                <span className="text-sm">📦</span>
                <span>Mark Delivered</span>
              </button>
            ) : null}

            {canTransitionOrder(menuAnchor.order.status, 'finishing') ? (
              <button
                type="button"
                onClick={() => {
                  const id = menuAnchor.order.id;
                  setMenuAnchor(null);
                  onStatusChange(id, 'finishing');
                }}
                className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 font-medium opacity-70 hover:opacity-100 hover:bg-current/[0.06] cursor-pointer"
              >
                <span className="text-sm">↩️</span>
                <span>Move to Finishing</span>
              </button>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}
