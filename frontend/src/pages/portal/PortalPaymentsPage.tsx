import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { portalApi } from '@/services/portal/portalService';
import { Spinner } from '@/components/ui';
import { cn } from '@/utils/cn';

function formatINR(v: number) {
  return `₹${v.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function billLabel(status?: string) {
  switch (status) {
    case 'paid':
      return 'Paid';
    case 'partial':
      return 'Partial';
    case 'unpaid':
      return 'Due';
    case 'unquoted':
      return 'Quote pending';
    default:
      return 'Invoice';
  }
}

function billTone(status?: string) {
  switch (status) {
    case 'paid':
      return 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200';
    case 'partial':
      return 'border-amber-400/40 bg-amber-500/10 text-amber-100';
    case 'unpaid':
      return 'border-rose-400/40 bg-rose-500/10 text-rose-200';
    default:
      return 'border-cream/20 bg-white/5 text-cream/70';
  }
}

export default function PortalPaymentsPage() {
  const [data, setData] = useState<Awaited<ReturnType<typeof portalApi.payments>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await portalApi.payments();
        if (!cancelled) setData(res);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner label="Loading payments" />
      </div>
    );
  }
  if (error || !data) return <p className="text-rose-300">{error || 'Unable to load'}</p>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl text-cream">Payments & invoices</h1>
        <p className="mt-2 text-sm text-cream/55">
          Open any invoice for a full billing document — quoted amount, payments, and balance.
        </p>
      </div>

      <div className="border border-gold/20 bg-black/30 px-5 py-6">
        <p className="text-[0.65rem] uppercase tracking-[0.2em] text-cream/45">Outstanding balance</p>
        <p className="mt-2 font-heading text-3xl text-gold">{formatINR(data.outstandingBalance)}</p>
      </div>

      <section>
        <h2 className="font-heading text-xl text-gold">Your invoices</h2>
        <ul className="mt-4 divide-y divide-gold/10 border border-gold/15">
          {data.invoices.length === 0 ? (
            <li className="px-4 py-8 text-sm text-cream/50">
              No invoice until your order is quoted by the boutique. Once pricing is set, invoices
              appear here.
            </li>
          ) : (
            data.invoices.map((inv) => (
              <li key={inv.orderId} className="px-4 py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-heading text-lg text-cream">
                      {inv.invoiceNumber || `Order #${inv.orderNumber}`}
                    </p>
                    <p className="mt-0.5 text-sm text-cream/70">{inv.title}</p>
                    <p className="mt-1 font-mono text-[0.7rem] text-cream/40">
                      {inv.referenceId
                        ? inv.referenceId
                        : inv.orderNumber
                          ? `Order #${inv.orderNumber}`
                          : inv.orderId}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={cn(
                        'inline-block border px-2 py-0.5 text-[0.6rem] uppercase tracking-[0.14em]',
                        billTone(inv.billStatus),
                      )}
                    >
                      {billLabel(inv.billStatus)}
                    </span>
                    <p className="mt-2 text-sm text-cream/80">
                      Quoted {formatINR(inv.paymentSummary.totalQuoted)}
                    </p>
                    <p className="text-sm text-cream/80">
                      Paid {formatINR(inv.paymentSummary.totalPaid)}
                    </p>
                    <p className="text-sm text-gold">
                      Balance {formatINR(inv.paymentSummary.balance)}
                    </p>
                    <Link
                      to={`/portal/invoices/${inv.orderId}`}
                      className="mt-3 inline-block text-xs uppercase tracking-[0.16em] text-gold hover:underline"
                    >
                      View invoice →
                    </Link>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </section>

      <section>
        <h2 className="font-heading text-xl text-gold">Payment history</h2>
        <ul className="mt-4 divide-y divide-gold/10 border border-gold/15">
          {data.payments.length === 0 ? (
            <li className="px-4 py-8 text-sm text-cream/50">No payments recorded yet.</li>
          ) : (
            data.payments.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"
              >
                <div>
                  <p className="text-cream">{formatINR(p.amount)}</p>
                  <p className="text-[0.7rem] text-cream/45">
                    {p.orderTitle || p.referenceId || (p.orderNumber ? `#${p.orderNumber}` : '')} ·{' '}
                    {p.method}
                    {p.reference ? ` · ${p.reference}` : ''}
                  </p>
                  {p.orderId ? (
                    <Link
                      to={`/portal/invoices/${p.orderId}`}
                      className="mt-1 inline-block text-[0.65rem] uppercase tracking-[0.14em] text-gold/80 hover:text-gold"
                    >
                      Open invoice
                    </Link>
                  ) : null}
                </div>
                <p className="text-cream/55">
                  {new Date(p.paidAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
