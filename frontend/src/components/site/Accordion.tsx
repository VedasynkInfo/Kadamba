import { useId, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { cn } from '@/utils/cn';

export interface AccordionItem {
  id: string;
  question: string;
  answer: ReactNode;
}

export interface AccordionProps {
  items: AccordionItem[];
  /** Index open on first paint; -1 for all closed. */
  defaultOpen?: number;
  className?: string;
  tone?: 'light' | 'dark';
}

/**
 * The house accordion.
 *
 * One drawn rule per row, a serif question, a plus that becomes a minus. The
 * panel animates its height with `AnimatePresence`, so it does not jump, and
 * the trigger is a real `<button>` inside a heading with `aria-expanded` and
 * `aria-controls` — the thing that makes an FAQ both usable and eligible for
 * the `FAQPage` structured data the service pages emit.
 */
export function Accordion({ items, defaultOpen = -1, className, tone = 'light' }: AccordionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const baseId = useId();
  const reduced = usePrefersReducedMotion();
  const dark = tone === 'dark';

  return (
    <div className={cn('divide-y', dark ? 'divide-ink-inverse/15' : 'divide-ink/12', className)}>
      {items.map((item, index) => {
        const expanded = open === index;
        const panelId = `${baseId}-panel-${item.id}`;
        const buttonId = `${baseId}-button-${item.id}`;

        return (
          <div key={item.id}>
            <h3>
              <button
                id={buttonId}
                type="button"
                aria-expanded={expanded}
                aria-controls={panelId}
                onClick={() => setOpen(expanded ? -1 : index)}
                className={cn(
                  'group flex w-full items-start justify-between gap-6 py-6 text-left transition-colors',
                  dark ? 'text-ink-inverse hover:text-gold' : 'text-ink hover:text-brand-strong',
                )}
              >
                <span className="flex gap-5">
                  <span
                    className={cn(
                      'mt-1 font-mono text-[0.62rem] tabular-nums tracking-[0.18em]',
                      dark ? 'text-ink-inverse/40' : 'text-ink/35',
                    )}
                  >
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="font-heading text-xl leading-snug md:text-2xl">
                    {item.question}
                  </span>
                </span>
                <span
                  className={cn(
                    'relative mt-1 size-4 shrink-0',
                    expanded ? 'text-gold' : dark ? 'text-ink-inverse/50' : 'text-ink/40',
                  )}
                  aria-hidden
                >
                  <span className="absolute left-0 top-1/2 h-px w-4 -translate-y-1/2 bg-current" />
                  <span
                    className={cn(
                      'absolute left-1/2 top-0 h-4 w-px -translate-x-1/2 bg-current transition-transform duration-300',
                      expanded && 'rotate-90',
                    )}
                  />
                </span>
              </button>
            </h3>

            <AnimatePresence initial={false}>
              {expanded ? (
                <motion.div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  initial={reduced ? false : { height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={reduced ? undefined : { height: 0, opacity: 0 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="overflow-hidden"
                >
                  <div
                    className={cn(
                      'max-w-2xl pb-7 pl-10 pr-10 text-[0.95rem] leading-relaxed',
                      dark ? 'text-ink-inverse/70' : 'text-ink/70',
                    )}
                  >
                    {item.answer}
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
