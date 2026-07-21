import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { cn } from '@/utils/cn';

export interface AdminStatWidget {
  label: string;
  value: number | string;
  href?: string;
  hint?: string;
}

interface AdminStatWidgetsProps {
  items: AdminStatWidget[];
}

/**
 * Dashboard pulse widgets — one job: atelier counts at a glance.
 */
export function AdminStatWidgets({ items }: AdminStatWidgetsProps) {
  const reduced = usePrefersReducedMotion();

  return (
    <section className="border-b border-black/8 bg-cream px-4 py-12 sm:px-6 md:px-10 md:py-14">
      <motion.div
        initial={reduced ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto max-w-7xl"
      >
        <p className="font-heading text-[0.65rem] uppercase tracking-[0.3em] text-black/45">
          Console pulse
        </p>
        <div className="mt-6 grid grid-cols-2 gap-6 lg:grid-cols-4">
          {items.map((item) => {
            const inner = (
              <>
                <p className="font-heading text-4xl text-black sm:text-5xl">{item.value}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.2em] text-black/50">
                  {item.label}
                </p>
                {item.hint ? (
                  <p className="mt-2 text-xs text-black/40">{item.hint}</p>
                ) : null}
              </>
            );
            return (
              <div key={item.label} className="border-t border-black/15 pt-4">
                {item.href ? (
                  <Link
                    to={item.href}
                    className={cn('block transition hover:opacity-80')}
                  >
                    {inner}
                  </Link>
                ) : (
                  inner
                )}
              </div>
            );
          })}
        </div>
      </motion.div>
    </section>
  );
}
