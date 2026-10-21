import { Link } from 'react-router-dom';
import { Icon, type GlyphName } from '@/components/icons';
import { CountUp } from '@/components/motion/CountUp';
import { Sparkline } from '@/components/ui/Sparkline';
import { cn } from '@/utils/cn';

export interface StatCardProps {
  label: string;
  value: string | number;
  href?: string;
  sub?: string;
  tone?: 'default' | 'success' | 'warning' | 'danger';
  className?: string;
  icon?: GlyphName;
  /** The recent shape of the figure, drawn under it. */
  sparkline?: number[];
}

export function StatCard({
  label,
  value,
  href,
  sub,
  tone = 'default',
  className,
  icon,
  sparkline,
}: StatCardProps) {
  const toneClasses = {
    default: 'text-inherit',
    success: 'text-emerald-500',
    warning: 'text-amber-500',
    danger: 'text-rose-500',
  }[tone];

  const content = (
    <div
      className={cn(
        'group relative overflow-hidden rounded-xl border border-line bg-surface-raised p-4 text-ink transition-all duration-300 sm:p-5 shadow-2xs',
        'hover:border-gold/50 hover:shadow-lg hover:-translate-y-0.5',
        className,
      )}
    >
      <span
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent"
        aria-hidden
      />
      <div className="flex items-center justify-between gap-2">
        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] opacity-65">
          {label}
        </p>
        {icon ? (
          <span className="text-base opacity-75 group-hover:scale-110 group-hover:opacity-100 transition-all">
            <Icon name={icon} size={16} />
          </span>
        ) : null}
      </div>
      <p className={cn('mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl', toneClasses)}>
        {typeof value === 'number' ? <CountUp value={value} /> : value}
      </p>
      {sub ? (
        <p className="mt-1.5 text-xs opacity-60 truncate">
          {sub}
        </p>
      ) : null}
      {sparkline && sparkline.length > 1 ? (
        <div className="mt-3 -mb-1">
          <Sparkline values={sparkline} />
        </div>
      ) : null}
    </div>
  );

  if (href) {
    return (
      <Link
        to={href}
        className="block rounded-xl transition hover:opacity-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
      >
        {content}
      </Link>
    );
  }

  return content;
}

