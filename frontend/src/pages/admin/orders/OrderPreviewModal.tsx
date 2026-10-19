import { Link } from 'react-router-dom';
import type { Order } from '@/services/orders/orderService';
import { ORDER_STATUS_CONFIG } from './types';
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
  onStatusChange: (orderId: string, status: string) => void;
}

export function OrderPreviewModal({ order, onClose, onStatusChange }: OrderPreviewModalProps) {
  if (!order) return null;

  const stConfig = ORDER_STATUS_CONFIG[order.status] || {
    label: order.status,
    color: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
    dotColor: 'bg-zinc-400',
  };

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
        className="relative w-full max-w-xl rounded-2xl border shadow-2xl overflow-hidden animate-fade-in-up text-xs"
        style={{
          backgroundColor: 'var(--admin-card, #141b26)',
          borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.25))',
          color: 'var(--admin-card-text, var(--admin-text, #f3f4f6))',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between border-b px-6 py-4"
          style={{ borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.18))' }}
        >
          <div className="flex items-center gap-2.5">
            <span
              className="font-mono text-xs font-bold px-2 py-0.5 rounded border"
              style={{
                borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.2))',
                backgroundColor: 'rgba(128, 128, 128, 0.08)',
              }}
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
                {order.priority} ⚡
              </span>
            ) : null}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-lg border flex items-center justify-center text-xs opacity-70 hover:opacity-100 hover:bg-current/[0.06] transition cursor-pointer"
            style={{ borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.2))' }}
            aria-label="Close dialog"
          >
            ✕
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
              <span>📞 {order.customerId?.phone || 'No phone'}</span>
              {order.customerId?.city ? (
                <>
                  <span>·</span>
                  <span>📍 {order.customerId.city}</span>
                </>
              ) : null}
            </div>
          </div>

          {/* Target Dates Grid */}
          <div
            className="grid grid-cols-2 gap-3 rounded-xl p-3.5 border"
            style={{
              backgroundColor: 'rgba(128, 128, 128, 0.05)',
              borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.15))',
            }}
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
              className="rounded-xl border divide-y overflow-hidden text-xs"
              style={{ borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.15))' }}
            >
              {order.lineItems?.length ? (
                order.lineItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 flex items-center justify-between"
                    style={{ borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.12))' }}
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
            className="rounded-xl p-4 border space-y-2"
            style={{
              backgroundColor: 'rgba(128, 128, 128, 0.05)',
              borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.18))',
            }}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs">Payment Collection Progress</span>
              <span className="font-mono text-xs font-bold">{paidPercent}% Paid</span>
            </div>
            <div
              className="h-2 w-full rounded-full overflow-hidden"
              style={{ backgroundColor: 'rgba(128, 128, 128, 0.2)' }}
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

          {/* Quick Stage Transition */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold opacity-75 block">Update Atelier Stage:</label>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(ORDER_STATUS_CONFIG).slice(0, 6).map(([stKey, cfg]) => {
                const isActive = order.status === stKey;
                return (
                  <button
                    key={stKey}
                    type="button"
                    onClick={() => onStatusChange(order.id, stKey)}
                    className={cn(
                      'px-2.5 py-1 rounded-lg border text-[11px] font-semibold transition cursor-pointer',
                      isActive
                        ? 'bg-[var(--admin-primary,#b59410)] text-white border-[var(--admin-primary,#b59410)]'
                        : 'opacity-70 hover:opacity-100 border-current/20 hover:bg-current/[0.04]',
                    )}
                  >
                    {isActive ? '✓ ' : ''}
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div
          className="flex flex-wrap items-center justify-between gap-3 border-t px-6 py-4"
          style={{ borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.18))' }}
        >
          {waHref ? (
            <a
              href={waHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-1.5 font-bold text-emerald-500 hover:bg-emerald-500/10 transition cursor-pointer"
              style={{ borderColor: 'rgba(16, 185, 129, 0.3)' }}
            >
              <span>💬 WhatsApp Client</span>
            </a>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border px-3 py-1.5 text-xs font-semibold opacity-80 hover:opacity-100 hover:bg-current/[0.05] transition cursor-pointer"
              style={{ borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.2))' }}
            >
              Close
            </button>
            <Link
              to={`/admin/orders/${order.id}`}
              className="inline-flex items-center gap-1 rounded-lg px-4 py-1.5 font-bold shadow-xs transition hover:opacity-95"
              style={{
                backgroundColor: 'var(--admin-primary, #b59410)',
                color: 'var(--admin-primary-text, #ffffff)',
              }}
            >
              <span>Open Atelier Workspace</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
