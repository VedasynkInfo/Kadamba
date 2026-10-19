import { CountUp } from '@/components/motion/CountUp';
import type { ServicesMetricsData } from './types';

interface ServicesMetricsProps {
  metrics: ServicesMetricsData;
}

export function ServicesMetrics({ metrics }: ServicesMetricsProps) {
  return (
    <div className="stagger-items grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div
        className="rounded-xl border p-4 shadow-xs bg-surface-raised border-line text-ink-raised"
      >
        <p className="text-[11px] font-medium opacity-60 uppercase tracking-wider">Total Services</p>
        <p className="mt-1 text-2xl font-bold tracking-tight text-inherit"><CountUp value={metrics.total} /></p>
      </div>

      <div
        className="rounded-xl border p-4 shadow-xs bg-surface-raised border-line text-ink-raised"
      >
        <p className="text-[11px] font-medium opacity-60 uppercase tracking-wider">Live Offerings</p>
        <p className="mt-1 text-2xl font-bold tracking-tight text-emerald-500"><CountUp value={metrics.published} /></p>
      </div>

      <div
        className="rounded-xl border p-4 shadow-xs bg-surface-raised border-line text-ink-raised"
      >
        <p className="text-[11px] font-medium opacity-60 uppercase tracking-wider">Drafts</p>
        <p className="mt-1 text-2xl font-bold tracking-tight text-amber-500"><CountUp value={metrics.drafts} /></p>
      </div>

      <div
        className="rounded-xl border p-4 shadow-xs bg-surface-raised border-line text-ink-raised"
      >
        <p className="text-[11px] font-medium opacity-60 uppercase tracking-wider">Catalog Linked</p>
        <p className="mt-1 text-2xl font-bold tracking-tight text-brand">
          <CountUp value={metrics.fulfillable} />
        </p>
      </div>
    </div>
  );
}
