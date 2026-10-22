import { useNavigate } from 'react-router-dom';
import type { InvoiceRecord } from '@/services/finance/financeService';
import { whatsappDeepLink } from '@/utils/whatsapp';
import { EmptyState } from '../components/EmptyState';
import { Skeleton } from '../components/Skeleton';
import { cn } from '@/utils/cn';
import { RowActionsMenu } from '@/components/ui';

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
  const navigate = useNavigate();

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
              className="stagger-rows divide-y border-line"
            >
              {items.map((inv) => {
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
                        <span className="text-[10px] opacity-70 font-mono block mt-0.5">
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
                        <span className="text-[11px] opacity-70 block mt-0.5 truncate">
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
                          <span className="opacity-70 font-mono text-[10px]">{paidPercent}%</span>
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
                        <div className="text-[10px] opacity-70 mt-0.5">
                          {balance > 0 ? (
                            <span className="text-amber-500 font-semibold">Due: {formatINR(balance)}</span>
                          ) : (
                            <span className="text-emerald-700 font-medium">Settled</span>
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
                            ? 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30'
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
                      <RowActionsMenu
                        label={`Actions for invoice ${inv.invoiceNumber || inv.orderNumber}`}
                        row={inv}
                        actions={[
                          { id: 'preview', label: 'Quick Preview', icon: 'view', onSelect: (row) => onPreview(row) },
                          { id: 'document', label: 'Printable Invoice Document', icon: 'print', onSelect: (row) => navigate(`/admin/invoices/${row.id}`) },
                          { id: 'reminder', label: 'Send Payment Reminder', icon: 'message', hidden: (row) => !row.customer?.phone || (row.paymentSummary?.balance || 0) <= 0, onSelect: (row) => window.open(whatsappDeepLink(row.customer.phone, `Dear ${row.customer.name}, regarding order #${row.orderNumber}, your outstanding balance is ₹${row.paymentSummary.balance}. Thank you, Kadamba's Designer Studio.`), '_blank', 'noopener,noreferrer') },
                          { id: 'record', label: 'Record Payment', icon: 'card', divider: true, onSelect: () => navigate('/admin/payments') },
                        ]}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      
    </div>
  );
}
