import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { OptimizedImage } from '@/components/media/OptimizedImage';
import { Button, Section } from '@/components/ui';
import { ContentEmpty, ContentError, ContentLoading } from '@/components/feedback/ContentState';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { usePublicContent } from '@/hooks/usePublicContent';
import { cn } from '@/utils/cn';
import { openWithSharedElement } from '@/utils/viewTransition';
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
  const { gallery, loading, error, refresh } = usePublicContent();
  const [filter, setFilter] = useState<GalleryFilter>('All');
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const published = useMemo(() => getPublishedGalleryItems(gallery), [gallery]);

  const filtered = useMemo(
    () => (filter === 'All' ? published : published.filter((item) => item.category === filter)),
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
          <h2 className="mt-3 font-heading text-3xl text-ink-inverse md:text-4xl">
            Bridal, traditional & atelier details
          </h2>
          <p className="mt-3 text-ink-inverse/70">
            Filter the lookbook — every frame reflects custom tailoring from our Kurnool boutique.
          </p>
        </div>

        <div className="flex flex-wrap gap-2" role="group" aria-label="Gallery categories">
          {galleryCategories.map((category) => (
            <Button
              key={category}
              size="sm"
              variant={filter === category ? 'primary' : 'secondary'}
              className={cn(
                'min-h-10',
                filter !== category && 'text-ink-inverse hover:border-gold hover:text-gold',
              )}
              onClick={() => setFilter(category)}
              aria-pressed={filter === category}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {!loading ? (
        <p className="mt-6 text-sm text-ink-inverse/70" aria-live="polite">
          {filtered.length} {filtered.length === 1 ? 'piece' : 'pieces'}
        </p>
      ) : null}

      {loading ? (
        <ContentLoading className="mt-8" count={6} tone="dark" label="Loading the lookbook" />
      ) : error ? (
        <ContentError className="mt-8" error={error} tone="dark" onRetry={refresh} />
      ) : filtered.length === 0 ? (
        <ContentEmpty
          className="mt-8"
          tone="dark"
          title={
            published.length === 0
              ? 'The lookbook is being updated'
              : 'Nothing in this category yet'
          }
          description={
            published.length === 0
              ? 'New work is photographed and published regularly. Please check back soon.'
              : 'Try another occasion, or view the full collection.'
          }
          action={
            published.length > 0 ? (
              <Button
                size="sm"
                variant="secondary"
                className="text-ink-inverse"
                onClick={() => setFilter('All')}
              >
                Show everything
              </Button>
            ) : undefined
          }
        />
      ) : (
        /* CSS columns masonry — organic heights, no card chrome */
        <ul className="mt-8 columns-1 gap-3 sm:columns-2 sm:gap-4 lg:columns-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((item, index) => (
              <MasonryTile
                key={item.id}
                item={item}
                index={index}
                reduced={reduced}
                onOpen={(element) =>
                  openWithSharedElement(element, () => setActiveIndex(index), {
                    name: 'gallery-lightbox-media',
                    enabled: !reduced && item.mediaType !== 'video',
                  })
                }
              />
            ))}
          </AnimatePresence>
        </ul>
      )}

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
  onOpen: (element: HTMLElement) => void;
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
        onClick={(event) => onOpen(event.currentTarget)}
        className={cn(
          'group relative block w-full overflow-hidden text-left',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus',
        )}
        style={{ aspectRatio: `${item.width} / ${item.height}` }}
        aria-label={`Open ${item.title}`}
      >
        {item.mediaType === 'video' ? (
          <>
            <OptimizedImage
              sizes="(min-width: 1200px) 368px, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              src={item.poster ?? item.src}
              alt={item.alt}
              className="h-full w-full object-cover transition-transform duration-700 ease-luxury group-hover:scale-105"
              width={item.width}
              height={item.height}
            />
            <span
              className="on-dark absolute inset-0 flex items-center justify-center bg-espresso/25"
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
            sizes="(min-width: 1200px) 368px, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            src={item.src}
            alt={item.alt}
            className="h-full w-full object-cover transition-transform duration-700 ease-luxury group-hover:scale-105"
            width={item.width}
            height={item.height}
          />
        )}

        <div
          className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent opacity-80 transition-opacity duration-300 group-hover:opacity-95"
          aria-hidden
        />
        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
          <p className="font-heading text-lg text-ink-inverse sm:text-xl">{item.title}</p>
          <p className="mt-1 text-[0.65rem] uppercase tracking-[0.2em] text-gold">
            {item.category}
          </p>
        </div>
      </button>
    </motion.li>
  );
}
