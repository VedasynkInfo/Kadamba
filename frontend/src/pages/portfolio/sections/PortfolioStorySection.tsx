import { motion } from 'framer-motion';
import { Section, SectionIntro } from '@/components/ui';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import type { PortfolioProject } from '../data';

interface PortfolioStorySectionProps {
  project: PortfolioProject;
}

/**
 * Project narrative — one job: tell the atelier story.
 */
export function PortfolioStorySection({ project }: PortfolioStorySectionProps) {
  const reduced = usePrefersReducedMotion();

  return (
    <Section tone="light" className="py-16 md:py-24">
      <motion.div
        initial={reduced ? false : { opacity: 0, y: 18 }}
        whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-8%' }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <SectionIntro title="The story" description={project.summary} />
        <div className="mt-10 max-w-2xl space-y-5">
          {project.story.map((paragraph) => (
            <p key={paragraph.slice(0, 24)} className="text-base leading-relaxed text-black/75 md:text-lg">
              {paragraph}
            </p>
          ))}
        </div>
        {project.tags.length > 0 ? (
          <ul className="mt-10 flex list-none flex-wrap gap-2" aria-label="Project tags">
            {project.tags.map((tag) => (
              <li
                key={tag}
                className="border border-black/12 px-3 py-1.5 text-[0.65rem] uppercase tracking-[0.2em] text-black/55"
              >
                {tag}
              </li>
            ))}
          </ul>
        ) : null}
      </motion.div>
    </Section>
  );
}
