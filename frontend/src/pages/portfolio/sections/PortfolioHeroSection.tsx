import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { OptimizedImage } from '@/components/media/OptimizedImage';
import { Button } from '@/components/ui';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { portfolioHero } from '../data';

/**
 * Editorial portfolio hero — centered brand composition, not the older left-stack banner.
 * Full-bleed image, soft vignette, vertical side label, GSAP reveal.
 */
export function PortfolioHeroSection() {
  const navigate = useNavigate();
  const reduced = usePrefersReducedMotion();
  const rootRef = useRef<HTMLElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const typeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reduced || !rootRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        mediaRef.current,
        { scale: 1.12, opacity: 0.35 },
        { scale: 1, opacity: 1, duration: 1.6, ease: 'power3.out' },
      );
      const revealNodes = typeRef.current?.querySelectorAll('[data-reveal]');
      if (revealNodes?.length) {
        gsap.fromTo(
          revealNodes,
          { y: 36, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.85,
            stagger: 0.1,
            delay: 0.25,
            ease: 'power3.out',
          },
        );
      }
    }, rootRef);

    return () => ctx.revert();
  }, [reduced]);

  return (
    <section
      ref={rootRef}
      className="relative isolate w-full overflow-hidden bg-black text-cream"
      aria-label="Portfolio of Kadamba's Designer Studio"
    >
      <div className="relative min-h-[min(94svh,960px)] w-full md:min-h-[calc(100svh-4.25rem)]">
        <div ref={mediaRef} className="absolute inset-0">
          <OptimizedImage
            src={portfolioHero.image}
            alt={portfolioHero.alt}
            className="h-full w-full object-cover object-center"
            width={2400}
            height={1600}
            priority
          />
          {/* Soft cinematic vignette — not the older left-heavy wash */}
          <div
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.35)_55%,rgba(0,0,0,0.78)_100%)]"
            aria-hidden
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-black/55"
            aria-hidden
          />
        </div>

        {/* Vertical editorial label */}
        <p
          className="pointer-events-none absolute left-3 top-1/2 hidden -translate-y-1/2 rotate-180 font-heading text-[0.65rem] uppercase tracking-[0.55em] text-gold/70 [writing-mode:vertical-rl] sm:left-5 md:block md:left-8"
          aria-hidden
        >
          Portfolio
        </p>

        <div className="relative z-10 mx-auto flex min-h-[min(94svh,960px)] w-full max-w-5xl flex-col items-center justify-center px-6 pb-16 pt-28 text-center sm:px-8 md:min-h-[calc(100svh-4.25rem)] md:pb-20 lg:px-12">
          <div ref={typeRef} className="w-full max-w-2xl">
            <p
              data-reveal
              className="font-heading text-[0.7rem] uppercase tracking-[0.42em] text-gold/90"
            >
              {portfolioHero.locationLine}
            </p>

            <p
              data-reveal
              className="mt-8 font-heading text-6xl leading-none tracking-[0.08em] text-cream sm:text-7xl md:text-8xl lg:text-[7.5rem]"
            >
              {portfolioHero.brandName}
            </p>

            <span
              data-reveal
              className="mx-auto mt-6 block h-px w-16 bg-gold/60"
              aria-hidden
            />

            <h1
              data-reveal
              className="mt-7 font-heading text-xl font-medium leading-snug text-cream/95 sm:text-2xl md:text-[1.85rem]"
            >
              {portfolioHero.headline}
            </h1>

            <p data-reveal className="text-lede mx-auto mt-5 max-w-md text-cream/80">
              {portfolioHero.copy}
            </p>

            <div data-reveal className="mt-10 flex flex-wrap justify-center gap-3">
              <Button
                variant="primary"
                size="lg"
                onClick={() => {
                  document.getElementById('portfolio-catalog')?.scrollIntoView({
                    behavior: reduced ? 'auto' : 'smooth',
                  });
                }}
              >
                View selected work
              </Button>
              <Button
                variant="secondary"
                size="lg"
                className="!text-cream"
                onClick={() => navigate('/request-service')}
              >
                Start a project
              </Button>
            </div>
          </div>
        </div>

        {/* Bottom edge cue */}
        <motion.div
          className="pointer-events-none absolute inset-x-0 bottom-6 flex justify-center"
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: reduced ? 0 : 1.2, duration: 0.6 }}
          aria-hidden
        >
          <span className="h-10 w-px bg-gradient-to-b from-gold/50 to-transparent" />
        </motion.div>
      </div>
    </section>
  );
}
