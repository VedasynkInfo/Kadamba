import { useState } from 'react';
import { motion } from 'framer-motion';
import { OptimizedImage } from '@/components/media/OptimizedImage';
import { Section, SectionIntro } from '@/components/ui';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { fadeUp, staggerChildren } from '@/motion/variants';
import { ImageLightbox } from '@/pages/home/sections/ImageLightbox';
import { cn } from '@/utils/cn';
import type { ServiceDetail, ServiceGalleryImage } from '../data';

interface ServiceGallerySectionProps {
  service: ServiceDetail;
}

/**
 * Portfolio-style gallery for the selected service.
 */
export function ServiceGallerySection({ service }: ServiceGallerySectionProps) {
  const reduced = usePrefersReducedMotion();
  const [active, setActive] = useState<ServiceGalleryImage | null>(null);

  return (
    <Section tone="dark" className="overflow-hidden py-16 md:py-24">
      <SectionIntro
        tone="dark"
        title={`${service.title} gallery`}
        description="Looks and finishing details from our Kurnool boutique — open any image for a closer view."
      />

      <motion.ul
        className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        variants={reduced ? undefined : staggerChildren}
        initial={reduced ? false : 'hidden'}
        whileInView={reduced ? undefined : 'visible'}
        viewport={{ once: true, amount: 0.15 }}
      >
        {service.gallery.map((item) => (
          <motion.li key={item.id} variants={reduced ? undefined : fadeUp}>
            <button
              type="button"
              onClick={() => setActive(item)}
              className={cn(
                'group relative block aspect-[4/5] w-full overflow-hidden text-left',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold',
              )}
            >
              <OptimizedImage
                src={item.image}
                alt={item.alt}
                className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.05]"
                width={800}
                height={1000}
              />
              <div
                className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-90"
                aria-hidden
              />
              <span className="absolute inset-x-0 bottom-0 p-4 font-heading text-lg text-cream">
                {item.title}
              </span>
            </button>
          </motion.li>
        ))}
      </motion.ul>

      <ImageLightbox
        open={Boolean(active)}
        onClose={() => setActive(null)}
        title={active?.title ?? ''}
        image={active?.image ?? ''}
        alt={active?.alt ?? ''}
      />
    </Section>
  );
}
