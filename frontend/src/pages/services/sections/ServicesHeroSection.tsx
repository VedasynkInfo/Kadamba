import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { OptimizedImage } from '@/components/media/OptimizedImage';
import { Button } from '@/components/ui';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { servicesHero } from '../data';

/**
 * Ethnic-classical Services hero — full-bleed craft imagery with ornamental frame.
 */
export function ServicesHeroSection() {
  const navigate = useNavigate();
  const reduced = usePrefersReducedMotion();

  return (
    <section
      className="relative isolate w-full overflow-hidden bg-black text-cream"
      aria-label="Services at Kadamba's Designer Studio"
    >
      <div className="relative min-h-[min(92svh,920px)] w-full md:min-h-[calc(100svh-4.25rem)]">
        <motion.div
          className="absolute inset-0"
          initial={reduced ? false : { opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: reduced ? 0 : 1.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <OptimizedImage
            src={servicesHero.image}
            alt={servicesHero.alt}
            className="h-full w-full object-cover object-center"
            width={2400}
            height={1600}
            priority
          />
          {/* Warm classical wash — deep ink edges, soft gold centre glow */}
          <div
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_70%,rgba(255,215,0,0.14),transparent_50%),linear-gradient(105deg,rgba(0,0,0,0.88)_0%,rgba(0,0,0,0.55)_42%,rgba(0,0,0,0.35)_100%)]"
            aria-hidden
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/50"
            aria-hidden
          />
          {/* Subtle ethnic lattice pattern */}
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0L60 30L30 60L0 30Z' fill='none' stroke='%23FFD700' stroke-width='0.6'/%3E%3Ccircle cx='30' cy='30' r='3' fill='none' stroke='%23FFD700' stroke-width='0.5'/%3E%3C/svg%3E")`,
            }}
            aria-hidden
          />
        </motion.div>

        {/* Classical double-line frame */}
        <div
          className="pointer-events-none absolute inset-4 border border-gold/25 sm:inset-6 md:inset-8"
          aria-hidden
        >
          <div className="absolute inset-2 border border-gold/15" />
        </div>

        <div className="relative z-10 mx-auto flex min-h-[min(92svh,920px)] w-full max-w-7xl flex-col justify-end px-6 pb-20 pt-28 sm:px-8 md:min-h-[calc(100svh-4.25rem)] md:pb-24 lg:px-12">
          <motion.div
            className="w-full max-w-xl"
            initial={reduced ? false : { opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1], delay: reduced ? 0 : 0.18 }}
          >
            <div className="flex items-center gap-3">
              <span className="h-px w-8 bg-gold/70" aria-hidden />
              <p className="font-heading text-xs uppercase tracking-[0.35em] text-gold">
                {servicesHero.locationLine}
              </p>
            </div>

            <p className="mt-6 font-heading text-5xl leading-none tracking-wide text-gold sm:text-6xl md:text-7xl lg:text-8xl">
              Kadamba
            </p>

            <h1 className="mt-5 max-w-lg font-heading text-2xl font-medium leading-snug text-cream sm:text-3xl md:text-[2.15rem]">
              {servicesHero.headline}
            </h1>

            <p className="text-lede mt-5 max-w-md text-cream/85">{servicesHero.copy}</p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Button
                variant="primary"
                size="lg"
                onClick={() => {
                  document.getElementById('services-catalog')?.scrollIntoView({
                    behavior: reduced ? 'auto' : 'smooth',
                  });
                }}
              >
                Explore services
              </Button>
              <Button
                variant="secondary"
                size="lg"
                className="!text-cream"
                onClick={() => navigate('/request-service')}
              >
                Book consultation
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
