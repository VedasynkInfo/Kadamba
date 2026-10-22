import { Section, SectionIntro } from '@/components/ui';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import type { PortfolioProject } from '../data';

interface PortfolioStorySectionProps {
  project: PortfolioProject;
}

/**
 * Project narrative — one job: tell the atelier story.
 *
 * ScrollTrigger gives the three paragraphs a shared cadence; a framer
 * `whileInView` on the wrapper could only move them as one block.
 */
export function PortfolioStorySection({ project }: PortfolioStorySectionProps) {
  const revealRef = useScrollReveal<HTMLDivElement>({ y: 22, stagger: 0.1 });

  return (
    <Section tone="light" className="py-16 md:py-24">
      <div ref={revealRef}>
        <div data-reveal>
          <SectionIntro title="The story" description={project.summary} />
        </div>
        <div className="mt-10 max-w-2xl space-y-5">
          {project.story.map((paragraph) => (
            <p
              key={paragraph.slice(0, 24)}
              data-reveal
              className="text-base leading-relaxed text-ink/75 md:text-lg"
            >
              {paragraph}
            </p>
          ))}
        </div>
        {project.tags.length > 0 ? (
          <ul
            className="mt-10 flex list-none flex-wrap gap-2"
            aria-label="Project tags"
            data-reveal
          >
            {project.tags.map((tag) => (
              <li
                key={tag}
                className="border border-line/12 px-3 py-1.5 text-[0.65rem] uppercase tracking-[0.2em] text-ink/70"
              >
                {tag}
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </Section>
  );
}
