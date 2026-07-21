import { motion } from 'framer-motion';
import { OptimizedImage } from '@/components/media/OptimizedImage';
import { Section, SectionIntro } from '@/components/ui';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import type { PortfolioProject } from '../data';

interface PortfolioBeforeAfterSectionProps {
  project: PortfolioProject;
}

/**
 * Before / after comparison — only when the project includes transformation data.
 */
export function PortfolioBeforeAfterSection({ project }: PortfolioBeforeAfterSectionProps) {
  const reduced = usePrefersReducedMotion();
  const pair = project.beforeAfter;

  if (!pair) return null;

  return (
    <Section tone="dark" className="py-16 md:py-24">
      <motion.div
        initial={reduced ? false : { opacity: 0, y: 18 }}
        whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-8%' }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <SectionIntro
          tone="dark"
          title="Before & after"
          description={pair.note}
        />
        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
          <figure>
            <div className="relative aspect-[3/4] overflow-hidden">
              <OptimizedImage
                src={pair.beforeImage}
                alt={pair.beforeAlt}
                className="h-full w-full object-cover"
                width={900}
                height={1200}
              />
            </div>
            <figcaption className="mt-4 font-heading text-xs uppercase tracking-[0.3em] text-gold">
              Before
            </figcaption>
          </figure>
          <figure>
            <div className="relative aspect-[3/4] overflow-hidden">
              <OptimizedImage
                src={pair.afterImage}
                alt={pair.afterAlt}
                className="h-full w-full object-cover"
                width={900}
                height={1200}
              />
            </div>
            <figcaption className="mt-4 font-heading text-xs uppercase tracking-[0.3em] text-gold">
              After
            </figcaption>
          </figure>
        </div>
      </motion.div>
    </Section>
  );
}
