import { useRef, type KeyboardEvent, type TouchEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useScroll, useTransform } from 'framer-motion';
import { OptimizedImage } from '@/components/media/OptimizedImage';
import { Button } from '@/components/ui';
import { useCarousel } from '@/hooks/useCarousel';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { usePublicContent } from '@/hooks/usePublicContent';
import { cn } from '@/utils/cn';

export interface BannerSlide {
  id: string;
  image: string;
  video?: string;
  alt: string;
  /** The line above the headline — the collection or the season. */
  kicker: string;
  /** The headline, split into the roman part and the italic accent. */
  title: string;
  accent: string;
  copy: string;
  href: string;
  cta: string;
}

const AUTO_MS = 7200;

/**
 * The home banner.
 *
 * A full-screen slider is the easiest thing on a site to make cheap: a photo
 * with a headline over it, fading. What makes this one read as a fashion house
 * rather than a template is that the change is *choreographed* — the outgoing
 * image lifts out of focus while the incoming one settles, a gold hairline
 * sweeps the frame once, the serial number ticks over, and the copy arrives a
 * beat after the photograph rather than with it.
 *
 * Underneath it is ordinary, correct carousel behaviour: it pauses on hover and
 * focus, it can be driven by the arrow keys or a swipe, the slides are a
 * `tablist`, the live region announces the change, and a visitor who has asked
 * for reduced motion gets a still, cross-faded banner with no auto-advance.
 */
