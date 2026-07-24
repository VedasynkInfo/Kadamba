import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Spinner } from '@/components/ui';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { portalApi, type PortalOrder } from '@/services/portal/portalService';
import { cn } from '@/utils/cn';

const STATUS_FLOW = [
  'enquiry',
  'confirmed',
  'measurements',
  'cutting',
  'stitching',
  'embroidery_maggam',
  'trial',
  'finishing',
  'delivery',
] as const;

const statusLabel: Record<string, string> = {
  enquiry: 'Enquiry',
  confirmed: 'Confirmed',
  measurements: 'Measurements',
  cutting: 'Cutting',
  stitching: 'Stitching',
  embroidery_maggam: 'Embroidery / Maggam',
  trial: 'Trial',
  finishing: 'Finishing',
  delivery: 'Delivered',
  cancelled: 'Cancelled',
  on_hold: 'On hold',
};

const whatHappensNext: Record<string, string> = {
  enquiry: 'The boutique is reviewing your request. You will get a confirmation and Reference ID next.',
  confirmed: 'Share or confirm measurements so cutting can begin.',
  measurements: 'Workshop is preparing your piece — cutting comes next.',
  cutting: 'Fabric is cut. Stitching will begin shortly.',
  stitching: 'Your garment is on the sewing floor. Embroidery or trial follows.',
  embroidery_maggam: 'Handwork is in progress. A trial date will be shared when ready.',
  trial: 'Come for your trial fitting — finishing adjustments follow.',
  finishing: 'Final finishing is underway. Delivery is next.',
  delivery: 'Your order is complete. Enjoy your look!',
  on_hold: 'This order is paused. Chat with the boutique if you have questions.',
  cancelled: 'This order was cancelled. Reach out on chat if you need help starting again.',
};

function formatDate(iso?: string) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

function formatDateTime(iso?: string) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

function inr(n: number) {
  return `₹${n.toLocaleString('en-IN')}`;
}

