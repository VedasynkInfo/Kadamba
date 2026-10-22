import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { PaymentRecord } from '@/services/finance/financeService';
import { whatsappDeepLink } from '@/utils/whatsapp';
import { cn } from '@/utils/cn';

interface PaymentPreviewModalProps {
  payment: PaymentRecord | null;
  onClose: () => void;
}

function formatINR(v: number) {
  return `?${v.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function formatDateTime(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export function PaymentPreviewModal({ payment, onClose }: PaymentPreviewModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (payment) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [payment, onClose]);

  if (!payment) return null;

  const order = payment.order;
  const customer = order?.customer;
  const refCode = payment.reference || `REC-${payment.id.slice(-6).toUpperCase()}`;

  const whatsappMsg = customer
    ? `Dear ${customer.name}, we have recorded your payment of ${formatINR(payment.amount)} for Order #${order?.orderNumber || ''}. Ref: ${refCode}. Thank you for choosing Kadamba's Designer Studio.`
    : `Payment receipt: ${formatINR(payment.amount)} received for order #${order?.orderNumber || ''}. Ref: ${refCode}. Kadamba's Designer Studio.`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-espresso/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Payment receipt preview"
    >
      <div
        className="w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden transition-all text-xs bg-surface-raised border-line text-ink-raised"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between border-b px-5 py-4 border-line"
        >
          <div className="flex items-center gap-2.5">
            <span className="text-xl">??</span>
            <div>
              <h3 className="font-heading text-base font-bold tracking-wide">Receipt Snapshot</h3>
              <p className="font-mono text-[10px] opacity-60 mt-0.5">{refCode}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border text-sm opacity-60 hover:opacity-100 transition cursor-pointer border-line"
            aria-label="Close modal"
          >
            ?
          </button>
        </div>

        {/* Hero Amount & Method */}
        <div className="p-6 text-center border-b border-line">
          <p className="text-[10px] uppercase font-bold tracking-widest opacity-60 mb-1">Amount Received</p>
          <h2 className="font-heading text-3xl font-black text-emerald-400">
            {formatINR(payment.amount)}
          </h2>
          <div className="mt-3 flex items-center justify-center gap-2">
            <span
              className={cn(
                'inline-flex items-center px-2.5 py-1 rounded text-[11px] font-bold uppercase tracking-wider border',
                payment.method === 'upi'
                  ? 'bg-purple-500/15 text-purple-400 border-purple-500/30'
                  : payment.method === 'cash'
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                  : payment.method === 'card'
                  ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
                  : 'bg-stone-500/15 text-stone-400 border-stone-500/30',
              )}
            >
              {payment.method === 'upi'
                ? '?? UPI / QR'
                : payment.method === 'cash'
                ? '?? Cash'
                : payment.method === 'card'
                ? '?? Card'
                : '?? Bank Transfer'}
            </span>
            <span className="text-[11px] opacity-60">on {formatDateTime(payment.paidAt)}</span>
          </div>
        </div>

        {/* Details Grid */}
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div
              className="rounded-xl border p-3 border-line bg-surface-sunken"
            >
              <span className="text-[10px] uppercase tracking-wider opacity-60 block">Customer</span>
              <span className="font-bold text-sm block mt-1 truncate">
                {customer?.name || 'Walk-in Client'}
              </span>
              {customer?.phone ? (
                <span className="text-[11px] opacity-70 block font-mono mt-0.5">
                  {customer.phone}
                </span>
              ) : null}
            </div>

            <div
              className="rounded-xl border p-3 border-line bg-surface-sunken"
            >
              <span className="text-[10px] uppercase tracking-wider opacity-60 block">Linked Order</span>
              {order ? (
                <>
                  <Link
                    to={`/admin/orders/${order.id}`}
                    className="font-bold text-sm block mt-1 hover:underline text-brand-strong truncate"
                  >
                    #{order.orderNumber}
                  </Link>
                  <span className="text-[11px] opacity-70 block truncate mt-0.5">
                    {order.title || order.referenceId || 'Bespoke Order'}
                  </span>
                </>
              ) : (
                <span className="opacity-50 block mt-1">—</span>
              )}
            </div>
          </div>

          {/* Reference & Notes */}
          <div
            className="rounded-xl border p-3 space-y-2 border-line bg-surface-sunken"
          >
            <div className="flex justify-between items-center text-[11px]">
              <span className="opacity-60">Payment Reference / Txn ID:</span>
              <span className="font-mono font-semibold">{payment.reference || 'None specified'}</span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span className="opacity-60">Recorded By:</span>
              <span className="font-semibold">{payment.recordedBy || 'Admin Desk'}</span>
            </div>
            {payment.notes ? (
              <div className="pt-2 border-t text-[11px] border-line">
                <span className="opacity-60 block text-[10px] uppercase tracking-wider mb-0.5">Notes:</span>
                <p className="opacity-90 italic">{payment.notes}</p>
              </div>
            ) : null}
          </div>
        </div>

        {/* Footer Actions */}
        <div
          className="flex items-center justify-between border-t px-5 py-3.5 border-line bg-surface-sunken"
        >
          {customer?.phone ? (
            <a
              href={whatsappDeepLink(customer.phone, whatsappMsg)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 transition cursor-pointer shadow-xs"
            >
              <span>??</span>
              <span>Send WhatsApp Receipt</span>
            </a>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            {order?.id ? (
              <Link
                to={`/admin/orders/${order.id}`}
                className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 border text-xs font-semibold hover:bg-current/[0.05] transition border-line"
              >
                <span>Order File ?</span>
              </Link>
            ) : null}
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-3 py-1.5 text-xs font-bold border hover:bg-current/[0.05] transition cursor-pointer border-line"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
