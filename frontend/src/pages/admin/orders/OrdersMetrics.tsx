import { CountUp } from '@/components/motion/CountUp';
import { Icon } from '@/components/icons';
import type { OrdersMetricsData } from './types';

interface OrdersMetricsProps {
  metrics: OrdersMetricsData;
}

export function OrdersMetrics({ metrics }: OrdersMetricsProps) {
  const cards = [
    {
      label: 'Total Orders',
      value: metrics.total,
      icon: 'orders',
      sub: 'All registered studio commissions',
    },
    {
      label: 'In Production',
      value: metrics.inProduction,
      icon: 'stitching',
      sub: 'Cutting, stitching & maggam work',
      highlight: true,
    },
    {
      label: 'Rush / High Priority',
      value: metrics.rushOrders,
      icon: 'hot',
      sub: 'Expedited bridal delivery targets',
    },
    {
      label: 'Trial & Fittings',
      value: metrics.readyForTrial,
      icon: 'fitting',
      sub: 'Trial appointments scheduled',
    },
  ] as const;

  return (
    <div className="stagger-items grid grid-cols-2 gap-3 sm:grid-cols-4">
      {cards.map((c) => (
        <div
          key={c.label}
          className="rounded-xl border p-3.5 shadow-xs transition-colors bg-surface-raised border-line text-ink-raised"
        >
          <div className="flex items-center justify-between opacity-70">
            <span className="text-[11px] font-semibold uppercase tracking-wider">{c.label}</span>
            <span className="text-sm"><Icon name={c.icon} size={16} /></span>
          </div>
          <div className="mt-2 text-2xl font-bold font-heading tracking-tight text-inherit">
            {typeof c.value === 'number' ? <CountUp value={c.value} /> : c.value}
          </div>
          <div className="mt-1 text-[10px] opacity-50 truncate">{c.sub}</div>
        </div>
      ))}
    </div>
  );
}
