import { CountUp } from '@/components/motion/CountUp';
import type { CustomersMetricsData } from './types';

interface CustomersMetricsProps {
  metrics: CustomersMetricsData;
}

export function CustomersMetrics({ metrics }: CustomersMetricsProps) {
  return (
    <div className="stagger-items grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div
        className="rounded-xl border p-4 shadow-xs bg-surface-raised border-line text-ink-raised"
      >
        <p className="text-[11px] font-medium opacity-70 uppercase tracking-wider">Client Registry</p>
        <p className="mt-1 text-2xl font-bold tracking-tight text-inherit"><CountUp value={metrics.total} /></p>
      </div>

      <div
        className="rounded-xl border p-4 shadow-xs bg-surface-raised border-line text-ink-raised"
      >
        <p className="text-[11px] font-medium opacity-70 uppercase tracking-wider">Portal Active</p>
        <p className="mt-1 text-2xl font-bold tracking-tight text-emerald-700"><CountUp value={metrics.portalActive} /></p>
      </div>

      <div
        className="rounded-xl border p-4 shadow-xs bg-surface-raised border-line text-ink-raised"
      >
        <p className="text-[11px] font-medium opacity-70 uppercase tracking-wider">Active Commissions</p>
        <p className="mt-1 text-2xl font-bold tracking-tight text-blue-500"><CountUp value={metrics.hasOpenOrders} /></p>
      </div>

      <div
        className="rounded-xl border p-4 shadow-xs bg-surface-raised border-line text-ink-raised"
      >
        <p className="text-[11px] font-medium opacity-70 uppercase tracking-wider">VIP / Repeat</p>
        <p className="mt-1 text-2xl font-bold tracking-tight text-brand-strong">
          <CountUp value={metrics.repeatClients} />
        </p>
      </div>
    </div>
  );
}
