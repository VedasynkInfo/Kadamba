import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { portalApi, type PortalDashboard } from '@/services/portal/portalService';
import { Spinner } from '@/components/ui';
import { usePortalNotifyOptional } from '@/hooks/usePortalNotifySocket';

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

function countdownLabel(iso?: string): string {
  if (!iso) return 'Not scheduled';
  const target = new Date(iso).getTime();
  const now = Date.now();
  const diff = target - now;
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (Number.isNaN(days)) return formatDate(iso);
  if (days < 0) return `${Math.abs(days)}d overdue · ${formatDate(iso)}`;
  if (days === 0) return `Today · ${formatDate(iso)}`;
  if (days === 1) return `Tomorrow · ${formatDate(iso)}`;
  return `${days} days · ${formatDate(iso)}`;
}

function formatINR(n: number) {
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
}

const statusLabel: Record<string, string> = {
  enquiry: 'Enquiry',
  confirmed: 'Confirmed',
  measurements: 'Measurements',
  cutting: 'Cutting',
  stitching: 'Stitching',
  embroidery_maggam: 'Embroidery',
  trial: 'Trial',
  finishing: 'Finishing',
  delivery: 'Delivered',
  cancelled: 'Cancelled',
  on_hold: 'On hold',
};

export default function PortalDashboardPage() {
  const [data, setData] = useState<PortalDashboard | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const notify = usePortalNotifyOptional();

  const load = useCallback(async () => {
    try {
      const dash = await portalApi.dashboard();
      setData(dash);
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!notify) return;
    return notify.onSoftRefresh((kinds) => {
      if (kinds.includes('dashboard') || kinds.includes('orders') || kinds.includes('chat')) {
        void load();
      }
    });
  }, [notify, load]);

  useEffect(() => {
    if (!notify?.refreshTick) return;
    void load();
  }, [notify?.refreshTick, load]);

  if (loading && !data) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" label="Loading dashboard" />
      </div>
    );
  }

  if ((error && !data) || !data) {
    return <p className="text-rose-300">{error || 'Unable to load dashboard'}</p>;
  }

  return (
    <div className="space-y-10">
      <section>
        <p className="text-[0.62rem] uppercase tracking-[0.35em] text-gold/75">Welcome</p>
        <h1 className="mt-2 font-heading text-3xl text-cream sm:text-4xl">{data.welcomeName}</h1>
        {data.referenceId ? (
          <p className="mt-2 font-mono text-sm text-gold/85">Ref {data.referenceId}</p>
        ) : null}
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { label: 'Active orders', value: String(data.activeOrderCount) },
          { label: 'Next trial', value: countdownLabel(data.nextTrialAt) },
          { label: 'Next delivery', value: countdownLabel(data.nextDeliveryAt) },
          {
            label: 'Outstanding balance',
            value: formatINR(data.outstandingBalance ?? 0),
          },
          {
            label: 'Unread chat',
            value: String(data.unreadChatCount),
          },
          {
            label: 'Pending fits',
            value: String(data.pendingMeasurementActions),
          },
        ].map((item) => (
          <div key={item.label} className="border border-gold/15 bg-black/30 px-4 py-5">
            <p className="text-[0.65rem] uppercase tracking-[0.2em] text-cream/45">{item.label}</p>
            <p className="mt-2 font-heading text-xl text-cream sm:text-2xl">{item.value}</p>
          </div>
        ))}
      </section>

      {data.unreadChatCount > 0 ? (
        <p className="border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          You have {data.unreadChatCount} unread message{data.unreadChatCount === 1 ? '' : 's'} from
          the boutique.{' '}
          <Link to="/portal/chat" className="underline">
            Open chat
          </Link>
        </p>
      ) : null}

      {data.pendingMeasurementActions > 0 ? (
        <p className="border border-gold/25 bg-gold/5 px-4 py-3 text-sm text-cream/85">
          {data.pendingMeasurementActions} measurement profile
          {data.pendingMeasurementActions === 1 ? '' : 's'} awaiting boutique approval.{' '}
          <Link to="/portal/measurements" className="underline text-gold">
            View measurements
          </Link>
        </p>
      ) : null}

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <h2 className="font-heading text-xl text-gold">Recent orders</h2>
          <Link to="/portal/orders" className="text-xs uppercase tracking-[0.18em] text-cream/55 hover:text-gold">
            View all
          </Link>
        </div>
        <ul className="divide-y divide-gold/10 border border-gold/15">
          {data.recentOrders.length === 0 ? (
            <li className="px-4 py-8 text-sm text-cream/50">No orders yet.</li>
          ) : (
            data.recentOrders.map((order) => (
              <li key={order.id}>
                <Link
                  to={`/portal/orders/${order.id}`}
                  className="flex flex-wrap items-center justify-between gap-2 px-4 py-4 transition hover:bg-white/5"
                >
                  <div>
                    <p className="text-cream">{order.title}</p>
                    <p className="mt-0.5 font-mono text-[0.7rem] text-cream/45">
                      {order.referenceId || `#${order.orderNumber}`}
                    </p>
                    {order.statusNextHint ? (
                      <p className="mt-1 max-w-md text-xs text-cream/50">{order.statusNextHint}</p>
                    ) : null}
                  </div>
                  <span className="rounded-sm border border-gold/25 px-2 py-1 text-[0.65rem] uppercase tracking-[0.14em] text-gold/90">
                    {statusLabel[order.status] || order.status}
                  </span>
                </Link>
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="flex flex-wrap gap-3">
        {[
          { to: '/portal/orders', label: 'Orders' },
          { to: '/portal/measurements', label: 'Measurements' },
          { to: '/portal/chat', label: 'Chat' },
          { to: '/portal/requests', label: 'New request' },
        ].map((a) => (
          <Link
            key={a.to}
            to={a.to}
            className="rounded-sm border border-gold/30 px-4 py-2 text-xs uppercase tracking-[0.16em] text-gold transition hover:bg-gold/10"
          >
            {a.label}
          </Link>
        ))}
      </section>
    </div>
  );
}
