import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { OptimizedImage } from '@/components/media/OptimizedImage';
import { Button, Section } from '@/components/ui';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { usePublicContent } from '@/hooks/usePublicContent';
import { cn } from '@/utils/cn';
import {
  galleryCategories,
  getPublishedGalleryItems,
  type GalleryFilter,
  type GalleryItem,
} from '../data';
import { GalleryLightbox } from './GalleryLightbox';

/**
 * Masonry gallery — category filters, lazy images, fullscreen viewer.
 */
export function GalleryMasonrySection() {
  const reduced = usePrefersReducedMotion();
  const { gallery } = usePublicContent();
  const [filter, setFilter] = useState<GalleryFilter>('All');
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const published = useMemo(() => getPublishedGalleryItems(gallery), [gallery]);

  const filtered = useMemo(
    () =>
      filter === 'All' ? published : published.filter((item) => item.category === filter),
    [filter, published],
  );

  return (
    <Section
      id="gallery-masonry"
      tone="dark"
      className="overflow-hidden py-16 md:py-24"
      aria-label="Studio gallery"
    >
      <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="max-w-xl">
          <p className="font-heading text-xs uppercase tracking-[0.28em] text-gold">
            Browse by occasion
          </p>
          <h2 className="mt-3 font-heading text-3xl text-cream md:text-4xl">
            Bridal, traditional & atelier details
          </h2>
          <p className="mt-3 text-cream/70">
            Filter the lookbook — every frame reflects custom tailoring from our Kurnool boutique.
          </p>
        </div>

        <div
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="Gallery categories"
        >
          {galleryCategories.map((category) => (
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
      </div>

      <p className="mt-6 text-sm text-cream/50" aria-live="polite">
        {filtered.length} {filtered.length === 1 ? 'piece' : 'pieces'}
      </p>

      {/* CSS columns masonry — organic heights, no card chrome */}
      <ul className="mt-8 columns-1 gap-3 sm:columns-2 sm:gap-4 lg:columns-3">
        <AnimatePresence mode="popLayout">
          {filtered.map((item, index) => (
            <MasonryTile
              key={item.id}
              item={item}
              index={index}
              reduced={reduced}
              onOpen={() => setActiveIndex(index)}
            />
          ))}
        </AnimatePresence>
      </ul>

      {filtered.length === 0 ? (
        <p className="mt-12 text-center text-cream/60">No pieces in this category yet.</p>
      ) : null}

      <GalleryLightbox
        items={filtered}
        activeIndex={activeIndex}
        onClose={() => setActiveIndex(null)}
        onNavigate={setActiveIndex}
      />
    </Section>
  );
}

function MasonryTile({
  item,
  index,
  reduced,
  onOpen,
}: {
  item: GalleryItem;
  index: number;
  reduced: boolean;
  onOpen: () => void;
}) {
  return (
    <motion.li
      layout
      className="mb-3 break-inside-avoid sm:mb-4"
      initial={reduced ? false : { opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.4, delay: reduced ? 0 : Math.min(index * 0.04, 0.35) }}
    >
      <button
        type="button"
        onClick={onOpen}
        className={cn(
          'group relative block w-full overflow-hidden text-left',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold',
        )}
        style={{ aspectRatio: `${item.width} / ${item.height}` }}
        aria-label={`Open ${item.title}`}
      >
        {item.mediaType === 'video' ? (
          <>
            <OptimizedImage
              src={item.poster ?? item.src}
              alt={item.alt}
              className="h-full w-full object-cover transition-transform duration-700 ease-[var(--ease-luxury)] group-hover:scale-105"
              width={item.width}
              height={item.height}
            />
            <span
              className="absolute inset-0 flex items-center justify-center bg-black/25"
              aria-hidden
            >
              <span className="flex size-12 items-center justify-center border border-gold/70 text-gold backdrop-blur-[2px]">
                <svg className="ml-0.5 size-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5.5v13l11-6.5-11-6.5Z" />
                </svg>
              </span>
            </span>
          </>
        ) : (
          <OptimizedImage
            src={item.src}
            alt={item.alt}
            className="h-full w-full object-cover transition-transform duration-700 ease-[var(--ease-luxury)] group-hover:scale-105"
            width={item.width}
            height={item.height}
          />
        )}

        <div
          className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent opacity-80 transition-opacity duration-300 group-hover:opacity-95"
          aria-hidden
        />
        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
          <p className="font-heading text-lg text-cream sm:text-xl">{item.title}</p>
          <p className="mt-1 text-[0.65rem] uppercase tracking-[0.2em] text-gold">
            {item.category}
          </p>
        </div>
      </button>
    </motion.li>
  );
}
