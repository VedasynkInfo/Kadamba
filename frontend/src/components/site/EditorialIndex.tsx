import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { OptimizedImage } from '@/components/media/OptimizedImage';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { cn } from '@/utils/cn';

export interface IndexEntry {
  id: string;
  title: string;
  /** The one line that says what this is for. */
  description: string;
  /** Small facts printed at the right of the row. */
  meta: string[];
  href: string;
  image: string;
}

export interface EditorialIndexProps {
  entries: IndexEntry[];
  className?: string;
}

/**
 * The index.
 *
 * A list of what the studio does, set the way a fashion house sets its
 * collections index: numbered rows, a serif line, one honest description, and
 * the photograph held in a plate to the side that changes as you move down the
 * list. It replaces a grid of identical cards, which is the shape every
 * competitor uses and the reason none of them are remembered.
 *
 * On a phone the plate is dropped and each row keeps its own thumbnail, so the
 * list still carries its images.
 */
export function EditorialIndex({ entries, className }: EditorialIndexProps) {
  const [active, setActive] = useState(0);
  const reduced = usePrefersReducedMotion();
  const current = entries[active] ?? entries[0];

  if (entries.length === 0) return null;

  return (
    <div className={cn('grid gap-12 lg:grid-cols-[1.12fr_0.88fr] lg:gap-20', className)}>
      <ul className="border-t border-ink/12">
        {entries.map((entry, index) => (
          <li key={entry.id} className="border-b border-ink/12">
            <Link
              to={entry.href}
              onMouseEnter={() => setActive(index)}
              onFocus={() => setActive(index)}
              className="group grid grid-cols-[auto_1fr_auto] items-start gap-5 py-7 transition-colors md:gap-8 md:py-9"
            >
              <span
                className={cn(
                  'mt-1 font-mono text-[0.62rem] tabular-nums tracking-[0.18em] transition-colors',
                  active === index ? 'text-brand-strong' : 'text-ink/35',
                )}
              >
                {String(index + 1).padStart(2, '0')}
              </span>

              <span className="min-w-0">
                <span className="block font-heading text-2xl leading-tight text-ink transition-colors group-hover:text-brand-strong md:text-[1.9rem]">
                  {entry.title}
                </span>
                <span className="mt-2 block max-w-md text-sm leading-relaxed text-ink/60">
                  {entry.description}
                </span>
                <span className="mt-4 flex flex-wrap gap-x-4 gap-y-1">
                  {entry.meta.map((fact) => (
                    <span
                      key={fact}
                      className="text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-ink/50"
                    >
                      {fact}
                    </span>
                  ))}
                </span>

                {/* The mobile plate: the same image, kept with its row. */}
                <span className="mt-5 block aspect-[16/10] overflow-hidden bg-surface-sunken lg:hidden">
                  <OptimizedImage
                    src={entry.image}
                    alt=""
                    sizes="100vw"
                    className="h-full w-full object-cover"
                  />
                </span>
              </span>

              <span
                className={cn(
                  'mt-1 flex size-10 shrink-0 items-center justify-center rounded-full border transition-all duration-500',
                  active === index
                    ? 'border-brand-strong text-brand-strong'
                    : 'border-ink/15 text-ink/40',
                )}
                aria-hidden
              >
                <svg viewBox="0 0 24 24" className="size-3.5" fill="none">
                  <path
                    d="M5 19 19 5M8 5h11v11"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="hidden lg:block">
        <div className="sticky top-28">
          <div className="plate plate-frame aspect-[4/5] w-full">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={current.id}
                className="absolute inset-0"
                initial={reduced ? false : { opacity: 0, scale: 1.04 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={reduced ? undefined : { opacity: 0 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              >
                <OptimizedImage
                  src={current.image}
                  alt=""
                  sizes="40vw"
                  className="h-full w-full object-cover"
                />
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="mt-4 flex items-baseline justify-between gap-4">
            <span className="text-[0.6rem] font-semibold uppercase tracking-[0.26em] text-ink/40">
              Plate {String(active + 1).padStart(2, '0')}
            </span>
            <span className="font-heading text-sm italic text-ink/60">{current.title}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export interface StatEntry {
  id: string;
  value: string;
  label: string;
  /** A quiet second line under the label. */
  note?: ReactNode;
}

export interface StatBandProps {
  items: StatEntry[];
  tone?: 'light' | 'dark';
  /** Four across on a wide page, or a 2x2 block inside a split column. */
  columns?: 2 | 4;
  className?: string;
}

/**
 * A row of figures separated by hairlines.
 *
 * Deliberately not animated counters: on a trust-building page a number that
 * counts up reads as a marketing device, while a number that is simply printed
 * reads as a record. The serif figure and the tabular lining numerals do the
 * work.
 */
export function StatBand({ items, tone = 'light', columns = 4, className }: StatBandProps) {
  const dark = tone === 'dark';

  return (
    <dl
      className={cn(
        'grid grid-cols-2 gap-y-10',
        columns === 4 && 'lg:grid-cols-4',
        dark ? 'text-ink-inverse' : 'text-ink',
        className,
      )}
    >
      {items.map((item, index) => (
        <div
          key={item.id}
          className={cn(
            'px-4 sm:px-8',
            index % 2 === 0 && 'pl-0',
            index % 2 === 1 && 'border-l',
            index > 1 && 'border-t pt-8',
            columns === 4 && 'lg:border-t-0 lg:pt-0',
            index > 1 && columns === 2 && 'lg:pt-8',
            dark ? 'border-ink-inverse/15' : 'border-ink/12',
          )}
        >
          <dd className="figure text-4xl md:text-5xl">{item.value}</dd>
          <dt className="mt-3 text-[0.6rem] font-semibold uppercase tracking-[0.24em] text-current/45">
            {item.label}
          </dt>
          {item.note ? (
            <p
              className={cn(
                'mt-2 text-xs leading-relaxed',
                dark ? 'text-ink-inverse/45' : 'text-ink/45',
              )}
            >
              {item.note}
            </p>
          ) : null}
        </div>
      ))}
    </dl>
  );
}
