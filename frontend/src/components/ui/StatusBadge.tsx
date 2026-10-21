import { cn } from '@/utils/cn';

export type StatusKind = 'order' | 'lead' | 'customer' | 'staff' | 'priority' | 'payment' | 'generic';

export interface StatusBadgeProps {
  value: string;
  kind?: StatusKind;
  className?: string;
}

const colorMap: Record<StatusKind, Record<string, string>> = {
  order: {
    enquiry: 'bg-zinc-50 text-zinc-700 border-zinc-200',
    confirmed: 'bg-blue-50 text-blue-800 border-blue-200',
    measurements: 'bg-purple-50 text-purple-800 border-purple-200',
    cutting: 'bg-orange-50 text-orange-800 border-orange-200',
    stitching: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    embroidery_maggam: 'bg-pink-50 text-pink-800 border-pink-200',
    trial: 'bg-amber-50 text-amber-800 border-amber-200',
    finishing: 'bg-teal-50 text-teal-800 border-teal-200',
    delivery: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    cancelled: 'bg-rose-50 text-rose-800 border-rose-200',
    on_hold: 'bg-yellow-50 text-yellow-800 border-yellow-200',
  },
  lead: {
    new: 'bg-amber-50 text-amber-800 border-amber-200',
    contacted: 'bg-blue-50 text-blue-800 border-blue-200',
    qualified: 'bg-purple-50 text-purple-800 border-purple-200',
    converted: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    completed: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    rejected: 'bg-rose-50 text-rose-800 border-rose-200',
  },
  customer: {
    active: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    invited: 'bg-amber-50 text-amber-800 border-amber-200',
    locked: 'bg-rose-50 text-rose-800 border-rose-200',
    none: 'bg-zinc-50 text-zinc-600 border-zinc-200',
  },
  staff: {
    active: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    inactive: 'bg-rose-100 text-rose-700 border-rose-200',
    permanent: 'bg-blue-100 text-blue-700 border-blue-200',
    freelance: 'bg-purple-100 text-purple-700 border-purple-200',
    intern: 'bg-orange-100 text-orange-700 border-orange-200',
  },
  priority: {
    normal: 'text-ink/70 border-transparent',
    high: 'text-amber-600 border-transparent',
    rush: 'text-rose-600 border-transparent',
  },
  payment: {
    cash: 'bg-blue-100 text-blue-700 border-blue-200',
    upi: 'bg-purple-100 text-purple-700 border-purple-200',
    bank: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    card: 'bg-amber-100 text-amber-700 border-amber-200',
    other: 'bg-zinc-100 text-zinc-700 border-zinc-200',
  },
  generic: {},
};

const fallbackColor = 'bg-blue-50 text-blue-800 border-blue-200';

export function StatusBadge({ value, kind = 'generic', className }: StatusBadgeProps) {
  const normalizedValue = value?.toLowerCase().replace(/\s+/g, '_') ?? '';
  const palette = colorMap[kind];
  const colorClass = palette[normalizedValue] || (kind === 'generic' ? '' : fallbackColor);

  if (kind === 'priority') {
    const dotColors: Record<string, string> = {
      normal: 'bg-zinc-400',
      high: 'bg-amber-500',
      rush: 'bg-rose-500',
    };
    const dotClass = dotColors[normalizedValue] || 'bg-zinc-400';
    return (
      <span className={cn('inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider', colorClass, className)}>
        <span className={cn('h-1.5 w-1.5 rounded-full', dotClass)} />
        {value}
      </span>
    );
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-medium border backdrop-blur-xs transition-colors',
        colorClass || 'bg-zinc-500/10 text-zinc-300 border-zinc-500/20',
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      <span className="capitalize">{value.replace(/_/g, ' ')}</span>
    </span>
  );
}
