import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { OptimizedImage } from '@/components/media/OptimizedImage';
import { Button, Section, SectionIntro } from '@/components/ui';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { fadeUp, staggerChildren } from '@/motion/variants';
import { cn } from '@/utils/cn';
import {
  collectionCategories,
  collections,
  type CollectionItem,
} from '../data';
import { ImageLightbox } from './ImageLightbox';

/**
 * Featured collections — animated featured slider + responsive bento grid.
 */
export function FeaturedCollectionsSection() {
  const reduced = usePrefersReducedMotion();
  const [filter, setFilter] = useState<(typeof collectionCategories)[number]>('All');
  const [active, setActive] = useState<CollectionItem | null>(null);
  const [featuredIndex, setFeaturedIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const filtered = useMemo(
    () =>
      filter === 'All' ? collections : collections.filter((c) => c.category === filter),
    [filter],
  );

  useEffect(() => {
    setFeaturedIndex(0);
  }, [filter]);

  useEffect(() => {
    if (reduced || paused || filtered.length <= 1) return;
    const id = window.setInterval(() => {
      setFeaturedIndex((i) => (i + 1) % filtered.length);
    }, 5000);
    return () => window.clearInterval(id);
  }, [reduced, paused, filtered.length]);

  const featured = filtered[featuredIndex] ?? filtered[0];
  const gridItems = filtered.filter((item) => item.id !== featured?.id);

  return (
    <Section tone="dark" className="overflow-hidden py-16 md:py-24">
      <SectionIntro
        tone="dark"
        title="Featured collections"
        description="Bridal, traditional, festive, and tailored looks from our Kurnool boutique — filter by occasion."
        actions={
          <div className="flex flex-wrap gap-2" role="group" aria-label="Collection categories">
            {collectionCategories.map((category) => (
              <Button
                key={category}
                size="sm"
                variant={filter === category ? 'primary' : 'secondary'}
                className={cn(
                  'min-h-10',
                  filter !== category && '!text-cream hover:!border-gold hover:!text-gold',
                )}
                onClick={() => setFilter(category)}
                aria-pressed={filter === category}
              >
                {category}
              </Button>
            ))}
          </div>
        }
      />

      {featured ? (
        <div
          className="relative mt-10"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocusCapture={() => setPaused(true)}
          onBlurCapture={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setPaused(false);
          }}
        >
          <div
            className="relative aspect-[16/11] w-full overflow-hidden sm:aspect-[21/10] md:aspect-[21/9]"
            aria-roledescription="carousel"
            aria-label="Featured collection highlight"
          >
            <AnimatePresence mode="wait">
              <motion.button
                key={featured.id}
                type="button"
                className="absolute inset-0 block w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold"
                onClick={() => setActive(featured)}
                initial={reduced ? false : { opacity: 0, scale: 1.04 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={reduced ? undefined : { opacity: 0 }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              >
                <OptimizedImage
                  src={featured.image}
                  alt={featured.alt}
                  className="h-full w-full object-cover"
                  width={1600}
                  height={720}
                  priority
                />
                <div
                  className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent"
                  aria-hidden
                />
                <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-5 sm:flex-row sm:items-end sm:justify-between sm:p-8">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-gold">{featured.category}</p>
                    <p className="mt-2 font-heading text-2xl text-cream sm:text-3xl md:text-4xl">
                      {featured.title}
                    </p>
                  </div>
                  <span className="text-sm text-cream/80">Open preview →</span>
                </div>
              </motion.button>
            </AnimatePresence>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Featured slides">
              {filtered.map((item, i) => (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={i === featuredIndex}
                  aria-label={`Show ${item.title}`}
                  onClick={() => setFeaturedIndex(i)}
                  className={cn(
                    'h-1.5 rounded-full transition-all duration-300',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold',
                    i === featuredIndex ? 'w-8 bg-gold' : 'w-2.5 bg-cream/30 hover:bg-cream/50',
                  )}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <ControlButton
                label="Previous featured collection"
                onClick={() =>
                  setFeaturedIndex((i) => (i === 0 ? filtered.length - 1 : i - 1))
                }
                direction="left"
              />
              <ControlButton
                label="Next featured collection"
                onClick={() => setFeaturedIndex((i) => (i + 1) % filtered.length)}
                direction="right"
              />
            </div>
          </div>
        </div>
      ) : null}

      <motion.ul
        layout
        className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4"
        variants={reduced ? undefined : staggerChildren}
        initial={reduced ? false : 'hidden'}
        whileInView={reduced ? undefined : 'visible'}
        viewport={{ once: true, amount: 0.12 }}
      >
        <AnimatePresence mode="popLayout">
          {gridItems.map((item, index) => (
            <motion.li
              key={item.id}
              layout
              variants={reduced ? undefined : fadeUp}
              initial={reduced ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.4 }}
              className={cn(
                index === 0 && 'sm:col-span-2 sm:row-span-1 lg:col-span-1 lg:row-span-2',
              )}
            >
              <button
                type="button"
                className={cn(
                  'group relative block w-full overflow-hidden text-left',
                  'aspect-[4/3] lg:aspect-auto lg:h-full lg:min-h-[220px]',
                  index === 0 && 'lg:min-h-[460px]',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold',
                )}
                onClick={() => setActive(item)}
              >
                <OptimizedImage
                  src={item.image}
                  alt={item.alt}
                  className="h-full w-full object-cover transition-transform duration-700 ease-[var(--ease-luxury)] group-hover:scale-110 group-focus-visible:scale-105"
                  width={900}
                  height={700}
                />
                <div
                  className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent opacity-90 transition-opacity duration-300 group-hover:opacity-100"
                  aria-hidden
                />
                <div className="absolute inset-x-0 bottom-0 translate-y-1 p-4 transition-transform duration-300 group-hover:translate-y-0 sm:p-5">
                  <p className="font-heading text-lg text-cream sm:text-xl">{item.title}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.18em] text-gold">{item.category}</p>
                </div>
                <span
                  className="pointer-events-none absolute inset-0 border border-transparent transition-colors duration-300 group-hover:border-gold/50"
                  aria-hidden
                />
              </button>
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>

      <ImageLightbox
        open={Boolean(active)}
        onClose={() => setActive(null)}
        title={active?.title ?? ''}
        image={active?.image ?? ''}
        alt={active?.alt ?? ''}
      />
    </Section>
  );
}

function ControlButton({
  label,
  onClick,
  direction,
}: {
  label: string;
  onClick: () => void;
  direction: 'left' | 'right';
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex size-10 items-center justify-center border border-gold/40 text-cream transition-colors hover:border-gold hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
    >
      <svg className="size-4" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d={direction === 'left' ? 'M15 6 9 12l6 6' : 'M9 6l6 6-6 6'}
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
