import { Icon } from '@/components/icons';
interface MeasurementsMetricsProps {
  totalCount: number;
  activeCount: number;
  pendingCount: number;
  archivedCount: number;
}

export function MeasurementsMetrics({
  totalCount,
  activeCount,
  pendingCount,
  archivedCount,
}: MeasurementsMetricsProps) {
  const cards = [
    {
      label: 'Total Fit Cards',
      value: totalCount,
      subtext: 'Client anatomical records',
      accent: 'text-brand',
      borderAccent: 'border-l-brand',
      icon: 'measurements',
    },
    {
      label: 'Active on Floor',
      value: activeCount,
      subtext: 'Approved for cutting & stitching',
      accent: 'text-emerald-400',
      borderAccent: 'border-l-emerald-500',
      icon: 'speed',
    },
    {
      label: 'Pending Tailor Check',
      value: pendingCount,
      subtext: 'Awaiting master review',
      accent: 'text-amber-400',
      borderAccent: 'border-l-amber-500',
      icon: 'waiting',
    },
    {
      label: 'Archived Histories',
      value: archivedCount,
      subtext: 'Past couture commissions',
      accent: 'text-purple-400',
      borderAccent: 'border-l-purple-500',
      icon: 'folder',
    },
  ] as const;

  return (
    <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
      {cards.map((c) => (
        <div
          key={c.label}
          className={`rounded-xl border border-l-4 p-4 shadow-xs transition hover:shadow-md ${c.borderAccent} bg-surface-raised border-line text-ink-raised`}
        >
          <div className="flex items-center justify-between text-xs opacity-65">
            <span className="font-semibold uppercase tracking-wider text-[10px]">{c.label}</span>
            <span className="text-base"><Icon name={c.icon} size={16} /></span>
          </div>
          <div className={`mt-2 font-heading text-2xl font-bold tracking-tight ${c.accent}`}>
            {c.value}
          </div>
          <p className="mt-1 text-[11px] opacity-60 truncate">{c.subtext}</p>
        </div>
      ))}
    </div>
  );
}
