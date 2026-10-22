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
      return 'border-emerald-700/30 bg-emerald-50 text-emerald-900';
    case 'partial':
      return 'border-amber-700/30 bg-amber-50 text-amber-950';
    case 'unpaid':
      return 'border-rose-700/30 bg-rose-50 text-rose-900';
    default:
      return 'border-stone-400/40 bg-stone-50 text-stone-700';
  }
}

interface InvoiceDocumentProps {
  invoice: InvoiceDocumentData;
  className?: string;
  /** Extra footer note under the document */
  footerNote?: string;
}

/**
 * The invoice.
 *
 * A bill is a document, not a screen — it is printed, emailed and filed, and
 * it has to read the same on paper as it does on a monitor. Three decisions
 * follow from that:
 *
 *  - **The money is the page.** The three figures that matter — quoted, paid,
 *    balance — are a strip across the top, before anything else, so the
 *    person paying reads the number they came for in one glance and can stop
 *    there.
 *  - **The masthead is the studio.** A boutique's bill is part of its work,
 *    so the name is set in the display face with the gold rule under it,
 *    rather than as one line among several.
 *  - **It prints.** The paper rules live in `index.css` (`.invoice-paper`),
 *    with the margins, the repeating table header and the rule that keeps a
 *    row from splitting across a page.
 */
