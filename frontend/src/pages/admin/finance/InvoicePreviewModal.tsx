import { Link } from 'react-router-dom';
import { Icon } from '@/components/icons';
import type { InvoiceRecord } from '@/services/finance/financeService';
import { whatsappDeepLink } from '@/utils/whatsapp';
import { cn } from '@/utils/cn';

function formatINR(v: number) {
  return `₹${v.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

interface InvoicePreviewModalProps {
  invoice: InvoiceRecord | null;
  onClose: () => void;
}

export function InvoicePreviewModal({ invoice, onClose }: InvoicePreviewModalProps) {
  if (!invoice) return null;

  const totalQ = invoice.paymentSummary?.totalQuoted || 0;
  const paid = invoice.paymentSummary?.totalPaid || 0;
  const balance = invoice.paymentSummary?.balance || 0;
  const advance = invoice.paymentSummary?.advance || 0;
  const paidPercent = totalQ > 0 ? Math.min(100, Math.round((paid / totalQ) * 100)) : 0;

  const waHref = invoice.customer?.phone
    ? whatsappDeepLink(
        invoice.customer.phone,
        `Dear ${invoice.customer.name}, regarding order #${invoice.orderNumber}, your invoice balance is ₹${balance}. You can contact us for any billing enquiries. Kadamba's Designer Studio.`,
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
        className="relative w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden animate-spring-in text-xs bg-surface-raised border-line text-ink-raised"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between border-b px-6 py-4 border-line"
        >
          <div className="flex items-center gap-2">
            <span
              className="font-mono text-xs font-bold px-2 py-0.5 rounded border border-line bg-surface-sunken"
            >
              {invoice.invoiceNumber || `ORD-#${invoice.orderNumber}`}
            </span>
            <span
              className={cn(
                'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider',
                invoice.billStatus === 'paid'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : invoice.billStatus === 'partial'
                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                  : 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
              )}
            >
              {invoice.billStatus}
            </span>
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
          <div>
            <span className="text-[10px] opacity-50 uppercase tracking-wider block font-semibold">
              Client & Project
            </span>
            <h3 className="text-xl font-bold font-heading text-inherit mt-0.5">{invoice.customer?.name}</h3>
            <p className="opacity-70 text-xs mt-0.5">
              <Icon name="phoneCall" size={14} className="mr-1 inline align-middle" /> {invoice.customer?.phone} {invoice.customer?.email ? `· <Icon name="email" size={14} className="mr-1 inline align-middle" /> ${invoice.customer.email}` : ''}
            </p>
            <p className="font-medium text-xs mt-1 text-inherit">{invoice.title}</p>
          </div>

          {/* Payment Progress Bar */}
          <div
            className="rounded-xl p-4 border space-y-3 bg-surface-sunken border-line"
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs">Payment Settlement</span>
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

            <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
              <div className="flex justify-between border-b pb-1.5 border-line">
                <span className="opacity-60">Total Quoted:</span>
                <span className="font-bold">{formatINR(totalQ)}</span>
              </div>
              <div className="flex justify-between border-b pb-1.5 border-line">
                <span className="opacity-60">Advance Booking:</span>
                <span className="font-bold">{formatINR(advance)}</span>
              </div>
              <div className="flex justify-between border-b pb-1.5 border-line">
                <span className="opacity-60">Total Paid:</span>
                <span className="font-bold text-emerald-400">{formatINR(paid)}</span>
              </div>
              <div className="flex justify-between border-b pb-1.5 border-line">
                <span className="opacity-60">Balance Due:</span>
                <span className="font-bold text-amber-400">{formatINR(balance)}</span>
              </div>
            </div>
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
              <span><Icon name="message" size={14} className="mr-1 inline align-middle" /> WhatsApp Reminder</span>
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
              to={`/admin/invoices/${invoice.id}`}
              className="inline-flex items-center gap-1 rounded-lg px-4 py-1.5 font-bold shadow-xs transition hover:opacity-95 bg-brand text-ink-on-brand"
            >
              <span>Printable Document</span>
              <span><Icon name="arrowRight" size={14} className="mr-1 inline align-middle" /> </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
