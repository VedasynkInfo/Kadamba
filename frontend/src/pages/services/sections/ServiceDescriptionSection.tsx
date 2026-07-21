import { motion } from 'framer-motion';
import { OptimizedImage } from '@/components/media/OptimizedImage';
import { Section, SectionIntro } from '@/components/ui';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { fadeUp } from '@/motion/variants';
import type { ServiceDetail } from '../data';

interface ServiceDescriptionSectionProps {
  service: ServiceDetail;
}

/**
 * Rich description for a single service.
 */
export function ServiceDescriptionSection({ service }: ServiceDescriptionSectionProps) {
  const reduced = usePrefersReducedMotion();

  return (
    <Section tone="light" className="py-16 md:py-24">
      <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
        <motion.div
          variants={reduced ? undefined : fadeUp}
          initial={reduced ? false : 'hidden'}
          whileInView={reduced ? undefined : 'visible'}
          viewport={{ once: true, amount: 0.25 }}
        >
          <SectionIntro
            title={`About ${service.title.toLowerCase()}`}
            description={service.summary}
          />
          <div className="mt-8 space-y-4">
            {service.description.map((paragraph) => (
              <p key={paragraph.slice(0, 40)} className="text-base leading-relaxed text-black/70">
                {paragraph}
              </p>
            ))}
          </div>
        </motion.div>

        <motion.div
          className="relative aspect-[4/5] w-full overflow-hidden md:aspect-[5/6]"
          initial={reduced ? false : { opacity: 0, y: 28 }}
          whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <OptimizedImage
            src={service.cardImage}
            alt={service.bannerAlt}
            className="h-full w-full object-cover"
            width={1600}
            height={2000}
          />
        </motion.div>
      </div>
    </Section>
  );
}
