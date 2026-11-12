import { motion } from 'framer-motion';
import { Section, SectionIntro } from '@/components/ui';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { usePublicContent } from '@/hooks/usePublicContent';
import { fadeUp } from '@/motion/variants';
import { studioContact } from '../data';

/**
 * Full-bleed Google Maps embed for the Kurnool studio area.
 */
export function ContactMapSection() {
  const reduced = usePrefersReducedMotion();
  const { settings } = usePublicContent();
  const mapEmbedUrl = settings.mapEmbedUrl || studioContact.mapEmbedUrl;
  const mapLink = settings.mapLink || studioContact.mapLink;
  const addressLines =
    settings.addressLines.filter(Boolean).length > 0
      ? settings.addressLines
      : studioContact.addressLines;

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
            description={addressLines.join(' · ')}
            actions={
              <a
                href={mapLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gold transition-colors hover:text-ink-inverse"
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
          src={mapEmbedUrl}
          className="absolute inset-0 h-full w-full border-0 grayscale-[35%] contrast-[1.05]"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
        <div
          className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-focus/15"
          aria-hidden
        />
      </div>
    </Section>
  );
}