export default function PortalOrdersPage() {
  const [orders, setOrders] = useState<PortalOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await portalApi.orders();
        if (!cancelled) setOrders(data);
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
        <Spinner label="Loading orders" />
      </div>
    );
  }

  if (error) return <p className="text-rose-300">{error}</p>;

  return (
    <div>
      <h1 className="font-heading text-3xl text-cream">Your orders</h1>
      <p className="mt-2 text-sm text-cream/55">Current and previous boutique work.</p>
      <ul className="mt-8 divide-y divide-gold/10 border border-gold/15">
        {orders.length === 0 ? (
          <li className="px-4 py-10 text-sm text-cream/50">No orders yet.</li>
        ) : (
          orders.map((order) => (
            <li key={order.id}>
              <Link
                to={`/portal/orders/${order.id}`}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-5 transition hover:bg-white/5"
              >
                <div>
                  <p className="text-cream">{order.title}</p>
                  <p className="mt-1 text-xs text-cream/45">
                    {order.referenceId || `Order #${order.orderNumber}`} · Trial{' '}
                    {formatDate(order.expectedTrialAt)} · Delivery{' '}
                    {formatDate(order.expectedDeliveryAt)}
                  </p>
                </div>
                <span className="rounded-sm border border-gold/25 px-2 py-1 text-[0.65rem] uppercase tracking-[0.14em] text-gold/90">
                  {statusLabel[order.status] || order.status}
                </span>
              </Link>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

export function PortalOrderDetailPage() {
  const { id } = useParams();
  const reduced = usePrefersReducedMotion();
  const [order, setOrder] = useState<PortalOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await portalApi.order(id);
        if (!cancelled) setOrder(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const progress = useMemo(() => {
    if (!order) return { index: -1, pct: 0 };
    if (order.status === 'cancelled') return { index: -1, pct: 0 };
    if (order.status === 'on_hold') {
      const idx = STATUS_FLOW.indexOf(
        (order.timeline[order.timeline.length - 1]?.status as (typeof STATUS_FLOW)[number]) ||
          'enquiry',
      );
      return { index: Math.max(idx, 0), pct: Math.max((idx / (STATUS_FLOW.length - 1)) * 100, 8) };
    }
    const idx = STATUS_FLOW.indexOf(order.status as (typeof STATUS_FLOW)[number]);
    if (idx < 0) return { index: 0, pct: 8 };
    return { index: idx, pct: (idx / (STATUS_FLOW.length - 1)) * 100 };
  }, [order]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner label="Loading order" />
      </div>
    );
  }
  if (error || !order) return <p className="text-rose-300">{error || 'Order not found'}</p>;

  const paidPct =
    order.paymentSummary.totalQuoted > 0
      ? Math.min(
          100,
          Math.round((order.paymentSummary.totalPaid / order.paymentSummary.totalQuoted) * 100),
        )
      : 0;

  return (
    <motion.div
      initial={reduced ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      <div>
        <Link
          to="/portal/orders"
          className="text-xs uppercase tracking-[0.18em] text-cream/50 hover:text-gold"
        >
          ← Orders
        </Link>

        <div className="mt-4 overflow-hidden border border-gold/20 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,215,0,0.1),_transparent_50%),_#0c0a08] p-5 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[0.62rem] uppercase tracking-[0.3em] text-gold/75">Order detail</p>
              <h1 className="mt-2 font-heading text-3xl text-cream sm:text-4xl">{order.title}</h1>
              <p className="mt-2 font-mono text-sm text-gold/85">
                {order.referenceId || `Order #${order.orderNumber}`}
              </p>
              {order.createdAt ? (
                <p className="mt-1 text-xs text-cream/40">Placed {formatDate(order.createdAt)}</p>
              ) : null}
            </div>
            <span
              className={cn(
                'rounded-sm border px-3 py-1.5 text-[0.65rem] uppercase tracking-[0.16em]',
                order.status === 'cancelled'
                  ? 'border-rose-400/40 text-rose-200'
                  : order.status === 'delivery'
                    ? 'border-emerald-400/40 text-emerald-200'
                    : 'border-gold/35 text-gold',
              )}
            >
              {statusLabel[order.status] || order.status}
            </span>
          </div>

          {(order.statusNextHint || whatHappensNext[order.status]) ? (
            <p className="mt-5 border-t border-gold/15 pt-4 text-sm text-cream/70">
              <span className="text-[0.65rem] uppercase tracking-[0.16em] text-gold/70">
                What happens next
              </span>
              <span className="mt-1.5 block">
                {order.statusNextHint || whatHappensNext[order.status]}
              </span>
            </p>
          ) : null}

          {order.status !== 'cancelled' ? (
            <div className="mt-8">
              <div className="mb-3 flex items-center justify-between text-[0.65rem] uppercase tracking-[0.16em] text-cream/45">
                <span>Workshop progress</span>
                <span>{Math.round(progress.pct)}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-gold/70 to-gold"
                  style={{ width: `${progress.pct}%` }}
                />
              </div>
              <ol className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-9">
                {STATUS_FLOW.map((step, i) => {
                  const done = i <= progress.index;
                  const current = i === progress.index;
                  return (
                    <li
                      key={step}
                      className={cn(
                        'rounded-sm border px-1.5 py-2 text-center',
                        current
                          ? 'border-gold bg-gold/15 text-gold'
                          : done
                            ? 'border-gold/25 text-cream/80'
                            : 'border-white/5 text-cream/30',
                      )}
                    >
                      <p className="text-[0.55rem] uppercase leading-tight tracking-[0.08em]">
                        {statusLabel[step]}
                      </p>
                    </li>
                  );
                })}
              </ol>
            </div>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="border border-gold/15 bg-black/30 px-4 py-4">
          <p className="text-[0.65rem] uppercase tracking-[0.16em] text-cream/40">Trial</p>
          <p className="mt-2 font-heading text-xl text-cream">
            {formatDate(order.expectedTrialAt)}
          </p>
          {order.actualTrialAt ? (
            <p className="mt-1 text-xs text-emerald-200/80">
              Completed {formatDate(order.actualTrialAt)}
            </p>
          ) : (
            <p className="mt-1 text-xs text-cream/40">Scheduled / expected</p>
          )}
        </div>
        <div className="border border-gold/15 bg-black/30 px-4 py-4">
          <p className="text-[0.65rem] uppercase tracking-[0.16em] text-cream/40">Delivery</p>
          <p className="mt-2 font-heading text-xl text-cream">
            {formatDate(order.expectedDeliveryAt)}
          </p>
          {order.actualDeliveryAt ? (
            <p className="mt-1 text-xs text-emerald-200/80">
              Delivered {formatDate(order.actualDeliveryAt)}
            </p>
          ) : (
            <p className="mt-1 text-xs text-cream/40">Target date</p>
          )}
        </div>
        <div className="border border-gold/15 bg-black/30 px-4 py-4">
          <p className="text-[0.65rem] uppercase tracking-[0.16em] text-cream/40">Balance due</p>
          <p className="mt-2 font-heading text-xl text-gold">
            {inr(order.paymentSummary.balance)}
          </p>
          <p className="mt-1 text-xs text-cream/40">{paidPct}% paid of quote</p>
        </div>
      </div>

      <section className="border border-gold/15 bg-black/20 p-5">
        <h2 className="font-heading text-xl text-gold">Garments & items</h2>
        <ul className="mt-4 space-y-3">
          {order.lineItems.map((item, i) => (
            <li
              key={`${item.name}-${i}`}
              className="flex flex-wrap items-start justify-between gap-3 border border-gold/10 bg-black/30 px-4 py-3"
            >
              <div>
                <p className="text-cream">
                  <span className="mr-2 font-mono text-gold/70">{item.qty}×</span>
                  {item.name}
                </p>
                {item.productTypeCode ? (
                  <p className="mt-1 font-mono text-[0.7rem] text-cream/40">
                    {item.productTypeCode}
                  </p>
                ) : null}
                {item.notes ? <p className="mt-1 text-sm text-cream/55">{item.notes}</p> : null}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="border border-gold/15 bg-black/20 p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-heading text-xl text-gold">Payments</h2>
          <div className="flex flex-wrap gap-3">
            <Link
              to={`/portal/invoices/${order.id}`}
              className="text-xs uppercase tracking-[0.16em] text-gold hover:underline"
            >
              View invoice →
            </Link>
            <Link
              to="/portal/payments"
              className="text-xs uppercase tracking-[0.16em] text-cream/45 hover:text-gold"
            >
              All invoices →
            </Link>
          </div>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full bg-gold/80" style={{ width: `${paidPct}%` }} />
        </div>
        <dl className="mt-5 grid gap-3 sm:grid-cols-4">
          {[
            { label: 'Quoted', value: inr(order.paymentSummary.totalQuoted) },
            { label: 'Advance', value: inr(order.paymentSummary.advance) },
            { label: 'Paid', value: inr(order.paymentSummary.totalPaid) },
            { label: 'Balance', value: inr(order.paymentSummary.balance) },
          ].map((row) => (
            <div key={row.label} className="border border-gold/10 px-3 py-3">
              <dt className="text-[0.65rem] uppercase tracking-[0.14em] text-cream/40">
                {row.label}
              </dt>
              <dd className="mt-1 text-cream">{row.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="border border-gold/15 bg-black/20 p-5">
        <h2 className="font-heading text-xl text-gold">Status timeline</h2>
        <ol className="relative mt-6 space-y-0 border-l border-gold/25 pl-6">
          {[...order.timeline].reverse().map((t, i) => (
            <li key={`${t.status}-${t.at}-${i}`} className="relative pb-6 last:pb-0">
              <span
                className={cn(
                  'absolute -left-[1.55rem] top-1 h-2.5 w-2.5 rounded-full border',
                  i === 0 ? 'border-gold bg-gold' : 'border-gold/40 bg-black',
                )}
              />
              <p className="text-cream">{statusLabel[t.status] || t.status}</p>
              {t.note ? <p className="mt-1 text-sm text-cream/55">{t.note}</p> : null}
              <p className="mt-1 text-[0.7rem] text-cream/35">{formatDateTime(t.at)}</p>
            </li>
          ))}
        </ol>
      </section>

      {order.notes.length > 0 ? (
        <section className="border border-gold/15 bg-black/20 p-5">
          <h2 className="font-heading text-xl text-gold">Notes for you</h2>
          <ul className="mt-4 space-y-2">
            {order.notes.map((n, i) => (
              <li key={i} className="border border-gold/10 bg-black/30 px-4 py-3 text-sm text-cream/80">
                <p>{n.body}</p>
                {n.createdAt ? (
                  <p className="mt-2 text-[0.7rem] text-cream/35">{formatDateTime(n.createdAt)}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Link
          to="/portal/chat"
          className="rounded-sm border border-gold/35 bg-gold/10 px-4 py-2.5 text-xs uppercase tracking-[0.16em] text-gold transition hover:bg-gold/20"
        >
          Message boutique
        </Link>
        <Link
          to="/portal/measurements"
          className="rounded-sm border border-gold/25 px-4 py-2.5 text-xs uppercase tracking-[0.16em] text-cream/70 transition hover:border-gold/50 hover:text-gold"
        >
          Measurements
        </Link>
        <Link
          to="/portal/payments"
          className="rounded-sm border border-gold/25 px-4 py-2.5 text-xs uppercase tracking-[0.16em] text-cream/70 transition hover:border-gold/50 hover:text-gold"
        >
          Payments
        </Link>
      </div>
    </motion.div>
  );
}
