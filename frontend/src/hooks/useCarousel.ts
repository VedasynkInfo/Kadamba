import { useCallback, useEffect, useRef, useState } from 'react';

export interface CarouselOptions {
  count: number;
  /** Time each slide is shown, in milliseconds. */
  interval?: number;
  /** Start paused (a visitor who has asked for reduced motion, for instance). */
  disabled?: boolean;
}

/**
 * The one carousel clock.
 *
 * A slider needs four things that are easy to get subtly wrong: it must pause
 * while the visitor is reading it, it must not move for someone who asked the
 * system not to move things, it must not keep a timer running after the last
 * slide, and the timer must reset when the slide is changed by hand (otherwise
 * a manual change is followed a moment later by an automatic one).
 *
 * Written once here, so the hero, the collections rail and the testimonial
 * strip all behave the same way.
 */
export function useCarousel({ count, interval = 6500, disabled = false }: CarouselOptions) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timer = useRef<number | null>(null);

  const goTo = useCallback(
    (next: number) => {
      if (count <= 0) return;
      setIndex(((next % count) + count) % count);
    },
    [count],
  );

  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1), [goTo, index]);

  // A change of count (a filter, a reload) must not leave the index past the end.
  useEffect(() => {
    if (index >= count) setIndex(0);
  }, [count, index]);

  useEffect(() => {
    if (disabled || paused || count <= 1) return;
    timer.current = window.setTimeout(() => {
      setIndex((current) => (current + 1) % count);
    }, interval);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [disabled, paused, count, interval, index]);

  /** Props for a section that should pause while it is hovered or focused. */
  const pauseProps = {
    onMouseEnter: () => setPaused(true),
    onMouseLeave: () => setPaused(false),
    onFocusCapture: () => setPaused(true),
    onBlurCapture: (event: React.FocusEvent<HTMLElement>) => {
      if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setPaused(false);
    },
  };

  return { index, setIndex, goTo, next, prev, paused, setPaused, pauseProps };
}
