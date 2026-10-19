import { Link } from 'react-router-dom';
import { cn } from '@/utils/cn';

export interface StatCardProps {
  label: string;
  value: string | number;
  href?: string;
  sub?: string;
  tone?: 'default' | 'success' | 'warning' | 'danger';
  className?: string;
  icon?: string;
}

export function StatCard({
  label,
  value,
  href,
  sub,
  tone = 'default',
  className,
  icon,
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
        'group relative overflow-hidden rounded-xl border p-4 sm:p-5 transition-all duration-300 shadow-2xs',
        'hover:border-gold/50 hover:shadow-[0_8px_30px_rgba(0,0,0,0.15)] hover:-translate-y-0.5',
        className
      )}
      style={{
        backgroundColor: 'var(--admin-card, #1f2937)',
        borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.18))',
        color: 'var(--admin-card-text, var(--admin-text, #f3f4f6))',
      }}
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
            {icon}
          </span>
        ) : null}
      </div>
      <p className={cn('mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl', toneClasses)}>
        {value}
      </p>
      {sub ? (
        <p className="mt-1.5 text-xs opacity-60 truncate">
          {sub}
        </p>
      ) : null}
    </div>
  );

  if (href) {
    return (
      <Link to={href} className="block transition hover:opacity-95 focus:outline-none">
        {content}
      </Link>
    );
  }

  return content;
}

