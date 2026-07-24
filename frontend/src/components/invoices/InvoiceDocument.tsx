import { cn } from '@/utils/cn';

export type InvoiceBillStatus = 'unquoted' | 'unpaid' | 'partial' | 'paid';

export interface InvoiceDocumentData {
  invoiceNumber: string;
  invoiceDate: string;
  billStatus: InvoiceBillStatus;
  studio: {
    name: string;
    location: string;
    phone: string;
    email: string;
    addressLines: string[];
  };
  customer: {
    id: string;
    name: string;
    phone: string;
    email?: string;
    addressLines?: string[];
  };
  order: {
    id: string;
    orderNumber: number;
    referenceId?: string;
    title: string;
    status: string;
    createdAt: string;
  };
  lineItems: Array<{
    name: string;
    qty: number;
    notes?: string;
    productTypeCode?: string;
  }>;
  paymentSummary: {
    totalQuoted: number;
    advance: number;
    totalPaid: number;
    balance: number;
  };
  payments: Array<{
    id: string;
    amount: number;
    paidAt: string;
    method: string;
    reference?: string;
  }>;
  notes?: string;
}

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

function billLabel(status: InvoiceBillStatus) {
  switch (status) {
    case 'paid':
      return 'Paid in full';
    case 'partial':
      return 'Partially paid';
    case 'unpaid':
      return 'Payment due';
    default:
      return 'Quote pending';
  }
}

function billTone(status: InvoiceBillStatus) {
  switch (status) {
    case 'paid':
      return 'border-emerald-700/40 bg-emerald-50 text-emerald-900';
    case 'partial':
      return 'border-amber-700/40 bg-amber-50 text-amber-950';
    case 'unpaid':
      return 'border-rose-700/40 bg-rose-50 text-rose-900';
    default:
      return 'border-stone-400/50 bg-stone-50 text-stone-700';
  }
}

interface InvoiceDocumentProps {
  invoice: InvoiceDocumentData;
  className?: string;
  /** Extra footer note under the document */
  footerNote?: string;
}

/**
 * Printable boutique invoice document — shared by admin and customer portal.
 */
