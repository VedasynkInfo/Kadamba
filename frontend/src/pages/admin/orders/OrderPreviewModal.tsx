import { Link } from 'react-router-dom';
import { Icon } from '@/components/icons';
import type { Order } from '@/services/orders/orderService';
import type { OrderStatus } from '@/shared/enums';
import { ORDER_STATUS_CONFIG, orderStatusChoices } from './types';
import { whatsappDeepLink } from '@/utils/whatsapp';
import { cn } from '@/utils/cn';

function formatINR(v: number) {
  return `₹${v.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function formatDate(iso?: string) {
  if (!iso) return 'Not scheduled';
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

interface OrderPreviewModalProps {
  order: Order | null;
  onClose: () => void;
  onStatusChange: (orderId: string, status: OrderStatus) => void;
}

export function OrderPreviewModal({ order, onClose, onStatusChange }: OrderPreviewModalProps) {
  if (!order) return null;

  const stConfig = ORDER_STATUS_CONFIG[order.status] || {
    label: order.status,
    color: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
    dotColor: 'bg-zinc-400',
  };

  const stageChoices = orderStatusChoices(order.status);

  const totalQ = order.paymentSummary?.totalQuoted || 0;
  const paid = order.paymentSummary?.totalPaid || 0;
  const balance = order.paymentSummary?.balance || 0;
  const paidPercent = totalQ > 0 ? Math.min(100, Math.round((paid / totalQ) * 100)) : 0;

  const waHref = order.customerId?.phone
    ? whatsappDeepLink(
        order.customerId.phone,
        `Hi ${order.customerId.name}, this is Kadamba's Designer Studio regarding your order #${order.orderNumber} (${order.title}).`,
      )
    : undefined;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-xl rounded-2xl border shadow-2xl overflow-hidden animate-spring-in text-xs bg-surface-raised border-line text-ink-raised"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between border-b px-6 py-4 border-line"
        >
          <div className="flex items-center gap-2.5">
            <span
              className="font-mono text-xs font-bold px-2 py-0.5 rounded border border-line bg-surface-sunken"
            >
              #{order.orderNumber}
            </span>
            <span
              className={cn(
                'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold border uppercase tracking-wider',
                stConfig.color,
              )}
            >
              <span className={cn('h-1.5 w-1.5 rounded-full', stConfig.dotColor)} />
              {stConfig.label}
            </span>
            {order.priority === 'rush' || order.priority === 'high' ? (
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                {order.priority} <Icon name="speed" size={14} className="mr-1 inline align-middle" /> 
              </span>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-lg border flex items-center justify-center text-xs opacity-70 hover:opacity-100 hover:bg-current/[0.06] transition cursor-pointer border-line"
            aria-label="Close dialog"
          >
            <Icon name="close" size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Order Title & Client Info */}
          <div>
            <h3 className="text-xl font-bold font-heading text-inherit">{order.title || 'Untitled Order'}</h3>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs opacity-70">
              <span className="font-semibold text-inherit">{order.customerId?.name}</span>
              <span>·</span>
              <span><Icon name="phoneCall" size={14} className="mr-1 inline align-middle" /> {order.customerId?.phone || 'No phone'}</span>
              {order.customerId?.city ? (
                <>
                  <span>·</span>
                  <span><Icon name="location" size={14} className="mr-1 inline align-middle" /> {order.customerId.city}</span>
                </>
              ) : null}
            </div>
          </div>

          {/* Target Dates Grid */}
          <div
            className="grid grid-cols-2 gap-3 rounded-xl p-3.5 border bg-surface-sunken border-line"
          >
            <div>
              <span className="opacity-50 block text-[10px] uppercase font-semibold">Fitting & Trial</span>
              <span className="font-bold text-sm mt-0.5 block">{formatDate(order.expectedTrialAt)}</span>
            </div>
            <div>
              <span className="opacity-50 block text-[10px] uppercase font-semibold">Final Delivery</span>
              <span className="font-bold text-sm mt-0.5 block text-emerald-400">
                {formatDate(order.expectedDeliveryAt)}
              </span>
            </div>
          </div>

          {/* Garments / Line Items */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold opacity-75 uppercase tracking-wider">Garments & Items</h4>
            <div
              className="rounded-xl border divide-y overflow-hidden text-xs border-line"
            >
              {order.lineItems?.length ? (
                order.lineItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 flex items-center justify-between border-line"
                  >
                    <div>
                      <span className="font-semibold block">{item.name || `Garment #${idx + 1}`}</span>
                      {item.notes ? (
                        <span className="opacity-60 text-[11px] block mt-0.5">{item.notes}</span>
                      ) : null}
                    </div>
                    <span className="font-mono text-xs opacity-75 font-semibold">Qty: {item.qty || 1}</span>
                  </div>
                ))
              ) : (
                <div className="p-3 opacity-50 text-center">No line items specified</div>
              )}
            </div>
          </div>

          {/* Financials Breakdown */}
          <div
            className="rounded-xl p-4 border space-y-2 bg-surface-sunken border-line"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs">Payment Collection Progress</span>
              <span className="font-mono text-xs font-bold">{paidPercent}% Paid</span>
            </div>
            <div
              className="h-2 w-full rounded-full overflow-hidden bg-line"
            >
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-300',
                  paidPercent === 100 ? 'bg-emerald-500' : 'bg-amber-500',
                )}
                style={{ width: `${paidPercent}%` }}
              />
            </div>
            <div className="grid grid-cols-3 gap-2 pt-1 text-center">
              <div>
                <span className="text-[10px] opacity-50 block">Quoted</span>
                <span className="font-bold text-xs">{formatINR(totalQ)}</span>
              </div>
              <div>
                <span className="text-[10px] opacity-50 block">Paid</span>
                <span className="font-bold text-xs text-emerald-400">{formatINR(paid)}</span>
              </div>
              <div>
                <span className="text-[10px] opacity-50 block">Balance Due</span>
                <span className="font-bold text-xs text-amber-400">{formatINR(balance)}</span>
              </div>
            </div>
          </div>

          {/* Quick Stage Transition — only the moves the API will accept. */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold opacity-75 block">Move to next stage:</label>
            {stageChoices.length === 0 ? (
              <p className="text-[11px] opacity-60">
                {stConfig.label} — lifecycle complete, no further stages.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {stageChoices.map((choice) => (
                  <button
                    key={choice.value}
                    type="button"
                    onClick={() => onStatusChange(order.id, choice.value)}
                    className={cn(
                      'px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition cursor-pointer',
                      'opacity-70 hover:opacity-100 border-current/20 hover:bg-current/[0.04]',
                    )}
                  >
                    {choice.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div
          className="flex flex-wrap items-center justify-between gap-3 border-t px-6 py-4 border-line"
        >
          {waHref ? (
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-1.5 font-bold text-emerald-500 hover:bg-emerald-500/10 transition cursor-pointer border-emerald-500/30"
            >
              <span><Icon name="message" size={14} className="mr-1 inline align-middle" /> WhatsApp Client</span>
            </a>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border px-3 py-1.5 text-xs font-semibold opacity-80 hover:opacity-100 hover:bg-current/[0.05] transition cursor-pointer border-line"
            >
              Close
            </button>
            <Link
              to={`/admin/orders/${order.id}`}
              className="inline-flex items-center gap-1 rounded-lg px-4 py-1.5 font-bold shadow-xs transition hover:opacity-95 bg-brand text-ink-on-brand"
            >
              <span>Open Atelier Workspace</span>
              <span><Icon name="arrowRight" size={14} className="mr-1 inline align-middle" /> </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
