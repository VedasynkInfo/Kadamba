import { motion } from 'framer-motion';
import { OptimizedImage } from '@/components/media/OptimizedImage';
import { Section, SectionIntro } from '@/components/ui';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { fadeUp, staggerChildren } from '@/motion/variants';
import type { PortfolioProject } from '../data';

interface PortfolioGallerySectionProps {
  project: PortfolioProject;
}

/**
 * Image-led project gallery — no card chrome.
 */
export function PortfolioGallerySection({ project }: PortfolioGallerySectionProps) {
  const reduced = usePrefersReducedMotion();

  if (project.gallery.length === 0) return null;

  return (
    <Section tone="light" className="border-t border-black/8 py-16 md:py-24">
      <SectionIntro
        title="Gallery"
        description="Details from fittings, fabric, and finishing."
      />
      <motion.ul
        className="mt-12 grid list-none grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        variants={reduced ? undefined : staggerChildren}
        initial={reduced ? false : 'hidden'}
        whileInView={reduced ? undefined : 'visible'}
        viewport={{ once: true, margin: '-6%' }}
      >
        {project.gallery.map((item, index) => (
          <motion.li
            key={item.id}
            variants={reduced ? undefined : fadeUp}
            className={index === 0 ? 'sm:col-span-2 lg:col-span-2' : undefined}
          >
            <figure className="group relative overflow-hidden bg-black/5">
              <OptimizedImage
                src={item.image}
                alt={item.alt}
                className={`w-full object-cover transition duration-700 group-hover:scale-[1.03] ${
                  index === 0 ? 'aspect-[16/10]' : 'aspect-[4/5]'
                }`}
                width={index === 0 ? 1400 : 800}
                height={index === 0 ? 875 : 1000}
              />
              {item.caption ? (
                <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 font-heading text-sm text-cream">
                  {item.caption}
                </figcaption>
              ) : null}
            </figure>
          </motion.li>
        ))}
      </motion.ul>
    </Section>
  );
}
