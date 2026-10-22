import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

export interface MarqueeProps {
  /** The items, already rendered. They are duplicated for the loop. */
  children: ReactNode;
  /** Seconds for one full pass. Higher is slower. */
  duration?: number;
  className?: string;
  /** Space between items. */
  gap?: string;
  tone?: 'light' | 'dark';
}

/**
 * A ribbon of type that never ends.
 *
 * The track is rendered twice and translated by exactly one track width, so
 * the join is invisible and there is no JavaScript in the loop — it runs on the
 * compositor. It pauses on hover and on focus, and the duplicate is hidden from
 * assistive technology so a screen reader hears the words once.
 */
export function Marquee({ children, duration = 42, className, gap = '3rem', tone = 'light' }: MarqueeProps) {
  return (
    <div
      className={cn('marquee', className)}
      style={
        {
          '--marquee-duration': `${duration}s`,
          '--marquee-gap': gap,
        } as React.CSSProperties
      }
    >
      <div className={cn('marquee-track', tone === 'dark' ? 'text-ink-inverse' : 'text-ink')}>
        {children}
      </div>
      <div
        className={cn('marquee-track', tone === 'dark' ? 'text-ink-inverse' : 'text-ink')}
        aria-hidden
      >
        {children}
      </div>
    </div>
  );
}
