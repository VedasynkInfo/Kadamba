import type { LeadsMetricsData } from './types';

interface LeadsMetricsProps {
  metrics: LeadsMetricsData;
}

export function LeadsMetrics({ metrics }: LeadsMetricsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div
        className="rounded-xl border p-4 shadow-xs bg-surface-raised border-line text-ink-raised"
      >
        <p className="text-[11px] font-medium opacity-60 uppercase tracking-wider">Total Enquiries</p>
        <p className="mt-1 text-2xl font-bold tracking-tight text-inherit">{metrics.total}</p>
      </div>

      <div
        className="rounded-xl border p-4 shadow-xs bg-surface-raised border-line text-ink-raised"
      >
        <p className="text-[11px] font-medium opacity-60 uppercase tracking-wider">Active Pipeline</p>
        <p className="mt-1 text-2xl font-bold tracking-tight text-blue-500">{metrics.open}</p>
      </div>

      <div
        className="rounded-xl border p-4 shadow-xs bg-surface-raised border-line text-ink-raised"
      >
        <p className="text-[11px] font-medium opacity-60 uppercase tracking-wider">Consultations</p>
        <p className="mt-1 text-2xl font-bold tracking-tight text-amber-500">{metrics.appointments}</p>
      </div>

      <div
        className="rounded-xl border p-4 shadow-xs bg-surface-raised border-line text-ink-raised"
      >
        <p className="text-[11px] font-medium opacity-60 uppercase tracking-wider">Hot Quality 🔥</p>
        <p className="mt-1 text-2xl font-bold tracking-tight text-rose-500">
          {metrics.hotLeads}
        </p>
      </div>
    </div>
  );
}
