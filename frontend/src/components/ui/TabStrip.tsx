import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Icon, type GlyphName } from '@/components/icons';
import { cn } from '@/utils/cn';

export interface TabStripItem {
  id: string;
  label: string;
  icon?: GlyphName;
  /** Rendered after the label — a count, a status. */
  trailing?: ReactNode;
}

export interface TabStripProps {
  items: TabStripItem[];
  /** The id of the active tab. */
  value: string;
  onChange: (id: string) => void;
  /**
   * Names the shared-layout animation that slides the indicator from one tab
   * to the next. Two strips on one screen need two names, or the indicator
   * will jump between them.
   */
  layoutId: string;
  className?: string;
  itemClassName?: string;
}

/**
 * A strip of tabs with an indicator that slides.
 *
 * The console had ten of these, each hand-written, each drawing its own
 * `border-b-2` underline. The underline was the problem: it appeared
 * instantly, so switching tabs felt like a page reload rather than a move.
 *
 * These strips do not own panels — they switch a section in place — so they
 * are marked with `aria-current` rather than pretending to be an ARIA tab
 * list whose panels do not exist.
 */
export function TabStrip({
  items,
  value,
  onChange,
  layoutId,
  className,
  itemClassName,
}: TabStripProps) {
  const reducedMotion = useReducedMotion();

  return (
    <div className={cn('flex border-b text-xs font-semibold border-line', className)}>
      {items.map((item) => {
        const isActive = item.id === value;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            aria-current={isActive ? 'true' : undefined}
            className={cn(
              'relative flex items-center gap-2 whitespace-nowrap px-4 py-3 transition cursor-pointer',
              isActive ? 'font-bold text-brand' : 'opacity-60 hover:opacity-100',
              itemClassName,
            )}
          >
            {isActive ? (
              <motion.span
                layoutId={reducedMotion ? undefined : layoutId}
                className="absolute inset-x-0 bottom-0 h-0.5 bg-brand"
                transition={
                  reducedMotion
                    ? { duration: 0 }
                    : { duration: 0.24, ease: [0.22, 1, 0.36, 1] }
                }
              />
            ) : null}
            {item.icon ? <Icon name={item.icon} size={15} /> : null}
            <span>{item.label}</span>
            {item.trailing}
          </button>
        );
      })}
    </div>
  );
}
