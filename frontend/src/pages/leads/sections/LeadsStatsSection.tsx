import { motion } from 'framer-motion';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { countByStatus, LEAD_STATUSES, type Lead } from '../data';

interface LeadsStatsSectionProps {
  leads: Lead[];
  total: number;
  open: number;
  appointments: number;
  newCount: number;
}

/**
 * Pipeline overview — one job: show lead health at a glance.
 */
export function LeadsStatsSection({
  leads,
  total,
  open,
  appointments,
  newCount,
}: LeadsStatsSectionProps) {
  const reduced = usePrefersReducedMotion();
  const byStatus = countByStatus(leads);

  const highlights = [
    { label: 'Total leads', value: total },
    { label: 'Open pipeline', value: open },
    { label: 'New leads', value: newCount },
    { label: 'Appointments', value: appointments },
  ];

  return (
    <section className="border-b border-black/8 bg-cream px-4 py-12 sm:px-6 md:px-10 md:py-14">
      <motion.div
        initial={reduced ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto max-w-7xl"
      >
        <p className="font-heading text-[0.65rem] uppercase tracking-[0.3em] text-black/45">
          Pipeline pulse
        </p>
        <div className="mt-6 grid grid-cols-2 gap-6 lg:grid-cols-4">
          {highlights.map((item) => (
            <div key={item.label} className="border-t border-black/15 pt-4">
              <p className="font-heading text-4xl text-black sm:text-5xl">{item.value}</p>
              <p className="mt-2 text-xs uppercase tracking-[0.2em] text-black/50">{item.label}</p>
            </div>
          ))}
        </div>

        <ul className="mt-10 flex list-none flex-wrap gap-2" aria-label="Status breakdown">
          {LEAD_STATUSES.map((status) => (
            <li
              key={status}
              className="border border-black/12 px-3 py-2 text-xs uppercase tracking-[0.16em] text-black/70"
            >
              {status}
              <span className="ml-2 font-heading text-sm text-black">{byStatus[status]}</span>
            </li>
          ))}
        </ul>
      </motion.div>
    </section>
  );
}
