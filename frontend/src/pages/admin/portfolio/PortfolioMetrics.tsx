import type { PortfolioMetricsData } from './types';

interface PortfolioMetricsProps {
  metrics: PortfolioMetricsData;
}

export function PortfolioMetrics({ metrics }: PortfolioMetricsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div
        className="rounded-xl border p-4 shadow-xs bg-surface-raised border-line text-ink-raised"
      >
        <p className="text-[11px] font-medium opacity-60 uppercase tracking-wider">Total Projects</p>
        <p className="mt-1 text-2xl font-bold tracking-tight text-inherit">{metrics.total}</p>
      </div>

      <div
        className="rounded-xl border p-4 shadow-xs bg-surface-raised border-line text-ink-raised"
      >
        <p className="text-[11px] font-medium opacity-60 uppercase tracking-wider">Published Exhibits</p>
        <p className="mt-1 text-2xl font-bold tracking-tight text-emerald-500">{metrics.published}</p>
      </div>

      <div
        className="rounded-xl border p-4 shadow-xs bg-surface-raised border-line text-ink-raised"
      >
        <p className="text-[11px] font-medium opacity-60 uppercase tracking-wider">Drafts</p>
        <p className="mt-1 text-2xl font-bold tracking-tight text-amber-500">{metrics.drafts}</p>
      </div>

      <div
        className="rounded-xl border p-4 shadow-xs bg-surface-raised border-line text-ink-raised"
      >
        <p className="text-[11px] font-medium opacity-60 uppercase tracking-wider">Client Stories</p>
        <p className="mt-1 text-2xl font-bold tracking-tight text-brand">
          {metrics.clientStories}
        </p>
      </div>
    </div>
  );
}
