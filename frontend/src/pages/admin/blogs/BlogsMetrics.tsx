import { CountUp } from '@/components/motion/CountUp';
import type { BlogsMetricsData } from './types';

interface BlogsMetricsProps {
  metrics: BlogsMetricsData;
}

export function BlogsMetrics({ metrics }: BlogsMetricsProps) {
  return (
    <div className="stagger-items grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div
        className="rounded-xl border p-4 shadow-xs bg-surface-raised border-line text-ink-raised"
      >
        <p className="text-[11px] font-medium opacity-70 uppercase tracking-wider">Total Articles</p>
        <p className="mt-1 text-2xl font-bold tracking-tight text-inherit"><CountUp value={metrics.total} /></p>
      </div>

      <div
        className="rounded-xl border p-4 shadow-xs bg-surface-raised border-line text-ink-raised"
      >
        <p className="text-[11px] font-medium opacity-70 uppercase tracking-wider">Published Live</p>
        <p className="mt-1 text-2xl font-bold tracking-tight text-emerald-700"><CountUp value={metrics.published} /></p>
      </div>

      <div
        className="rounded-xl border p-4 shadow-xs bg-surface-raised border-line text-ink-raised"
      >
        <p className="text-[11px] font-medium opacity-70 uppercase tracking-wider">Drafts</p>
        <p className="mt-1 text-2xl font-bold tracking-tight text-amber-500"><CountUp value={metrics.drafts} /></p>
      </div>

      <div
        className="rounded-xl border p-4 shadow-xs bg-surface-raised border-line text-ink-raised"
      >
        <p className="text-[11px] font-medium opacity-70 uppercase tracking-wider">Featured Stories</p>
        <p className="mt-1 text-2xl font-bold tracking-tight text-brand-strong">
          <CountUp value={metrics.featured} />
        </p>
      </div>
    </div>
  );
}
