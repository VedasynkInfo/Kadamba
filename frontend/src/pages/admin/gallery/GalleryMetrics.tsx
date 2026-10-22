import { CountUp } from '@/components/motion/CountUp';
import type { GalleryMetricsData } from './types';

interface GalleryMetricsProps {
  metrics: GalleryMetricsData;
}

export function GalleryMetrics({ metrics }: GalleryMetricsProps) {
  return (
    <div className="stagger-items grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div
        className="rounded-xl border p-4 shadow-xs bg-surface-raised border-line text-ink-raised"
      >
        <p className="text-[11px] font-medium opacity-70 uppercase tracking-wider">Total Media</p>
        <p className="mt-1 text-2xl font-bold tracking-tight text-inherit"><CountUp value={metrics.total} /></p>
      </div>

      <div
        className="rounded-xl border p-4 shadow-xs bg-surface-raised border-line text-ink-raised"
      >
        <p className="text-[11px] font-medium opacity-70 uppercase tracking-wider">Live / Published</p>
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
        <p className="text-[11px] font-medium opacity-70 uppercase tracking-wider">Video Reels</p>
        <p className="mt-1 text-2xl font-bold tracking-tight text-brand-strong">
          <CountUp value={metrics.videos} />
        </p>
      </div>
    </div>
  );
}
