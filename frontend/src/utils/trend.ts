export type Trend = 'up' | 'down' | 'flat';

/**
 * Which way a series ends relative to where it started.
 *
 * A 2% deadband keeps a flat month with a rupee of rounding from claiming a
 * trend; the sign of the change is all this answers.
 */
export function trendOf(values: number[]): Trend {
  if (values.length < 2) return 'flat';
  const first = values[0];
  const last = values[values.length - 1];
  const scale = Math.max(1, Math.abs(first), Math.abs(last));
  const change = (last - first) / scale;
  if (change > 0.02) return 'up';
  if (change < -0.02) return 'down';
  return 'flat';
}
