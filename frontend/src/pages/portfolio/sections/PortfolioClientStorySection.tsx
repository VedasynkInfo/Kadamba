import { motion } from 'framer-motion';
import { Section } from '@/components/ui';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import type { PortfolioProject } from '../data';

interface PortfolioClientStorySectionProps {
  project: PortfolioProject;
}

/**
 * Client voice — quote-forward, minimal layout.
 */
export function PortfolioClientStorySection({ project }: PortfolioClientStorySectionProps) {
  const reduced = usePrefersReducedMotion();
  const story = project.clientStory;

  if (!story) return null;

  return (
    <Section tone="light" className="py-16 md:py-24">
      <motion.blockquote
        className="mx-auto max-w-3xl text-center"
        initial={reduced ? false : { opacity: 0, y: 16 }}
        whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-8%' }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <span className="font-heading text-5xl leading-none text-gold/80" aria-hidden>
          “
        </span>
        <p className="mt-4 font-heading text-2xl leading-snug text-black sm:text-3xl md:text-[2.15rem]">
          {story.quote}
        </p>
        <footer className="mt-8">
          <cite className="not-italic">
            <span className="block text-sm font-semibold tracking-wide text-black">{story.name}</span>
            <span className="mt-1 block text-xs uppercase tracking-[0.25em] text-black/45">
              {story.occasion}
            </span>
          </cite>
        </footer>
      </motion.blockquote>
    </Section>
  );
}
