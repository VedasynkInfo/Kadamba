import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@/components/icons';
import type { InvoiceRecord } from '@/services/finance/financeService';
import { whatsappDeepLink } from '@/utils/whatsapp';
import { EmptyState } from '../components/EmptyState';
import { Skeleton } from '../components/Skeleton';
import { cn } from '@/utils/cn';

const SKELETON_ROWS = 6;

function formatINR(v: number) {
  return `₹${v.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

interface InvoicesTableProps {
  items: InvoiceRecord[];
  loading?: boolean;
  hasActiveFilters: boolean;
  onResetFilters: () => void;
  onPreview: (inv: InvoiceRecord) => void;
}

export function InvoicesTable({
  items,
  loading = false,
  hasActiveFilters,
  onResetFilters,
  onPreview,
}: InvoicesTableProps) {
  const [menuAnchor, setMenuAnchor] = useState<{
    invoice: InvoiceRecord;
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

  function handleOpenMenu(e: React.MouseEvent<HTMLButtonElement>, invoice: InvoiceRecord) {
    e.stopPropagation();
    if (menuAnchor?.invoice.id === invoice.id) {
      setMenuAnchor(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const menuHeight = 200;
    const spaceBelow = window.innerHeight - rect.bottom;
    const showAbove = spaceBelow < menuHeight && rect.top > menuHeight;

    setMenuAnchor({
      invoice,
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
            title="No invoices found"
            description={
              hasActiveFilters
                ? 'No invoice records match the current filter query.'
                : 'All workshop orders will generate billable invoices here automatically.'
            }
            actionLabel={hasActiveFilters ? 'Clear Filters' : undefined}
            onAction={hasActiveFilters ? onResetFilters : undefined}
          />
        </div>
      ) : (
        <div className="overflow-x-auto overflow-y-hidden">
          <table className="w-full min-w-[900px] text-left border-collapse text-xs table-fixed">
            <thead>
              <tr
                className="border-b text-[0.65rem] uppercase tracking-wider font-semibold opacity-75 border-line bg-surface-sunken"
              >
                <th className="py-3 px-4 w-[150px]">Invoice / Order #</th>
                <th className="py-3 px-4 min-w-[200px]">Client / Project</th>
                <th className="py-3 px-4 w-[130px]">Quoted Value</th>
                <th className="py-3 px-4 w-[180px]">Collected vs Balance</th>
                <th className="py-3 px-4 w-[130px]">Bill Status</th>
                <th className="py-3 px-4 w-[70px] text-right">Actions</th>
              </tr>
            </thead>
            <tbody
              className="divide-y border-line"
            >
              {items.map((inv) => {
                const isMenuOpen = menuAnchor?.invoice.id === inv.id;
                const totalQ = inv.paymentSummary?.totalQuoted || 0;
                const paid = inv.paymentSummary?.totalPaid || 0;
                const balance = inv.paymentSummary?.balance || 0;
                const paidPercent = totalQ > 0 ? Math.min(100, Math.round((paid / totalQ) * 100)) : 0;

                return (
                  <tr
                    key={inv.id}
                    className="transition hover:bg-current/[0.03] group border-line"
                  >
                    {/* Invoice & Order Number */}
                    <td className="py-3 px-4">
                      <div>
                        <button
                          type="button"
                          onClick={() => onPreview(inv)}
                          className="font-mono text-xs font-bold text-inherit hover:underline block cursor-pointer"
                        >
                          {inv.invoiceNumber || `ORD-#${inv.orderNumber}`}
                        </button>
                        <span className="text-[10px] opacity-60 font-mono block mt-0.5">
                          Order #{inv.orderNumber}
                        </span>
                      </div>
                    </td>

                    {/* Client & Project */}
                    <td className="py-3 px-4">
                      <div className="truncate max-w-[220px]">
                        <span className="font-semibold block truncate">
                          {inv.customer?.name || 'Walk-in Customer'}
                        </span>
                        <span className="text-[11px] opacity-60 block mt-0.5 truncate">
                          {inv.title || inv.customer?.phone || '—'}
                        </span>
                      </div>
                    </td>

                    {/* Quoted Value */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-bold text-sm">{formatINR(totalQ)}</span>
                    </td>

                    {/* Collected vs Balance Progress Bar */}
                    <td className="py-3 px-4">
                      <div>
                        <div className="flex items-center justify-between text-[11px] font-medium">
                          <span className="text-emerald-400 font-semibold">{formatINR(paid)}</span>
                          <span className="opacity-60 font-mono text-[10px]">{paidPercent}%</span>
                        </div>
                        <div
                          className="mt-1 h-1.5 w-full rounded-full overflow-hidden bg-line"
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
                        <div className="text-[10px] opacity-60 mt-0.5">
                          {balance > 0 ? (
                            <span className="text-amber-500 font-semibold">Due: {formatINR(balance)}</span>
                          ) : (
                            <span className="text-emerald-500 font-medium">Settled</span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Bill Status */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider',
                          inv.billStatus === 'paid'
                            ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30'
                            : inv.billStatus === 'partial'
                            ? 'bg-amber-500/15 text-amber-500 border-amber-500/30'
                            : inv.billStatus === 'unpaid'
                            ? 'bg-rose-500/15 text-rose-500 border-rose-500/30'
                            : 'bg-stone-500/15 text-stone-400 border-stone-500/30',
                        )}
                      >
                        <span
                          className={cn(
                            'h-1.5 w-1.5 rounded-full',
                            inv.billStatus === 'paid'
                              ? 'bg-emerald-400'
                              : inv.billStatus === 'partial'
                              ? 'bg-amber-400'
                              : inv.billStatus === 'unpaid'
                              ? 'bg-rose-400'
                              : 'bg-stone-400',
                          )}
                        />
                        {inv.billStatus === 'paid'
                          ? 'Paid'
                          : inv.billStatus === 'partial'
                          ? 'Partial'
                          : inv.billStatus === 'unpaid'
                          ? 'Unpaid'
                          : 'No Quote'}
                      </span>
                    </td>

                    {/* Actions Menu */}
                    <td className="py-3 px-4 text-right whitespace-nowrap w-[70px]">
                      <button
                        type="button"
                        onClick={(e) => handleOpenMenu(e, inv)}
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
                const inv = menuAnchor.invoice;
                setMenuAnchor(null);
                onPreview(inv);
              }}
              className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 font-medium transition hover:bg-current/[0.06] text-inherit cursor-pointer"
            >
              <Icon name="view" size={14} />
              <span>Quick Preview</span>
            </button>

            <Link
              to={`/admin/invoices/${menuAnchor.invoice.id}`}
              onClick={() => setMenuAnchor(null)}
              className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 font-medium transition hover:bg-current/[0.06] text-inherit cursor-pointer"
            >
              <Icon name="print" size={14} />
              <span>Printable Invoice Document</span>
            </Link>

            {menuAnchor.invoice.customer?.phone && (menuAnchor.invoice.paymentSummary?.balance || 0) > 0 ? (
              <a
                href={whatsappDeepLink(
                  menuAnchor.invoice.customer.phone,
                  `Dear ${menuAnchor.invoice.customer.name}, regarding order #${menuAnchor.invoice.orderNumber}, your outstanding balance is ₹${menuAnchor.invoice.paymentSummary.balance}. Thank you, Kadamba's Designer Studio.`,
                )}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMenuAnchor(null)}
                className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 font-medium text-emerald-500 hover:bg-emerald-500/10 transition cursor-pointer"
              >
                <Icon name="message" size={14} />
                <span>Send Payment Reminder</span>
              </a>
            ) : null}

            <div
              className="my-1 border-t border-line"
            />

            <Link
              to="/admin/payments"
              onClick={() => setMenuAnchor(null)}
              className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 font-medium text-brand hover:bg-current/[0.06] cursor-pointer"
            >
              <Icon name="card" size={14} />
              <span>Record Payment</span>
            </Link>
          </div>
        </>
      ) : null}
    </div>
  );
}
