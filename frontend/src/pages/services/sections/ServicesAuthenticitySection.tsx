import { motion } from 'framer-motion';
import { OptimizedImage } from '@/components/media/OptimizedImage';
import { Section, SectionIntro } from '@/components/ui';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { fadeUp, staggerChildren } from '@/motion/variants';
import { servicesAuthenticity } from '../data';

/**
 * Studio authenticity — craft pillars that ground the services page in real atelier practice.
 */
export function ServicesAuthenticitySection() {
  const reduced = usePrefersReducedMotion();

  return (
    <Section tone="dark" className="relative overflow-hidden py-16 md:py-24">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M20 2v36M2 20h36' stroke='%23FFD700' stroke-width='0.4'/%3E%3C/svg%3E")`,
        }}
        aria-hidden
      />

      <div className="relative grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
        <motion.div
          className="relative aspect-[4/5] w-full overflow-hidden"
          initial={reduced ? false : { opacity: 0, y: 24 }}
          whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <OptimizedImage
            src={servicesAuthenticity.image}
            alt={servicesAuthenticity.imageAlt}
            className="h-full w-full object-cover"
            width={1600}
            height={2000}
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"
            aria-hidden
          />
          <p className="absolute bottom-5 left-5 right-5 font-heading text-sm uppercase tracking-[0.28em] text-gold">
            Hand finish · Kurnool atelier
          </p>
        </motion.div>

        <div>
          <SectionIntro
            tone="dark"
            title={servicesAuthenticity.title}
            description={servicesAuthenticity.lede}
          />

          <motion.ul
            className="mt-10 space-y-8"
            variants={reduced ? undefined : staggerChildren}
            initial={reduced ? false : 'hidden'}
            whileInView={reduced ? undefined : 'visible'}
            viewport={{ once: true, amount: 0.2 }}
          >
            {servicesAuthenticity.pillars.map((pillar, index) => (
              <motion.li key={pillar.id} variants={reduced ? undefined : fadeUp}>
                <div className="flex gap-4">
                  <span className="font-heading text-sm text-gold/80" aria-hidden>
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <h3 className="font-heading text-xl text-cream sm:text-2xl">{pillar.title}</h3>
                    <p className="mt-2 text-base leading-relaxed text-cream/70">
                      {pillar.description}
                    </p>
                  </div>
                </div>
              </motion.li>
            ))}
          </motion.ul>
        </div>
      </div>
    </Section>
  );
}