export function InvoiceDocument({ invoice, className, footerNote }: InvoiceDocumentProps) {
  const { studio, customer, order, lineItems, paymentSummary, payments } = invoice;

  return (
    <article
      className={cn(
        'invoice-document mx-auto w-full max-w-[800px] bg-[#faf7f2] text-[#1a1510] shadow-sm',
        'border border-black/10 print:max-w-none print:border-0 print:shadow-none',
        className,
      )}
    >
      {/* Header */}
      <header className="border-b border-black/15 px-6 py-8 sm:px-10">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="font-heading text-2xl tracking-wide text-[#1a1510] sm:text-3xl">
              {studio.name}
            </p>
            <p className="mt-1 text-[0.65rem] uppercase tracking-[0.28em] text-black/45">
              Boutique & custom tailoring · {studio.location}
            </p>
            <div className="mt-4 space-y-0.5 text-sm text-black/65">
              {studio.addressLines?.map((line) => (
                <p key={line}>{line}</p>
              ))}
              {studio.phone ? <p>{studio.phone}</p> : null}
              {studio.email ? <p>{studio.email}</p> : null}
            </div>
          </div>
          <div className="text-right">
            <p className="text-[0.65rem] uppercase tracking-[0.22em] text-black/40">Invoice</p>
            <p className="mt-1 font-heading text-2xl text-[#8a6d2f]">{invoice.invoiceNumber}</p>
            <p className="mt-3 text-sm text-black/60">
              Date · {formatDate(invoice.invoiceDate)}
            </p>
            <span
              className={cn(
                'mt-3 inline-block border px-2.5 py-1 text-[0.65rem] uppercase tracking-[0.14em]',
                billTone(invoice.billStatus),
              )}
            >
              {billLabel(invoice.billStatus)}
            </span>
          </div>
        </div>
      </header>

      {/* Parties + meta */}
      <div className="grid gap-8 border-b border-black/10 px-6 py-8 sm:grid-cols-2 sm:px-10">
        <div>
          <p className="text-[0.65rem] uppercase tracking-[0.2em] text-black/40">Bill to</p>
          <p className="mt-2 font-heading text-xl">{customer.name}</p>
          <div className="mt-2 space-y-0.5 text-sm text-black/65">
            {customer.phone ? <p>{customer.phone}</p> : null}
            {customer.email ? <p>{customer.email}</p> : null}
            {customer.addressLines?.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </div>
        <div className="sm:text-right">
          <p className="text-[0.65rem] uppercase tracking-[0.2em] text-black/40">Order details</p>
          <dl className="mt-2 space-y-1.5 text-sm">
            <div className="flex justify-between gap-4 sm:justify-end">
              <dt className="text-black/45">Order</dt>
              <dd className="font-medium">#{order.orderNumber}</dd>
            </div>
            {order.referenceId ? (
              <div className="flex justify-between gap-4 sm:justify-end">
                <dt className="text-black/45">Reference</dt>
                <dd className="font-mono text-xs">{order.referenceId}</dd>
              </div>
            ) : null}
            <div className="flex justify-between gap-4 sm:justify-end">
              <dt className="text-black/45">Job</dt>
              <dd className="max-w-[220px] text-right">{order.title}</dd>
            </div>
            <div className="flex justify-between gap-4 sm:justify-end">
              <dt className="text-black/45">Status</dt>
              <dd className="capitalize">{order.status.replace(/_/g, ' ')}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Line items */}
      <div className="px-6 py-6 sm:px-10">
        <p className="text-[0.65rem] uppercase tracking-[0.2em] text-black/40">Items & services</p>
        <table className="mt-4 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-black/15 text-[0.65rem] uppercase tracking-[0.14em] text-black/45">
              <th className="pb-2 pr-3 font-medium">Description</th>
              <th className="pb-2 pr-3 font-medium text-right">Qty</th>
            </tr>
          </thead>
          <tbody>
            {lineItems.length === 0 ? (
              <tr>
                <td className="py-4 text-black/50" colSpan={2}>
                  {order.title}
                </td>
              </tr>
            ) : (
              lineItems.map((item, idx) => (
                <tr key={`${item.name}-${idx}`} className="border-b border-black/8">
                  <td className="py-3 pr-3 align-top">
                    <p className="font-medium text-black/90">{item.name}</p>
                    {item.productTypeCode ? (
                      <p className="mt-0.5 text-xs text-black/40">{item.productTypeCode}</p>
                    ) : null}
                    {item.notes ? (
                      <p className="mt-1 text-xs leading-relaxed text-black/55">{item.notes}</p>
                    ) : null}
                  </td>
                  <td className="py-3 text-right align-top tabular-nums">{item.qty}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="border-t border-black/10 px-6 py-6 sm:px-10">
        <div className="ml-auto max-w-sm space-y-2 text-sm">
          <div className="flex justify-between gap-6">
            <span className="text-black/50">Total quoted</span>
            <span className="font-medium tabular-nums">
              {formatINR(paymentSummary.totalQuoted)}
            </span>
          </div>
          <div className="flex justify-between gap-6">
            <span className="text-black/50">Advance</span>
            <span className="tabular-nums">{formatINR(paymentSummary.advance)}</span>
          </div>
          <div className="flex justify-between gap-6">
            <span className="text-black/50">Total paid</span>
            <span className="tabular-nums">{formatINR(paymentSummary.totalPaid)}</span>
          </div>
          <div className="mt-2 flex justify-between gap-6 border-t border-black/15 pt-3">
            <span className="font-heading text-base">Balance due</span>
            <span className="font-heading text-xl tabular-nums text-[#8a6d2f]">
              {formatINR(paymentSummary.balance)}
            </span>
          </div>
        </div>
      </div>

      {/* Payment history */}
      <div className="border-t border-black/10 px-6 py-6 sm:px-10">
        <p className="text-[0.65rem] uppercase tracking-[0.2em] text-black/40">
          Payment history
        </p>
        {payments.length === 0 ? (
          <p className="mt-3 text-sm text-black/50">No payments recorded yet.</p>
        ) : (
          <table className="mt-4 w-full text-left text-sm">
            <thead>
              <tr className="border-b border-black/15 text-[0.65rem] uppercase tracking-[0.14em] text-black/45">
                <th className="pb-2 pr-3 font-medium">Date</th>
                <th className="pb-2 pr-3 font-medium">Method</th>
                <th className="pb-2 pr-3 font-medium">Reference</th>
                <th className="pb-2 font-medium text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-b border-black/8">
                  <td className="py-2.5 pr-3">{formatDate(p.paidAt)}</td>
                  <td className="py-2.5 pr-3 uppercase tracking-wide text-black/65">{p.method}</td>
                  <td className="py-2.5 pr-3 text-xs text-black/50">{p.reference || '—'}</td>
                  <td className="py-2.5 text-right tabular-nums">{formatINR(p.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {invoice.notes ? (
        <div className="border-t border-black/10 px-6 py-5 sm:px-10">
          <p className="text-[0.65rem] uppercase tracking-[0.2em] text-black/40">Notes</p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-black/70">
            {invoice.notes}
          </p>
        </div>
      ) : null}

      <footer className="border-t border-black/10 px-6 py-5 text-center sm:px-10">
        <p className="text-xs leading-relaxed text-black/45">
          {footerNote ||
            `Thank you for choosing ${studio.name}. For billing questions, contact the boutique in ${studio.location}.`}
        </p>
      </footer>
    </article>
  );
}
