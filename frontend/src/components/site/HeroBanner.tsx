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

const AUTO_MS = 3000;

const MARQUEE = [
  'Bridal couture',
  'Maggam work',
  'Designer blouses',
  'Custom tailoring',
  'Saree fall & pico',
  'Kurnool atelier',
];

/**
 * The home hero.
 *
 * A split editorial stage: the collection photograph holds the right half, the
 * type owns the left, and a floating index lets a visitor move between the five
 * stories without leaving the fold. The bottom marquee turns the studio's
 * disciplines into a moving signature rather than a row of static pills.
 *
 * The carousel behaviour is still ordinary and correct: it pauses on hover and
 * focus, supports arrow keys and swipe, exposes a tablist, and respects
 * reduced motion.
 */
export function HeroBanner({ slides }: { slides: BannerSlide[] }) {
  const navigate = useNavigate();
  const { whatsappHref } = usePublicContent();
  const reduced = usePrefersReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const touchStartX = useRef<number | null>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start start', 'end start'],
  });
  const imageY = useTransform(scrollYProgress, [0, 1], ['0%', '14%']);
  const imageScale = useTransform(scrollYProgress, [0, 1], [1, 1.08]);

  const { index, goTo, next, prev, paused, pauseProps } = useCarousel({
    count: slides.length,
    interval: AUTO_MS,
    disabled: reduced,
  });

  const slide = slides[index] ?? slides[0];

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
      className="on-dark relative isolate min-h-[100svh] overflow-hidden bg-[#120d0b] text-ink-inverse"
      aria-roledescription="carousel"
      aria-label="Kadamba featured work"
      tabIndex={0}
      onKeyDown={onKeyDown}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      {...pauseProps}
    >
      {/* ── The photograph stage ─────────────────────────────────────── */}
      <div className="absolute inset-0 lg:left-[42%]" aria-hidden>
        <motion.div
          className="absolute inset-0 will-change-transform"
          style={reduced ? undefined : { y: imageY, scale: imageScale }}
        >
        <AnimatePresence initial={false}>
          <motion.div
            key={slide.id}
            className="absolute inset-0"
            initial={reduced ? false : { opacity: 0, scale: 1.08, clipPath: 'inset(0 0 0 100%)' }}
            animate={{ opacity: 1, scale: 1, clipPath: 'inset(0 0 0 0%)' }}
            exit={reduced ? undefined : { opacity: 0, scale: 1.02, clipPath: 'inset(0 100% 0 0)' }}
            transition={{ duration: reduced ? 0 : 1.35, ease: [0.22, 1, 0.36, 1] }}
          >
            {slide.video && !reduced ? (
              <video
                className="h-full w-full object-cover"
                src={slide.video}
                poster={slide.image}
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
              />
            ) : (
              <OptimizedImage
                src={slide.image}
                alt=""
                priority={index === 0}
                sizes="(min-width: 1024px) 60vw, 100vw"
                width={2000}
                height={1250}
                className="h-full w-full scale-[1.03] object-cover"
              />
            )}
          </motion.div>
        </AnimatePresence>
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#120d0b] via-[#120d0b]/78 to-[#120d0b]/10 lg:from-[#120d0b] lg:via-[#120d0b]/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#120d0b] via-transparent to-[#120d0b]/40" />
      </div>

      {/* A very large, very quiet index in the margin. */}
      <span
        className="pointer-events-none absolute -right-4 bottom-24 z-0 hidden select-none font-heading text-[22rem] leading-none text-transparent [-webkit-text-stroke:1px_rgba(212,166,42,0.16)] xl:block"
        aria-hidden
      >
        {String(index + 1).padStart(2, '0')}
      </span>

      <div className="relative z-10 flex min-h-[100svh] flex-col">
        <div className="house-container grid flex-1 items-center gap-12 pb-12 pt-32 lg:grid-cols-[1.08fr_0.92fr] lg:pt-36">
          <div className="max-w-2xl">
            <motion.div
              initial={reduced ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-center gap-4"
            >
              <span className="h-px w-10 bg-gold/70" aria-hidden />
              <p className="text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-gold">
                {slide.kicker}
              </p>
              <span className="hidden h-px w-10 bg-gold/30 sm:block" aria-hidden />
              <span className="hidden font-mono text-[0.58rem] tabular-nums tracking-[0.2em] text-ink-inverse/60 sm:block">
                {String(index + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
              </span>
            </motion.div>

            <div
              id={`hero-panel-${slide.id}`}
              role="tabpanel"
              aria-labelledby={`hero-tab-${slide.id}`}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={slide.id}
                  initial={reduced ? false : { opacity: 0, y: 28 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={reduced ? undefined : { opacity: 0, y: -18 }}
                  transition={{ duration: 0.68, ease: [0.22, 1, 0.36, 1] }}
                >
                  <h1 className="mt-7 max-w-[12ch] font-heading text-[clamp(3.2rem,8.6vw,8.2rem)] font-light leading-[0.88] tracking-[-0.045em] text-ink-inverse">
                    {slide.title}
                    <span className="mt-1 block italic text-gold">{slide.accent}</span>
                  </h1>

                  <p className="mt-8 max-w-md text-[0.98rem] leading-[1.8] text-ink-inverse/75">
                    {slide.copy}
                  </p>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Button
                variant="primary"
                size="lg"
                className="group rounded-none px-7 py-3.5 text-[0.68rem] font-semibold uppercase tracking-[0.2em]"
                onClick={() => navigate(slide.href)}
              >
                {slide.cta}
                <span
                  className="ml-2 inline-block transition-transform duration-300 group-hover:translate-x-1"
                  aria-hidden
                >
                  →
                </span>
              </Button>
              <Button
                variant="secondary"
                size="lg"
                className="rounded-none border-ink-inverse/30 px-7 py-3.5 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-ink-inverse hover:border-gold hover:text-gold"
                onClick={() => navigate('/request-service')}
              >
                Book a fitting
              </Button>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2">
              <a
                href={whatsappHref()}
                target="_blank"
                rel="noopener noreferrer"
                className="link-under text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-ink-inverse/60 transition-colors hover:text-gold"
              >
                WhatsApp the studio
              </a>
              <span className="hidden text-[0.55rem] uppercase tracking-[0.22em] text-ink-inverse/60 sm:inline">
                Reply within one working day
              </span>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-ink-inverse/15 pt-5 text-[0.58rem] font-semibold uppercase tracking-[0.24em] text-ink-inverse/60">
              <span>Bridal lehengas</span>
              <span className="text-gold/60" aria-hidden>
                /
              </span>
              <span>Designer blouses</span>
              <span className="text-gold/60" aria-hidden>
                /
              </span>
              <span>Custom tailoring</span>
            </div>
          </div>

          {/* ── The floating index ─────────────────────────────────────── */}
          <div className="hidden lg:flex lg:justify-end">
            <motion.div
              initial={reduced ? false : { opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.9, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-sm border border-white/15 bg-black/30 p-5 backdrop-blur-xl"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <span className="text-[0.58rem] font-semibold uppercase tracking-[0.26em] text-ink-inverse/60">
                  Collection index
                </span>
                <span className="font-mono text-[0.6rem] tabular-nums tracking-[0.18em] text-gold">
                  {String(index + 1).padStart(2, '0')} / {String(slides.length).padStart(2, '0')}
                </span>
              </div>
              <div className="mt-3 h-px overflow-hidden bg-white/10" aria-hidden>
                <motion.span
                  key={index}
                  className="block h-px origin-left bg-gold"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: AUTO_MS / 1000, ease: 'linear' }}
                />
              </div>

              <div role="tablist" aria-label="Featured slides" aria-orientation="vertical" className="mt-2">
                {slides.map((item, i) => {
                  const active = i === index;
                  return (
                    <button
                      key={item.id}
                      id={`hero-tab-${item.id}`}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      aria-controls={active ? `hero-panel-${item.id}` : undefined}
                      onClick={() => goTo(i)}
                      className={cn(
                        'group flex w-full items-baseline gap-4 border-b border-white/10 py-3.5 text-left last:border-0',
                        active ? 'text-ink-inverse' : 'text-ink-inverse/60 hover:text-ink-inverse/85',
                      )}
                    >
                      <span
                        className={cn(
                          'font-mono text-[0.58rem] tabular-nums tracking-[0.18em] transition-colors',
                          active ? 'text-gold' : 'text-ink-inverse/60',
                        )}
                      >
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="flex-1">
                        <span
                          className={cn(
                            'block font-heading text-lg leading-tight transition-colors',
                            active ? 'text-ink-inverse' : 'text-ink-inverse/70',
                          )}
                        >
                          {item.title}
                        </span>
                        <span className="mt-0.5 block text-[0.55rem] uppercase tracking-[0.2em] text-ink-inverse/60">
                          {item.kicker}
                        </span>
                      </span>
                      <span
                        className={cn(
                          'h-px transition-all duration-500',
                          active ? 'w-8 bg-gold' : 'w-5 bg-ink-inverse/30 group-hover:bg-ink-inverse/60',
                        )}
                        aria-hidden
                      />
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 flex items-center justify-between">
                <span className="text-[0.55rem] uppercase tracking-[0.22em] text-ink-inverse/60">
                  {paused ? 'Paused' : 'Auto · 3s'}
                </span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={prev}
                    aria-label="Previous banner"
                    className="flex size-9 items-center justify-center border border-white/20 text-ink-inverse transition-colors hover:border-gold hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                  >
                    <Chevron direction="left" />
                  </button>
                  <button
                    type="button"
                    onClick={next}
                    aria-label="Next banner"
                    className="flex size-9 items-center justify-center border border-white/20 text-ink-inverse transition-colors hover:border-gold hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                  >
                    <Chevron direction="right" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* ── The moving signature ─────────────────────────────────────── */}
        <div className="marquee relative border-y border-white/10 bg-black/25 py-3" aria-hidden>
          {[0, 1].map((copy) => (
            <div key={copy} className="marquee-track">
              {MARQUEE.map((word) => (
                <span
                  key={`${copy}-${word}`}
                  className="flex items-center gap-5 whitespace-nowrap px-5 text-[0.6rem] font-semibold uppercase tracking-[0.28em] text-ink-inverse/60"
                >
                  {word}
                  <span className="text-gold/60" aria-hidden>
                    ✦
                  </span>
                </span>
              ))}
            </div>
          ))}
        </div>

        {/* Mobile progress / controls */}
        <div className="flex items-center justify-between gap-4 px-6 pb-6 pt-4 lg:hidden">
          <div className="flex items-center gap-3">
            <span className="font-heading text-lg tabular-nums text-ink-inverse">
              {String(index + 1).padStart(2, '0')}
              <span className="ml-1 text-xs text-ink-inverse/60">/ {String(slides.length).padStart(2, '0')}</span>
            </span>
            <div className="flex gap-1.5">
              {slides.map((item, i) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`Show slide ${i + 1}: ${item.title} ${item.accent}`}
                  aria-current={i === index ? 'true' : undefined}
                  className="group relative h-5 w-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
                >
                  <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-ink-inverse/25" />
                  <span
                    className={cn(
                      'absolute inset-x-0 top-1/2 h-px origin-left -translate-y-1/2 bg-gold transition-transform duration-700',
                      i === index ? 'scale-x-100' : 'scale-x-0',
                    )}
                  />
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={prev}
              aria-label="Previous banner"
              className="flex size-9 items-center justify-center border border-white/20 text-ink-inverse focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              <Chevron direction="left" />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Next banner"
              className="flex size-9 items-center justify-center border border-white/20 text-ink-inverse focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              <Chevron direction="right" />
            </button>
          </div>
        </div>
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
