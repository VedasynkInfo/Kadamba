import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@/components/icons';
import type { PaymentRecord } from '@/services/finance/financeService';
import { whatsappDeepLink } from '@/utils/whatsapp';
import { EmptyState } from '../components/EmptyState';
import { Skeleton } from '../components/Skeleton';
import { cn } from '@/utils/cn';

const SKELETON_ROWS = 6;

function formatINR(v: number) {
  return `₹${v.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

interface PaymentsTableProps {
  items: PaymentRecord[];
  loading?: boolean;
  onPreview: (payment: PaymentRecord) => void;
  onNewPayment: () => void;
}

export function PaymentsTable({
  items,
  loading = false,
  onPreview,
  onNewPayment,
}: PaymentsTableProps) {
  const [menuAnchor, setMenuAnchor] = useState<{
    payment: PaymentRecord;
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

  function handleOpenMenu(e: React.MouseEvent<HTMLButtonElement>, payment: PaymentRecord) {
    e.stopPropagation();
    if (menuAnchor?.payment.id === payment.id) {
      setMenuAnchor(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const menuHeight = 180;
    const spaceBelow = window.innerHeight - rect.bottom;
    const showAbove = spaceBelow < menuHeight && rect.top > menuHeight;

    setMenuAnchor({
      payment,
      top: showAbove ? rect.top - 6 : rect.bottom + 6,
      right: window.innerWidth - rect.right,
      showAbove,
    });
  }

  return (
    <div
      className="rounded-xl border shadow-xs overflow-visible transition-colors bg-surface-raised border-line text-ink-raised"
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
            title="No payments recorded"
            description="No customer payments or advances recorded for this selected month."
            actionLabel="+ Record Payment"
            onAction={onNewPayment}
          />
        </div>
      ) : (
        <div className="overflow-x-auto overflow-y-hidden">
          <table className="w-full min-w-[900px] text-left border-collapse text-xs table-fixed">
            <thead>
              <tr
                className="border-b text-[0.65rem] uppercase tracking-wider font-semibold opacity-75 border-line bg-surface-sunken"
              >
                <th className="py-3 px-4 w-[140px]">Date / Time</th>
                <th className="py-3 px-4 w-[170px]">Reference / Notes</th>
                <th className="py-3 px-4 min-w-[200px]">Client / Order</th>
                <th className="py-3 px-4 w-[130px]">Method</th>
                <th className="py-3 px-4 w-[130px] text-right">Amount</th>
                <th className="py-3 px-4 w-[70px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody
              className="divide-y border-line"
            >
              {items.map((pay) => {
                const isMenuOpen = menuAnchor?.payment.id === pay.id;

                return (
                  <tr
                    key={pay.id}
                    className="transition hover:bg-current/[0.03] group border-line"
                  >
                    {/* Date */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-semibold block">{formatDate(pay.paidAt)}</span>
                      <span className="text-[10px] opacity-60 block mt-0.5">By {pay.recordedBy || 'Admin'}</span>
                    </td>

                    {/* Reference / Note */}
                    <td className="py-3 px-4">
                      <div>
                        <button
                          type="button"
                          onClick={() => onPreview(pay)}
                          className="font-mono text-xs font-semibold text-inherit hover:underline block truncate max-w-[150px] cursor-pointer"
                        >
                          {pay.reference || `REC-${pay.id.slice(-6).toUpperCase()}`}
                        </button>
                        {pay.notes ? (
                          <span className="text-[10px] opacity-60 block truncate max-w-[150px] mt-0.5">
                            {pay.notes}
                          </span>
                        ) : null}
                      </div>
                    </td>

                    {/* Client & Order */}
                    <td className="py-3 px-4">
                      <div className="truncate max-w-[220px]">
                        <span className="font-semibold block truncate">
                          {pay.order?.customer?.name || 'Walk-in Customer'}
                        </span>
                        <div className="flex items-center gap-1.5 text-[11px] opacity-60 mt-0.5">
                          {pay.order?.orderNumber ? (
                            <Link
                              to={`/admin/orders/${pay.order.id}`}
                              className="font-mono hover:underline text-brand"
                            >
                              Order #{pay.order.orderNumber}
                            </Link>
                          ) : (
                            <span>General Receipt</span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Method */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={cn(
                          'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border',
                          pay.method === 'upi'
                            ? 'bg-purple-500/15 text-purple-400 border-purple-500/30'
                            : pay.method === 'cash'
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : pay.method === 'card'
                            ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                            : 'bg-stone-500/15 text-stone-400 border-stone-500/30',
                        )}
                      >
                        {pay.method === 'upi'
                          ? 'UPI'
                          : pay.method === 'cash'
                          ? 'Cash'
                          : pay.method === 'card'
                          ? 'Card'
                          : 'Bank'}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <span className="font-bold text-sm text-emerald-400">{formatINR(pay.amount)}</span>
                    </td>

                    {/* Actions Menu */}
                    <td className="py-3 px-4 text-right whitespace-nowrap w-[70px]">
                      <button
                        type="button"
                        onClick={(e) => handleOpenMenu(e, pay)}
                        className={cn(
                          'inline-flex h-8 w-8 items-center justify-center rounded-lg border transition cursor-pointer',
                          isMenuOpen
                            ? 'bg-brand/15 text-brand font-bold'
                            : 'hover:bg-current/[0.08]', isMenuOpen ? 'border-brand' : 'border-line'
                        )}
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
            className="fixed z-50 w-52 rounded-xl border p-1 shadow-2xl animate-fade-in text-left text-xs bg-surface-raised border-line text-ink-raised"
            style={{
              top: menuAnchor.showAbove ? undefined : `${menuAnchor.top}px`,
              bottom: menuAnchor.showAbove ? `${window.innerHeight - menuAnchor.top}px` : undefined,
              right: `${menuAnchor.right}px`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => {
                const py = menuAnchor.payment;
                setMenuAnchor(null);
                onPreview(py);
              }}
              className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 font-medium transition hover:bg-current/[0.06] text-inherit cursor-pointer"
            >
              <Icon name="view" size={14} />
              <span>Quick Receipt Preview</span>
            </button>

            {menuAnchor.payment.order?.id ? (
              <Link
                to={`/admin/orders/${menuAnchor.payment.order.id}`}
                onClick={() => setMenuAnchor(null)}
                className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 font-medium transition hover:bg-current/[0.06] text-inherit cursor-pointer"
              >
                <Icon name="thread" size={14} />
                <span>Open Order Workspace</span>
              </Link>
            ) : null}

            {menuAnchor.payment.order?.customer?.phone ? (
              <a
                href={whatsappDeepLink(
                  menuAnchor.payment.order.customer.phone,
                  `Dear ${menuAnchor.payment.order.customer.name}, we have recorded your payment of ₹${menuAnchor.payment.amount} for order #${menuAnchor.payment.order.orderNumber}. Thank you, Kadamba's Designer Studio.`,
                )}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMenuAnchor(null)}
                className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 font-medium text-emerald-500 hover:bg-emerald-500/10 transition cursor-pointer"
              >
                <Icon name="message" size={14} />
                <span>Send WhatsApp Receipt</span>
              </a>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}
