import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { leadsBanner } from '../data';

interface LeadsBannerSectionProps {
  /** Compact on list/detail; taller on dashboard. */
  density?: 'desk' | 'full';
  primaryLabel?: string;
  onPrimary?: () => void;
}

/**
 * Atelier desk banner — diagonal split composition.
 * Intentionally unlike marketing left-stack / centered heroes on public pages.
 */
export function LeadsBannerSection({
  density = 'full',
  primaryLabel = 'Open lead list',
  onPrimary,
}: LeadsBannerSectionProps) {
  const navigate = useNavigate();
  const reduced = usePrefersReducedMotion();
  const tall = density === 'full';

  return (
    <section
      className="relative isolate overflow-hidden bg-black text-cream"
      aria-label="Kadamba Leads CRM"
    >
      <div
        className={
          tall
            ? 'relative min-h-[min(52svh,520px)] w-full'
            : 'relative min-h-[min(36svh,360px)] w-full'
        }
      >
        {/* Diagonal media plane — right side */}
        <motion.div
          className="absolute inset-y-0 right-0 w-full md:w-[58%]"
          style={{
            clipPath: tall
              ? 'polygon(18% 0, 100% 0, 100% 100%, 0% 100%)'
              : 'polygon(22% 0, 100% 0, 100% 100%, 4% 100%)',
          }}
          initial={reduced ? false : { opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          <img
            src={leadsBanner.image}
            alt={leadsBanner.alt}
            className="h-full w-full object-cover"
            width={1600}
            height={1000}
            fetchPriority="high"
          />
          <div
            className="absolute inset-0 bg-gradient-to-r from-black via-black/35 to-transparent"
            aria-hidden
          />
          <div className="absolute inset-0 bg-black/25" aria-hidden />
        </motion.div>

        {/* Ink desk panel — left */}
        <div className="relative z-10 flex h-full min-h-[inherit] max-w-7xl flex-col justify-end px-6 py-10 sm:px-8 md:justify-center md:py-14 lg:px-12">
          <motion.div
            className="max-w-md"
            initial={reduced ? false : { opacity: 0, y: 22 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: reduced ? 0 : 0.12 }}
          >
            <p className="font-heading text-[0.65rem] uppercase tracking-[0.4em] text-gold/85">
              {leadsBanner.locationLine}
            </p>
            <p className="mt-4 font-heading text-4xl tracking-[0.06em] text-gold sm:text-5xl">
              {leadsBanner.brandName}
            </p>
            <h1 className="mt-5 font-heading text-2xl font-medium text-cream sm:text-3xl">
              {leadsBanner.headline}
            </h1>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-cream/75 sm:text-base">
              {leadsBanner.copy}
            </p>
            <div className="mt-8">
              <Button
                variant="primary"
                size="lg"
                onClick={() => {
                  if (onPrimary) onPrimary();
                  else navigate('/admin/leads/list');
                }}
              >
                {primaryLabel}
              </Button>
            </div>
          </motion.div>
        </div>

        {/* Diagonal gold hairline */}
        <div
          className="pointer-events-none absolute inset-y-0 left-[38%] hidden w-px origin-top -skew-x-[18deg] bg-gradient-to-b from-transparent via-gold/50 to-transparent md:block"
          aria-hidden
        />
      </div>
    </section>
  );
}
