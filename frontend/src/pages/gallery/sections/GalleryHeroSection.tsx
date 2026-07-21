import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { OptimizedImage } from '@/components/media/OptimizedImage';
import { Button } from '@/components/ui';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { galleryHero } from '../data';

/**
 * Editorial lookbook banner — centered composition, outline brand mark,
 * GSAP aperture reveal. Intentionally unlike About/Services bottom-left heroes.
 */
export function GalleryHeroSection() {
  const reduced = usePrefersReducedMotion();
  const rootRef = useRef<HTMLElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const brandRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (reduced || !rootRef.current || !mediaRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        mediaRef.current,
        { clipPath: 'inset(18% 12% 18% 12%)', scale: 1.08 },
        {
          clipPath: 'inset(0% 0% 0% 0%)',
          scale: 1,
          duration: 1.45,
          ease: 'power3.out',
        },
      );

      if (brandRef.current) {
        gsap.fromTo(
          brandRef.current,
          { opacity: 0, letterSpacing: '0.55em', y: 18 },
          {
            opacity: 1,
            letterSpacing: '0.18em',
            y: 0,
            duration: 1.1,
            delay: 0.35,
            ease: 'power2.out',
          },
        );
      }

      const media = mediaRef.current;
      if (!media) return;

      gsap.to(media.querySelector('img'), {
        scale: 1.06,
        duration: 14,
        ease: 'none',
        delay: 1.2,
      });
    }, rootRef);

    return () => ctx.revert();
  }, [reduced]);

  return (
    <section
      ref={rootRef}
      className="relative isolate w-full overflow-hidden bg-black text-cream"
      aria-label="Gallery lookbook — Kadamba's Designer Studio"
    >
      <div className="relative min-h-[min(90svh,900px)] w-full md:min-h-[calc(100svh-4.25rem)]">
        <div ref={mediaRef} className="absolute inset-0 will-change-transform">
          <OptimizedImage
            src={galleryHero.image}
            alt={galleryHero.alt}
            className="h-full w-full origin-center object-cover object-[center_35%]"
            width={2400}
            height={1600}
            priority
          />
          {/* Soft cinematic vignette — even wash, not left-weighted like older pages */}
          <div
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.15)_0%,rgba(0,0,0,0.55)_55%,rgba(0,0,0,0.88)_100%)]"
            aria-hidden
          />
          <div
            className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/70"
            aria-hidden
          />
        </div>

        {/* Centered editorial stack */}
        <div className="relative z-10 mx-auto flex min-h-[min(90svh,900px)] w-full max-w-5xl flex-col items-center justify-center px-6 py-28 text-center sm:px-8 md:min-h-[calc(100svh-4.25rem)] md:py-32">
          <motion.p
            className="font-heading text-[0.65rem] uppercase tracking-[0.42em] text-gold/90 sm:text-xs"
            initial={reduced ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: reduced ? 0 : 0.2 }}
          >
            {galleryHero.locationLine}
          </motion.p>

          <div className="mt-8 flex w-full max-w-3xl flex-col items-center gap-5">
            <span className="h-px w-16 bg-gold/50" aria-hidden />
            <p
              ref={brandRef}
              className="font-heading text-[clamp(3.25rem,12vw,8.5rem)] leading-none tracking-[0.18em] text-transparent"
              style={{
                WebkitTextStroke: '1.25px rgba(255, 215, 0, 0.85)',
              }}
            >
              {galleryHero.brand}
            </p>
            <span className="h-px w-16 bg-gold/50" aria-hidden />
          </div>

          <motion.div
            className="mt-10 max-w-md"
            initial={reduced ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.7,
              ease: [0.22, 1, 0.36, 1],
              delay: reduced ? 0 : 0.55,
            }}
          >
            <h1 className="font-heading text-2xl font-medium text-cream sm:text-3xl md:text-4xl">
              {galleryHero.headline}
            </h1>
            <p className="text-lede mt-4 text-cream/80">{galleryHero.copy}</p>
            <div className="mt-9 flex justify-center">
              <Button
                variant="primary"
                size="lg"
                onClick={() => {
                  document.getElementById('gallery-masonry')?.scrollIntoView({
                    behavior: reduced ? 'auto' : 'smooth',
                  });
                }}
              >
                {galleryHero.ctaLabel}
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
