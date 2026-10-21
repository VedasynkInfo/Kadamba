import { cn } from '@/utils/cn';
import { trendOf, type Trend } from '@/utils/trend';

export interface SparklineProps {
  /** The series, oldest first. */
  values: number[];
  className?: string;
  /** Override the trend colour; by default it is read from the series. */
  trend?: Trend;
}

/**
 * A number's recent shape, in one line.
 *
 * Hand-drawn rather than charted: a sparkline is a decoration for a figure
 * that is already on the page, and a charting library would bring axes, a
 * responsive container and a layout pass to render thirty pixels of ink. The
 * path is scaled to a 100×26 viewBox and stretched, so the stroke stays even
 * at any width.
 */
export function Sparkline({ values, className, trend }: SparklineProps) {
  if (values.length < 2) return null;

  const resolvedTrend = trend ?? trendOf(values);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const step = 100 / (values.length - 1);

  const points = values.map((value, index) => {
    const x = index * step;
    const y = 24 - ((value - min) / span) * 20;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });

  const line = `M ${points.join(' L ')}`;
  const area = `${line} L 100,26 L 0,26 Z`;

  return (
    <svg
      viewBox="0 0 100 26"
      preserveAspectRatio="none"
      className={cn(
        'h-7 w-full',
        resolvedTrend === 'up' && 'text-emerald-400',
        resolvedTrend === 'down' && 'text-rose-400',
        resolvedTrend === 'flat' && 'text-brand-strong',
        className,
      )}
      aria-hidden
    >
      <path d={area} className="fill-current/10" />
      <path
        d={line}
        className="fill-none stroke-current"
        strokeWidth={1.5}
        vectorEffect="non-scaling-stroke"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
