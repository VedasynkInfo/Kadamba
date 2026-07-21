import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { OptimizedImage } from '@/components/media/OptimizedImage';
import { Button } from '@/components/ui';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { aboutHero } from '../data';

/**
 * Full-bleed About hero — brand-first, single composition.
 */
export function AboutHeroSection() {
  const navigate = useNavigate();
  const reduced = usePrefersReducedMotion();

  return (
    <section
      className="relative isolate w-full overflow-hidden bg-black text-cream"
      aria-label="About Kadamba's Designer Studio"
    >
      <div className="relative min-h-[min(88svh,880px)] w-full md:min-h-[calc(100svh-4.25rem)]">
        <motion.div
          className="absolute inset-0"
          initial={reduced ? false : { opacity: 0, scale: 1.06 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: reduced ? 0 : 1.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <OptimizedImage
            src={aboutHero.image}
            alt={aboutHero.alt}
            className="h-full w-full object-cover"
            width={2400}
            height={1600}
            priority
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

        <div className="relative z-10 mx-auto flex min-h-[min(88svh,880px)] w-full max-w-7xl flex-col justify-end px-4 pb-20 pt-28 sm:px-6 md:min-h-[calc(100svh-4.25rem)] md:pb-24 lg:px-8">
          <motion.div
            className="w-full max-w-2xl"
            initial={reduced ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: reduced ? 0 : 0.15 }}
          >
            <p className="font-heading text-4xl tracking-wide text-gold sm:text-5xl md:text-6xl lg:text-7xl">
              Kadamba
            </p>
            <h1 className="mt-4 font-heading text-2xl font-medium text-cream sm:text-3xl md:text-4xl">
              {aboutHero.headline}
            </h1>
            <p className="text-lede mt-5 text-cream/85">{aboutHero.copy}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button variant="primary" size="lg" onClick={() => navigate('/request-service')}>
                Request a consultation
              </Button>
              <Button
                variant="secondary"
                size="lg"
                className="!text-cream"
                onClick={() => navigate('/contact')}
              >
                Contact the studio
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