export function InvoiceDocument({ invoice, className, footerNote }: InvoiceDocumentProps) {
  const { studio, customer, order, lineItems, paymentSummary, payments } = invoice;

  const quoted = paymentSummary.totalQuoted;
  const paid = paymentSummary.totalPaid;
  const balance = paymentSummary.balance;
  const settled = quoted > 0 ? Math.min(100, Math.round((paid / quoted) * 100)) : 0;

  return (
    <article
      className={cn(
        'invoice-paper invoice-document mx-auto w-full max-w-[820px] bg-surface-raised text-ink shadow-sm',
        'border border-line print:max-w-none print:border-0 print:shadow-none',
        className,
      )}
    >
      {/* Masthead */}
      <header className="px-6 pt-8 sm:px-10 sm:pt-10">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="min-w-0">
            <p className="text-[0.6rem] uppercase tracking-[0.34em] text-brand-strong">
              Boutique &amp; custom tailoring
            </p>
            <p className="mt-2 font-heading text-3xl leading-tight tracking-tight text-ink sm:text-4xl">
              {studio.name}
            </p>
            <div className="mt-4 space-y-0.5 text-[0.78rem] leading-relaxed text-ink/70">
              {studio.addressLines?.map((line) => (
                <p key={line}>{line}</p>
              ))}
              <p>
                {studio.phone}
                {studio.email ? ` · ${studio.email}` : ''}
              </p>
            </div>
          </div>

          <div className="shrink-0 text-right">
            <p className="font-heading text-[0.62rem] uppercase tracking-[0.34em] text-ink/70">
              Invoice
            </p>
            <p className="mt-1.5 font-heading text-2xl tabular-nums text-ink sm:text-[1.75rem]">
              {invoice.invoiceNumber}
            </p>
            <p className="mt-2 text-[0.78rem] text-ink/70">{formatDate(invoice.invoiceDate)}</p>
            <span
              className={cn(
                'mt-3 inline-block border px-2.5 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.16em]',
                billTone(invoice.billStatus),
              )}
            >
              {billLabel(invoice.billStatus)}
            </span>
          </div>
        </div>

        <div className="mt-7 h-[3px] w-full bg-brand" aria-hidden />
      </header>

      {/* The figures */}
      <section
        aria-label="Amounts"
        className="grid grid-cols-1 divide-y divide-line border-b border-line sm:grid-cols-3 sm:divide-x sm:divide-y-0"
      >
        <div className="px-6 py-5 sm:px-10">
          <p className="text-[0.6rem] uppercase tracking-[0.22em] text-ink/70">Quoted</p>
          <p className="mt-1.5 font-heading text-2xl tabular-nums text-ink">
            {formatINR(quoted)}
          </p>
        </div>
        <div className="px-6 py-5 sm:px-10">
          <p className="text-[0.6rem] uppercase tracking-[0.22em] text-ink/70">Paid</p>
          <p className="mt-1.5 font-heading text-2xl tabular-nums text-ink">
            {formatINR(paid)}
          </p>
        </div>
        <div className="bg-surface-sunken px-6 py-5 sm:px-10">
          <p className="text-[0.6rem] uppercase tracking-[0.22em] text-ink/70">Balance due</p>
          <p className="mt-1.5 font-heading text-2xl tabular-nums text-brand-strong">
            {formatINR(balance)}
          </p>
        </div>
      </section>

      {/* How far along the payment is */}
      {quoted > 0 ? (
        <div className="border-b border-line px-6 py-4 sm:px-10">
          <div className="flex items-baseline justify-between gap-4">
            <p className="text-[0.6rem] uppercase tracking-[0.22em] text-ink/70">Settled</p>
            <p className="text-xs tabular-nums text-ink/70">{settled}%</p>
          </div>
          <div
            className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface-sunken"
            role="img"
            aria-label={`${settled} percent of the quoted amount has been paid`}
          >
            <div className="h-full rounded-full bg-brand" style={{ width: `${settled}%` }} />
          </div>
          {paymentSummary.advance > 0 ? (
            <p className="mt-2 text-[0.72rem] text-ink/70">
              Includes an advance of {formatINR(paymentSummary.advance)}.
            </p>
          ) : null}
        </div>
      ) : null}

      {/* Parties + meta */}
      <div className="grid gap-8 border-b border-line px-6 py-7 sm:grid-cols-2 sm:px-10">
        <div>
          <p className="text-[0.6rem] uppercase tracking-[0.22em] text-ink/70">Bill to</p>
          <p className="mt-2 font-heading text-xl text-ink">{customer.name}</p>
          <div className="mt-1.5 space-y-0.5 text-[0.8rem] leading-relaxed text-ink/70">
            {customer.phone ? <p>{customer.phone}</p> : null}
            {customer.email ? <p>{customer.email}</p> : null}
            {customer.addressLines?.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </div>
        <div className="sm:text-right">
          <p className="text-[0.6rem] uppercase tracking-[0.22em] text-ink/70">Order details</p>
          <dl className="mt-2 space-y-1.5 text-[0.8rem]">
            <div className="flex justify-between gap-4 sm:justify-end">
              <dt className="text-ink/70">Order</dt>
              <dd className="font-medium tabular-nums">#{order.orderNumber}</dd>
            </div>
            {order.referenceId ? (
              <div className="flex justify-between gap-4 sm:justify-end">
                <dt className="text-ink/70">Reference</dt>
                <dd className="font-mono text-xs">{order.referenceId}</dd>
              </div>
            ) : null}
            <div className="flex justify-between gap-4 sm:justify-end">
              <dt className="text-ink/70">Job</dt>
              <dd className="max-w-[220px] text-right">{order.title}</dd>
            </div>
            <div className="flex justify-between gap-4 sm:justify-end">
              <dt className="text-ink/70">Status</dt>
              <dd className="capitalize">{order.status.replace(/_/g, ' ')}</dd>
            </div>
            <div className="flex justify-between gap-4 sm:justify-end">
              <dt className="text-ink/70">Placed</dt>
              <dd className="tabular-nums">{formatDate(order.createdAt)}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Line items */}
      <div className="px-6 py-6 sm:px-10">
        <p className="text-[0.6rem] uppercase tracking-[0.22em] text-ink/70">Items &amp; services</p>
        <table className="mt-4 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-line text-[0.6rem] uppercase tracking-[0.16em] text-ink/70">
              <th scope="col" className="w-8 pb-2 pr-3 font-medium">
                <span className="sr-only">Number</span>
                #
              </th>
              <th scope="col" className="pb-2 pr-3 font-medium">
                Description
              </th>
              <th scope="col" className="pb-2 font-medium text-right">
                Qty
              </th>
            </tr>
          </thead>
          <tbody className="stagger-rows">
            {lineItems.length === 0 ? (
              <tr>
                <td className="py-4 text-ink/70" colSpan={3}>
                  {order.title}
                </td>
              </tr>
            ) : (
              lineItems.map((item, idx) => (
                <tr key={`${item.name}-${idx}`} className="border-b border-line/8">
                  <td className="py-3 pr-3 align-top tabular-nums text-ink/55">{idx + 1}</td>
                  <td className="py-3 pr-3 align-top">
                    <p className="font-medium text-ink">{item.name}</p>
                    {item.productTypeCode ? (
                      <p className="mt-0.5 text-xs text-ink/70">{item.productTypeCode}</p>
                    ) : null}
                    {item.notes ? (
                      <p className="mt-1 text-xs leading-relaxed text-ink/70">{item.notes}</p>
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
      <div className="border-t border-line px-6 py-6 sm:px-10">
        <div className="ml-auto max-w-sm space-y-2 text-sm">
          <div className="flex justify-between gap-6">
            <span className="text-ink/70">Total quoted</span>
            <span className="font-medium tabular-nums">{formatINR(quoted)}</span>
          </div>
          <div className="flex justify-between gap-6">
            <span className="text-ink/70">Advance</span>
            <span className="tabular-nums">{formatINR(paymentSummary.advance)}</span>
          </div>
          <div className="flex justify-between gap-6">
            <span className="text-ink/70">Total paid</span>
            <span className="tabular-nums">{formatINR(paid)}</span>
          </div>
          <div className="mt-3 flex justify-between gap-6 border-t border-line pt-3">
            <span className="font-heading text-base">Balance due</span>
            <span className="font-heading text-xl tabular-nums text-brand-strong">
              {formatINR(balance)}
            </span>
          </div>
        </div>
      </div>

      {/* Payment history */}
      <div className="border-t border-line px-6 py-6 sm:px-10">
        <p className="text-[0.6rem] uppercase tracking-[0.22em] text-ink/70">Payment history</p>
        {payments.length === 0 ? (
          <p className="mt-3 text-sm text-ink/70">No payments recorded yet.</p>
        ) : (
          <table className="mt-4 w-full text-left text-sm">
            <thead>
              <tr className="border-b border-line text-[0.6rem] uppercase tracking-[0.16em] text-ink/70">
                <th scope="col" className="pb-2 pr-3 font-medium">
                  Date
                </th>
                <th scope="col" className="pb-2 pr-3 font-medium">
                  Method
                </th>
                <th scope="col" className="pb-2 pr-3 font-medium">
                  Reference
                </th>
                <th scope="col" className="pb-2 font-medium text-right">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="stagger-rows">
              {payments.map((p) => (
                <tr key={p.id} className="border-b border-line/8">
                  <td className="py-2.5 pr-3 tabular-nums">{formatDate(p.paidAt)}</td>
                  <td className="py-2.5 pr-3 uppercase tracking-wide text-ink/70">{p.method}</td>
                  <td className="py-2.5 pr-3 text-xs text-ink/70">{p.reference || '—'}</td>
                  <td className="py-2.5 text-right tabular-nums">{formatINR(p.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {invoice.notes ? (
        <div className="border-t border-line px-6 py-5 sm:px-10">
          <p className="text-[0.6rem] uppercase tracking-[0.22em] text-ink/70">Notes</p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink/70">
            {invoice.notes}
          </p>
        </div>
      ) : null}

      <footer className="border-t border-line px-6 py-6 text-center sm:px-10">
        <p className="mx-auto max-w-md text-xs leading-relaxed text-ink/70">
          {footerNote ||
            `Thank you for choosing ${studio.name}. For billing questions, contact the boutique in ${studio.location}.`}
        </p>
        <p className="mt-3 text-[0.6rem] uppercase tracking-[0.24em] text-ink/55">
          {invoice.invoiceNumber} · {formatDate(invoice.invoiceDate)}
        </p>
      </footer>
    </article>
  );
}
