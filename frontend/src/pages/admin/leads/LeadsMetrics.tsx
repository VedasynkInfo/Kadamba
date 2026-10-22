import { CountUp } from '@/components/motion/CountUp';
import { Icon } from '@/components/icons';
import type { LeadsMetricsData } from './types';

interface LeadsMetricsProps {
  metrics: LeadsMetricsData;
}

export function LeadsMetrics({ metrics }: LeadsMetricsProps) {
  return (
    <div className="stagger-items grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div
        className="rounded-xl border p-4 shadow-xs bg-surface-raised border-line text-ink-raised"
      >
        <p className="text-[11px] font-medium opacity-70 uppercase tracking-wider">Total Enquiries</p>
        <p className="mt-1 text-2xl font-bold tracking-tight text-inherit"><CountUp value={metrics.total} /></p>
      </div>

      <div
        className="rounded-xl border p-4 shadow-xs bg-surface-raised border-line text-ink-raised"
      >
        <p className="text-[11px] font-medium opacity-70 uppercase tracking-wider">Active Pipeline</p>
        <p className="mt-1 text-2xl font-bold tracking-tight text-blue-500"><CountUp value={metrics.open} /></p>
      </div>

      <div
        className="rounded-xl border p-4 shadow-xs bg-surface-raised border-line text-ink-raised"
      >
        <p className="text-[11px] font-medium opacity-70 uppercase tracking-wider">Consultations</p>
        <p className="mt-1 text-2xl font-bold tracking-tight text-amber-500"><CountUp value={metrics.appointments} /></p>
      </div>

      <div
        className="rounded-xl border p-4 shadow-xs bg-surface-raised border-line text-ink-raised"
      >
        <p className="text-[11px] font-medium opacity-70 uppercase tracking-wider">Hot Quality <Icon name="hot" size={14} className="mr-1 inline align-middle" /> </p>
        <p className="mt-1 text-2xl font-bold tracking-tight text-rose-500">
          <CountUp value={metrics.hotLeads} />
        </p>
      </div>
    </div>
  );
}
