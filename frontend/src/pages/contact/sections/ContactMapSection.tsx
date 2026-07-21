import { motion } from 'framer-motion';
import { Section, SectionIntro } from '@/components/ui';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { fadeUp } from '@/motion/variants';
import { studioContact } from '../data';

/**
 * Full-bleed Google Maps embed for the Kurnool studio area.
 */
export function ContactMapSection() {
  const reduced = usePrefersReducedMotion();

  return (
    <Section tone="dark" contained={false} className="overflow-hidden py-0">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 md:py-16 lg:px-8">
        <motion.div
          initial={reduced ? false : 'hidden'}
          whileInView={reduced ? undefined : 'visible'}
          viewport={{ once: true, margin: '-40px' }}
          variants={reduced ? undefined : fadeUp}
        >
          <SectionIntro
            tone="dark"
            title="Find us in Kurnool"
            description={studioContact.addressLines.join(' · ')}
            actions={
              <a
                href={studioContact.mapLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gold transition-colors hover:text-cream"
              >
                Open in Google Maps
              </a>
            }
          />
        </motion.div>
      </div>

      <div className="relative h-[min(56vh,420px)] w-full md:h-[min(62vh,520px)]">
        <iframe
          title="Kadamba's Designer Studio location map — Kurnool"
          src={studioContact.mapEmbedUrl}
          className="absolute inset-0 h-full w-full border-0 grayscale-[35%] contrast-[1.05]"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
        <div
          className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-gold/15"
          aria-hidden
        />
      </div>
    </Section>
  );
}
