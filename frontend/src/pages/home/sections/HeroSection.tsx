import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type TouchEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { OptimizedImage } from '@/components/media/OptimizedImage';
import { Button } from '@/components/ui';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { usePublicContent } from '@/hooks/usePublicContent';
import { cn } from '@/utils/cn';
import { heroSlides } from '../data';

const AUTO_MS = 6500;

/**
 * Full-bleed animated hero banner slider — brand-first, accessible controls.
 */
export function HeroSection() {
  const navigate = useNavigate();
  const { whatsappHref } = usePublicContent();
  const reduced = usePrefersReducedMotion();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const slide = heroSlides[index] ?? heroSlides[0];

  const goTo = useCallback((next: number) => {
    const len = heroSlides.length;
    setIndex(((next % len) + len) % len);
  }, []);

  const next = useCallback(() => goTo(index + 1), [goTo, index]);
  const prev = useCallback(() => goTo(index - 1), [goTo, index]);

  useEffect(() => {
    if (reduced || paused) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % heroSlides.length);
    }, AUTO_MS);
    return () => window.clearInterval(id);
  }, [reduced, paused]);

  const onKeyDown = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      next();
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      prev();
    }
  };

  const onTouchStart = (e: TouchEvent) => {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  };

  const onTouchEnd = (e: TouchEvent) => {
    if (touchStartX.current == null) return;
    const endX = e.changedTouches[0]?.clientX ?? touchStartX.current;
    const delta = endX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 48) return;
    if (delta < 0) next();
    else prev();
  };

  return (
    <section
      className="relative isolate w-full overflow-hidden bg-black text-cream"
      aria-roledescription="carousel"
      aria-label="Kadamba featured banners"
      tabIndex={0}
      onKeyDown={onKeyDown}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setPaused(false);
      }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="relative min-h-[min(92svh,920px)] w-full md:min-h-[calc(100svh-4.25rem)]">
        <AnimatePresence mode="sync" initial={false}>
          <motion.div
            key={slide.id}
            className="absolute inset-0"
            initial={reduced ? false : { opacity: 0, scale: 1.06 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduced ? undefined : { opacity: 0 }}
            transition={{ duration: reduced ? 0 : 1.1, ease: [0.22, 1, 0.36, 1] }}
          >
            <OptimizedImage
              src={slide.image}
              alt={slide.alt}
              className="h-full w-full object-cover"
              width={2400}
              height={1600}
              priority={index === 0}
            />
            <div
              className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-black/20"
              aria-hidden
            />
            <div
              className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30"
              aria-hidden
            />
          </motion.div>
        </AnimatePresence>

        <div className="relative z-10 mx-auto flex min-h-[min(92svh,920px)] w-full max-w-7xl flex-col justify-end px-4 pb-20 pt-28 sm:px-6 md:min-h-[calc(100svh-4.25rem)] md:pb-24 lg:px-8">
          <div className="w-full max-w-2xl">
            <p className="font-heading text-4xl tracking-wide text-gold sm:text-5xl md:text-6xl lg:text-7xl">
              Kadamba
            </p>

            <div className="relative mt-4 min-h-[3.5rem] w-full sm:min-h-[4.25rem]" aria-live="polite">
              <AnimatePresence mode="wait">
                <motion.h1
                  key={`${slide.id}-headline`}
                  className="w-full font-heading text-2xl font-medium text-cream sm:text-3xl md:text-4xl"
                  initial={reduced ? false : { opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduced ? undefined : { opacity: 0, y: -10 }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                >
                  {slide.headline}
                </motion.h1>
              </AnimatePresence>
            </div>

            <div className="relative mt-5 min-h-[3.5rem] w-full" aria-live="polite">
              <AnimatePresence mode="wait">
                <motion.p
                  key={`${slide.id}-copy`}
                  className="text-lede w-full text-cream/85"
                  initial={reduced ? false : { opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduced ? undefined : { opacity: 0 }}
                  transition={{ duration: 0.4, delay: reduced ? 0 : 0.05 }}
                >
                  {slide.copy}
                </motion.p>
              </AnimatePresence>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Button variant="primary" size="lg" onClick={() => navigate('/request-service')}>
                Request a consultation
              </Button>
              <Button
                variant="secondary"
                size="lg"
                className="!text-cream"
                onClick={() => {
                  window.open(whatsappHref(), '_blank', 'noopener,noreferrer');
                }}
              >
                WhatsApp the studio
              </Button>
            </div>
          </div>

          {/* Controls */}
          <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2" role="tablist" aria-label="Banner slides">
              {heroSlides.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  role="tab"
                  aria-selected={i === index}
                  aria-label={`Show slide ${i + 1}: ${s.headline}`}
                  onClick={() => goTo(i)}
                  className={cn(
                    'relative h-1.5 overflow-hidden rounded-full transition-all duration-300',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-black',
                    i === index ? 'w-10 bg-gold/30' : 'w-2.5 bg-cream/35 hover:bg-cream/55',
                  )}
                >
                  {i === index && !reduced && !paused ? (
                    <motion.span
                      className="absolute inset-y-0 left-0 bg-gold"
                      initial={{ width: '0%' }}
                      animate={{ width: '100%' }}
                      transition={{ duration: AUTO_MS / 1000, ease: 'linear' }}
                      key={`progress-${index}-${paused}`}
                    />
                  ) : i === index ? (
                    <span className="absolute inset-0 bg-gold" />
                  ) : null}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={prev}
                aria-label="Previous banner"
                className="flex size-11 items-center justify-center border border-gold/40 text-cream transition-colors hover:border-gold hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                <Chevron direction="left" />
              </button>
              <button
                type="button"
                onClick={next}
                aria-label="Next banner"
                className="flex size-11 items-center justify-center border border-gold/40 text-cream transition-colors hover:border-gold hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
              >
                <Chevron direction="right" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        Slide {index + 1} of {heroSlides.length}: {slide.headline}
      </p>
    </section>
  );
}

function Chevron({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg className="size-5" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d={direction === 'left' ? 'M15 6 9 12l6 6' : 'M9 6l6 6-6 6'}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
