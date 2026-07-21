import { cn } from '@/utils/cn';

export interface ProgressProps {
  value: number;
  max?: number;
  label?: string;
  className?: string;
}

/**
 * Progress bar for uploads and multi-step flows.
 */
export function Progress({ value, max = 100, label, className }: ProgressProps) {
  const clamped = Math.min(Math.max(value, 0), max);
  const percent = Math.round((clamped / max) * 100);

  return (
    <div className={cn('w-full', className)}>
      {label ? (
        <div className="mb-1.5 flex justify-between text-xs text-black/70">
          <span>{label}</span>
          <span>{percent}%</span>
        </div>
      ) : null}
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label ?? 'Progress'}
        className="h-2 w-full overflow-hidden rounded-full bg-black/10"
      >
        <div
          className="h-full rounded-full bg-gold transition-[width] duration-300 ease-[var(--ease-luxury)]"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
