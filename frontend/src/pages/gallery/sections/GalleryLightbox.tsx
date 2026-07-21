import { useEffect, useId, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { OptimizedImage } from '@/components/media/OptimizedImage';
import { cn } from '@/utils/cn';
import type { GalleryItem } from '../data';

export interface GalleryLightboxProps {
  items: GalleryItem[];
  activeIndex: number | null;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

/**
 * Fullscreen gallery viewer — keyboard nav, image + video.
 */
export function GalleryLightbox({
  items,
  activeIndex,
  onClose,
  onNavigate,
}: GalleryLightboxProps) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const open = activeIndex !== null;
  const item = activeIndex !== null ? items[activeIndex] : null;

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    document.body.style.overflow = 'hidden';

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (activeIndex === null || items.length === 0) return;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        onNavigate((activeIndex + 1) % items.length);
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onNavigate((activeIndex - 1 + items.length) % items.length);
      }
    };

    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, activeIndex, items.length, onClose, onNavigate]);

  return (
    <AnimatePresence>
      {open && item ? (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <div className="absolute inset-0 bg-black/94 backdrop-blur-sm" aria-hidden />

          <div className="relative z-10 flex w-full max-w-6xl flex-col">
            <div className="mb-3 flex items-start justify-between gap-4 sm:mb-4">
              <div>
                <p className="text-[0.65rem] uppercase tracking-[0.28em] text-gold">
                  {item.category}
                  {item.mediaType === 'video' ? ' · Video' : ''}
                </p>
                <h2
                  id={titleId}
                  className="mt-1 font-heading text-xl text-cream sm:text-2xl md:text-3xl"
                >
                  {item.title}
                </h2>
              </div>
              <button
                ref={closeRef}
                type="button"
                onClick={onClose}
                className={cn(
                  'shrink-0 border border-cream/20 px-3 py-1.5 text-sm text-cream/80',
                  'transition-colors hover:border-gold hover:text-gold',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold',
                )}
                aria-label="Close viewer"
              >
                Close
              </button>
            </div>

            <div className="relative flex min-h-[50vh] items-center justify-center bg-black">
              {item.mediaType === 'video' ? (
                <video
                  key={item.id}
                  className="max-h-[78vh] w-full object-contain"
                  src={item.src}
                  poster={item.poster}
                  controls
                  autoPlay
                  playsInline
                >
                  <track kind="captions" />
                </video>
              ) : (
                <OptimizedImage
                  key={item.id}
                  src={item.src}
                  alt={item.alt}
                  className="max-h-[78vh] w-full object-contain"
                  width={item.width}
                  height={item.height}
                />
              )}
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <p className="text-sm text-cream/55">
                {activeIndex !== null ? activeIndex + 1 : 0} / {items.length}
                <span className="ml-3 hidden sm:inline">Use ← → to browse</span>
              </p>
              <div className="flex gap-2">
                <NavButton
                  label="Previous image"
                  direction="left"
                  onClick={() => {
                    if (activeIndex === null) return;
                    onNavigate((activeIndex - 1 + items.length) % items.length);
                  }}
                />
                <NavButton
                  label="Next image"
                  direction="right"
                  onClick={() => {
                    if (activeIndex === null) return;
                    onNavigate((activeIndex + 1) % items.length);
                  }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function NavButton({
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
      className="flex size-11 items-center justify-center border border-gold/35 text-cream transition-colors hover:border-gold hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
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