export function HeroBanner({ slides }: { slides: BannerSlide[] }) {
  const navigate = useNavigate();
  const { whatsappHref } = usePublicContent();
  const reduced = usePrefersReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const touchStartX = useRef<number | null>(null);

  const { index, goTo, next, prev, paused, pauseProps } = useCarousel({
    count: slides.length,
    interval: AUTO_MS,
    disabled: reduced,
  });

  const slide = slides[index] ?? slides[0];

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });
  const imageY = useTransform(scrollYProgress, [0, 1], ['0%', '16%']);
  const copyY = useTransform(scrollYProgress, [0, 1], ['0%', '38%']);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.75], [1, 0]);

  const onKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      next();
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      prev();
    }
  };

  const onTouchStart = (event: TouchEvent) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  };

  const onTouchEnd = (event: TouchEvent) => {
    if (touchStartX.current == null) return;
    const endX = event.changedTouches[0]?.clientX ?? touchStartX.current;
    const delta = endX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) < 52) return;
    if (delta < 0) next();
    else prev();
  };

  return (
    <section
      ref={sectionRef}
      className="on-dark relative isolate w-full overflow-hidden bg-espresso text-ink-inverse"
      aria-roledescription="carousel"
      aria-label="Kadamba — featured work"
      tabIndex={0}
      onKeyDown={onKeyDown}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      {...pauseProps}
    >
      <div className="relative min-h-[100svh] w-full">
        {/* ── The photographs, stacked ─────────────────────────────────── */}
        <div className="absolute inset-0" aria-hidden>
          {slides.map((item, i) => (
            <motion.div
              key={item.id}
              className="absolute inset-0"
              initial={false}
              animate={{
                opacity: i === index ? 1 : 0,
                scale: i === index ? 1 : 1.06,
                filter: i === index ? 'blur(0px)' : 'blur(6px)',
              }}
              transition={{ duration: reduced ? 0 : 1.5, ease: [0.22, 1, 0.36, 1] }}
              style={{ zIndex: i === index ? 2 : 1 }}
            >
              {item.video && !reduced ? (
                <video
                  className="h-full w-full scale-105 object-cover"
                  src={item.video}
                  poster={item.image}
                  autoPlay={i === index}
                  muted
                  loop
                  playsInline
                  preload="metadata"
                />
              ) : (
                <motion.div className="h-full w-full" style={reduced ? undefined : { y: imageY }}>
                  <OptimizedImage
                    src={item.image}
                    alt=""
                    priority={i === 0}
                    sizes="100vw"
                    width={2000}
                    height={1250}
                    className={cn(
                      'h-[112%] w-full object-cover',
                      i === index && !reduced && 'ken-burns',
                    )}
                  />
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Veils: one from the left for the copy, one from the bottom for the rail. */}
        <div
          className="absolute inset-0 z-[3] bg-[linear-gradient(90deg,rgba(10,8,6,0.86)_0%,rgba(10,8,6,0.42)_44%,rgba(10,8,6,0.04)_76%,rgba(10,8,6,0.28)_100%)]"
          aria-hidden
        />
        <div
          className="absolute inset-0 z-[3] bg-[linear-gradient(180deg,rgba(10,8,6,0.45)_0%,transparent_26%,transparent_62%,rgba(10,8,6,0.82)_100%)]"
          aria-hidden
        />

        {/* A gold hairline that sweeps the frame on every change. */}
        <AnimatePresence mode="wait">
          <motion.span
            key={`sweep-${index}`}
            className="pointer-events-none absolute inset-x-0 top-0 z-[4] h-px origin-left bg-gradient-to-r from-transparent via-gold to-transparent"
            initial={reduced ? false : { scaleX: 0, opacity: 0.9 }}
            animate={{ scaleX: 1, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
            aria-hidden
          />
        </AnimatePresence>

        {/* ── The copy ─────────────────────────────────────────────────── */}
        <motion.div
          className="relative z-10 mx-auto flex min-h-[100svh] w-full max-w-[84rem] flex-col justify-end px-6 pb-10 pt-32 sm:px-10 lg:px-16 lg:pb-14"
          style={reduced ? undefined : { y: copyY, opacity: copyOpacity }}
        >
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div className="max-w-2xl">
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={slide.id}
                  initial={reduced ? false : { opacity: 0, y: 22 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduced ? undefined : { opacity: 0, y: -14 }}
                  transition={{ duration: 0.62, ease: [0.22, 1, 0.36, 1] }}
                >
                  <p className="eyebrow text-gold/90">
                    <span className="tabular-nums text-ink-inverse/60">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    {slide.kicker}
                  </p>

                  <h1 className="display-xl mt-6 text-ink-inverse">
                    {slide.title}{' '}
                    <span className="display-accent">{slide.accent}</span>
                  </h1>

                  <p className="text-lede mt-7 max-w-xl text-ink-inverse/75">{slide.copy}</p>
                </motion.div>
              </AnimatePresence>

              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Button
                  variant="primary"
                  size="lg"
                  className="rounded-none px-7 py-3 text-[0.72rem] font-semibold uppercase tracking-[0.18em]"
                  onClick={() => navigate(slide.href)}
                >
                  {slide.cta}
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  className="rounded-none border-ink-inverse/30 px-7 py-3 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-ink-inverse hover:border-gold hover:text-gold"
                  onClick={() => window.open(whatsappHref(), '_blank', 'noopener,noreferrer')}
                >
                  WhatsApp the studio
                </Button>
              </div>

              <p className="mt-8 hidden max-w-md text-[0.68rem] uppercase tracking-[0.24em] text-ink-inverse/45 sm:block">
                Kurnool &middot; Andhra Pradesh &nbsp;—&nbsp; Bridal, traditional &amp; bespoke tailoring
              </p>
            </div>

            {/* ── The slide rail ───────────────────────────────────────── */}
            <div
              className="hidden w-64 shrink-0 border-l border-ink-inverse/15 pl-8 lg:block"
              role="tablist"
              aria-label="Featured slides"
              aria-orientation="vertical"
            >
              {slides.map((item, i) => {
                const active = i === index;
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    aria-controls={`hero-panel-${item.id}`}
                    onClick={() => goTo(i)}
                    className={cn(
                      'group flex w-full items-baseline gap-4 border-b border-ink-inverse/10 py-4 text-left transition-colors last:border-0',
                      active ? 'text-ink-inverse' : 'text-ink-inverse/45 hover:text-ink-inverse/75',
                    )}
                  >
                    <span
                      className={cn(
                        'font-mono text-[0.6rem] tabular-nums tracking-[0.16em]',
                        active ? 'text-gold' : 'text-ink-inverse/35',
                      )}
                    >
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="flex-1">
                      <span className="block font-heading text-lg leading-tight">{item.title}</span>
                      <span className="mt-0.5 block text-[0.6rem] uppercase tracking-[0.2em] opacity-70">
                        {item.kicker}
                      </span>
                    </span>
                    <span
                      className={cn(
                        'h-px w-6 transition-all duration-500',
                        active ? 'w-8 bg-gold' : 'bg-ink-inverse/30 group-hover:bg-ink-inverse/60',
                      )}
                      aria-hidden
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── The progress foot ────────────────────────────────────── */}
          <div className="mt-12 flex items-center justify-between gap-6 border-t border-ink-inverse/15 pt-6">
            <div className="flex items-center gap-5">
              <span className="font-heading text-2xl tabular-nums text-ink-inverse">
                {String(index + 1).padStart(2, '0')}
                <span className="ml-2 text-sm text-ink-inverse/40">
                  / {String(slides.length).padStart(2, '0')}
                </span>
              </span>

              <div className="flex items-center gap-2">
                {slides.map((item, i) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => goTo(i)}
                    aria-label={`Show slide ${i + 1}: ${item.title} ${item.accent}`}
                    aria-current={i === index ? 'true' : undefined}
                    className="group relative h-6 w-8 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                  >
                    <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-ink-inverse/25" />
                    <span
                      className={cn(
                        'absolute inset-x-0 top-1/2 h-px origin-left -translate-y-1/2 bg-gold transition-transform duration-700',
                        i === index ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-50',
                      )}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="hidden text-[0.6rem] uppercase tracking-[0.26em] text-ink-inverse/40 sm:block">
                {paused ? 'Paused' : 'Scroll to explore'}
              </span>
              <div className="hidden h-8 w-px bg-ink-inverse/15 sm:block" />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={prev}
                  aria-label="Previous banner"
                  className="flex size-10 items-center justify-center border border-ink-inverse/25 text-ink-inverse transition-colors hover:border-gold hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                >
                  <Chevron direction="left" />
                </button>
                <button
                  type="button"
                  onClick={next}
                  aria-label="Next banner"
                  className="flex size-10 items-center justify-center border border-ink-inverse/25 text-ink-inverse transition-colors hover:border-gold hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                >
                  <Chevron direction="right" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <p className="sr-only" aria-live="polite">
        Slide {index + 1} of {slides.length}: {slide.title} {slide.accent}
      </p>
    </section>
  );
}

function Chevron({ direction }: { direction: 'left' | 'right' }) {
  return (
    <svg className="size-4" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d={direction === 'left' ? 'M15 6 9 12l6 6' : 'M9 6l6 6-6 6'}
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
