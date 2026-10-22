import { Link, useNavigate } from 'react-router-dom';
import type { PaymentRecord } from '@/services/finance/financeService';
import { whatsappDeepLink } from '@/utils/whatsapp';
import { EmptyState } from '../components/EmptyState';
import { Skeleton } from '../components/Skeleton';
import { cn } from '@/utils/cn';
import { RowActionsMenu } from '@/components/ui';

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
              className="stagger-rows divide-y border-line"
            >
              {items.map((pay) => {

                return (
                  <tr
                    key={pay.id}
                    className="transition hover:bg-current/[0.03] group border-line"
                  >
                    {/* Date */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="font-semibold block">{formatDate(pay.paidAt)}</span>
                      <span className="text-[10px] opacity-70 block mt-0.5">By {pay.recordedBy || 'Admin'}</span>
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
                          <span className="text-[10px] opacity-70 block truncate max-w-[150px] mt-0.5">
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
                        <div className="flex items-center gap-1.5 text-[11px] opacity-70 mt-0.5">
                          {pay.order?.orderNumber ? (
                            <Link
                              to={`/admin/orders/${pay.order.id}`}
                              className="font-mono hover:underline text-brand-strong"
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
                      <RowActionsMenu
                        label={`Actions for payment ${pay.reference || pay.id.slice(-6)}`}
                        row={pay}
                        actions={[
                          { id: 'preview', label: 'Quick Receipt Preview', icon: 'view', onSelect: (row) => onPreview(row) },
                          { id: 'order', label: 'Open Order Workspace', icon: 'thread', hidden: (row) => !row.order?.id, onSelect: (row) => navigate(`/admin/orders/${row.order?.id}`) },
                          { id: 'receipt', label: 'Send WhatsApp Receipt', icon: 'message', hidden: (row) => !row.order?.customer?.phone, onSelect: (row) => window.open(whatsappDeepLink(row.order?.customer?.phone || '', `Dear ${row.order?.customer?.name}, we have recorded your payment of ₹${row.amount} for order #${row.order?.orderNumber}. Thank you, Kadamba's Designer Studio.`), '_blank', 'noopener,noreferrer') },
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
