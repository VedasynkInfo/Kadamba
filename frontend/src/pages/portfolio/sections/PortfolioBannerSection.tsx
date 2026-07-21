import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { OptimizedImage } from '@/components/media/OptimizedImage';
import { Button } from '@/components/ui';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { brand, type PortfolioProject } from '../data';

interface PortfolioBannerSectionProps {
  project: PortfolioProject;
}

/**
 * Project detail banner — magazine-style bottom title band, not the older left-stack hero.
 */
export function PortfolioBannerSection({ project }: PortfolioBannerSectionProps) {
  const navigate = useNavigate();
  const reduced = usePrefersReducedMotion();
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (reduced || !rootRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '[data-banner-media]',
        { scale: 1.08, opacity: 0.4 },
        { scale: 1, opacity: 1, duration: 1.35, ease: 'power3.out' },
      );
      gsap.fromTo(
        '[data-banner-copy]',
        { y: 40, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, delay: 0.2, ease: 'power3.out' },
      );
    }, rootRef);

    return () => ctx.revert();
  }, [reduced, project.slug]);

  return (
    <section
      ref={rootRef}
      className="relative isolate w-full overflow-hidden bg-black text-cream"
      aria-label={`${project.title} — Kadamba portfolio`}
    >
      <div className="relative min-h-[min(90svh,900px)] w-full md:min-h-[calc(100svh-4.25rem)]">
        <div data-banner-media className="absolute inset-0">
          <OptimizedImage
            src={project.bannerImage}
            alt={project.bannerAlt}
            className="h-full w-full object-cover"
            width={2400}
            height={1600}
            priority
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/30"
            aria-hidden
          />
        </div>

        {/* Watermark brand — subtle, behind copy */}
        <p
          className="pointer-events-none absolute inset-x-0 top-[18%] text-center font-heading text-[12vw] leading-none tracking-[0.12em] text-cream/[0.06] select-none md:top-[14%] md:text-[9vw]"
          aria-hidden
        >
          {brand.shortName}
        </p>

        <div className="relative z-10 mx-auto flex min-h-[min(90svh,900px)] w-full max-w-7xl flex-col justify-end px-6 pb-16 pt-28 sm:px-8 md:min-h-[calc(100svh-4.25rem)] md:pb-20 lg:px-12">
          <div data-banner-copy className="w-full border-t border-gold/25 pt-8 md:pt-10">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[0.65rem] uppercase tracking-[0.28em] text-gold/90">
                  <span>{project.category}</span>
                  <span className="text-cream/30" aria-hidden>
                    /
                  </span>
                  <span className="text-cream/70">
                    {project.year} · {project.location}
                  </span>
                </div>
                <h1 className="mt-4 font-heading text-3xl font-medium leading-tight text-cream sm:text-4xl md:text-5xl lg:text-[3.25rem]">
                  {project.title}
                </h1>
                <p className="text-lede mt-4 max-w-xl text-cream/80">{project.summary}</p>
              </div>

              <div className="flex shrink-0 flex-wrap gap-3">
                <Button variant="primary" size="lg" onClick={() => navigate('/request-service')}>
                  {project.ctaLabel}
                </Button>
                <Button
                  variant="secondary"
                  size="lg"
                  className="!text-cream"
                  onClick={() => navigate('/portfolio')}
                >
                  All projects
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
