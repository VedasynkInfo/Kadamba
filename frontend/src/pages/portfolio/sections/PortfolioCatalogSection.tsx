import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { OptimizedImage } from '@/components/media/OptimizedImage';
import { Button, Input, Section, SectionIntro } from '@/components/ui';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { usePublicContent } from '@/hooks/usePublicContent';
import { fadeUp, staggerChildren } from '@/motion/variants';
import { cn } from '@/utils/cn';
import {
  filterProjects,
  portfolioCatalogIntro,
  portfolioCategories,
  type PortfolioCategoryFilter,
  type PortfolioProject,
} from '../data';

/**
 * Portfolio catalog — filterable editorial grid (image-led, minimal chrome).
 */
export function PortfolioCatalogSection() {
  const navigate = useNavigate();
  const reduced = usePrefersReducedMotion();
  const { portfolio } = usePublicContent();
  const [category, setCategory] = useState<PortfolioCategoryFilter>('All');
  const [query, setQuery] = useState('');

  const filtered = useMemo(
    () => filterProjects(query, category, portfolio),
    [query, category, portfolio],
  );

  return (
    <Section id="portfolio-catalog" tone="light" className="scroll-mt-24 py-16 md:py-24">
      <SectionIntro
        title={portfolioCatalogIntro.title}
        description={portfolioCatalogIntro.description}
        actions={
          <div className="flex flex-wrap gap-2" role="group" aria-label="Portfolio categories">
            {portfolioCategories.map((item) => (
              <Button
                key={item}
                size="sm"
                variant={category === item ? 'primary' : 'ghost'}
                className={cn(
                  'min-h-10 border',
                  category === item ? 'border-transparent' : 'border-black/15 text-black',
                )}
                onClick={() => setCategory(item)}
                aria-pressed={category === item}
              >
                {item}
              </Button>
            ))}
          </div>
        }
      />

      <div className="mt-8 max-w-md">
        <Input
          id="portfolio-search"
          type="search"
          label="Search portfolio"
          placeholder="Search bridal, saree, client…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.ul
          key={`${category}-${query}`}
          className="mt-12 grid list-none grid-cols-1 gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3"
          variants={reduced ? undefined : staggerChildren}
          initial={reduced ? false : 'hidden'}
          animate="visible"
        >
          {filtered.map((project) => (
            <motion.li key={project.id} variants={reduced ? undefined : fadeUp}>
              <ProjectTile project={project} onOpen={() => navigate(`/portfolio/${project.slug}`)} />
            </motion.li>
          ))}
        </motion.ul>
      </AnimatePresence>

      {filtered.length === 0 ? (
        <p className="mt-12 text-center text-black/60">No projects match your search.</p>
      ) : null}
    </Section>
  );
}

function ProjectTile({
  project,
  onOpen,
}: {
  project: PortfolioProject;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        'group w-full cursor-pointer text-left',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-cream',
      )}
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-black/5">
        <OptimizedImage
          src={project.coverImage}
          alt={project.coverAlt}
          className="h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.04]"
          width={900}
          height={1200}
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent opacity-80 transition group-hover:opacity-95"
          aria-hidden
        />
        <span className="absolute bottom-4 left-4 font-heading text-[0.65rem] uppercase tracking-[0.28em] text-gold">
          {project.category}
        </span>
      </div>
      <p className="mt-4 text-[0.65rem] uppercase tracking-[0.22em] text-black/45">
        {project.year} · {project.location}
      </p>
      <h3 className="mt-2 font-heading text-2xl leading-snug text-black">{project.title}</h3>
      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-black/65">{project.summary}</p>
    </button>
  );
}
