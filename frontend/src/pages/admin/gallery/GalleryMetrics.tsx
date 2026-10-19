import type { GalleryMetricsData } from './types';

interface GalleryMetricsProps {
  metrics: GalleryMetricsData;
}

export function GalleryMetrics({ metrics }: GalleryMetricsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <div
        className="rounded-xl border p-4 shadow-xs"
        style={{
          backgroundColor: 'var(--admin-card, #141b26)',
          borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.18))',
          color: 'var(--admin-card-text, var(--admin-text, #f3f4f6))',
        }}
      >
        <p className="text-[11px] font-medium opacity-60 uppercase tracking-wider">Total Media</p>
        <p className="mt-1 text-2xl font-bold tracking-tight text-inherit">{metrics.total}</p>
      </div>

      <div
        className="rounded-xl border p-4 shadow-xs"
        style={{
          backgroundColor: 'var(--admin-card, #141b26)',
          borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.18))',
          color: 'var(--admin-card-text, var(--admin-text, #f3f4f6))',
        }}
      >
        <p className="text-[11px] font-medium opacity-60 uppercase tracking-wider">Live / Published</p>
        <p className="mt-1 text-2xl font-bold tracking-tight text-emerald-500">{metrics.published}</p>
      </div>

      <div
        className="rounded-xl border p-4 shadow-xs"
        style={{
          backgroundColor: 'var(--admin-card, #141b26)',
          borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.18))',
          color: 'var(--admin-card-text, var(--admin-text, #f3f4f6))',
        }}
      >
        <p className="text-[11px] font-medium opacity-60 uppercase tracking-wider">Drafts</p>
        <p className="mt-1 text-2xl font-bold tracking-tight text-amber-500">{metrics.drafts}</p>
      </div>

      <div
        className="rounded-xl border p-4 shadow-xs"
        style={{
          backgroundColor: 'var(--admin-card, #141b26)',
          borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.18))',
          color: 'var(--admin-card-text, var(--admin-text, #f3f4f6))',
        }}
      >
        <p className="text-[11px] font-medium opacity-60 uppercase tracking-wider">Video Reels</p>
        <p className="mt-1 text-2xl font-bold tracking-tight text-[var(--admin-primary,#b59410)]">
          {metrics.videos}
        </p>
      </div>
    </div>
  );
}
