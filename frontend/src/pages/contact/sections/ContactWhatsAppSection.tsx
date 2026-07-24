import { motion } from 'framer-motion';
import { OptimizedImage } from '@/components/media/OptimizedImage';
import { Button, Section, SectionIntro } from '@/components/ui';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { usePublicContent } from '@/hooks/usePublicContent';
import { whatsappBanner } from '../data';

/**
 * Mid-page WhatsApp banner — full-bleed photo plane, different from the centered hero.
 */
export function ContactWhatsAppSection() {
  const reduced = usePrefersReducedMotion();
  const { whatsappHref } = usePublicContent();

  return (
    <Section tone="dark" contained={false} className="relative overflow-hidden py-0">
      <div className="relative min-h-[min(52vh,440px)] w-full md:min-h-[min(48vh,480px)]">
        <motion.div
          className="absolute inset-0"
          initial={reduced ? false : { opacity: 0 }}
          whileInView={reduced ? undefined : { opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        >
          <OptimizedImage
            src={whatsappBanner.image}
            alt={whatsappBanner.imageAlt}
            className="h-full w-full object-cover"
            width={1600}
            height={1000}
          />
          <div
            className="absolute inset-0 bg-gradient-to-r from-black via-black/75 to-black/35"
            aria-hidden
          />
        </motion.div>

        <div className="relative z-10 mx-auto flex min-h-[min(52vh,440px)] w-full max-w-7xl items-center px-4 py-16 sm:px-6 md:min-h-[min(48vh,480px)] md:py-20 lg:px-8">
          <motion.div
            className="max-w-lg"
            initial={reduced ? false : { opacity: 0, x: -18 }}
            whileInView={reduced ? undefined : { opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="font-heading text-xs uppercase tracking-[0.32em] text-gold">
              {whatsappBanner.eyebrow}
            </p>
            <SectionIntro
              tone="dark"
              className="mt-4"
              title={whatsappBanner.title}
              description={whatsappBanner.description}
            />
            <div className="mt-8">
              <Button
                variant="primary"
                size="lg"
                onClick={() => {
                  window.open(whatsappHref(), '_blank', 'noopener,noreferrer');
                }}
              >
                {whatsappBanner.cta}
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </Section>
  );
}
