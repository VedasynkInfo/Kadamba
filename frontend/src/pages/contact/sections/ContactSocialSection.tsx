import { motion } from 'framer-motion';
import { Section, SectionIntro } from '@/components/ui';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { fadeUp, staggerChildren } from '@/motion/variants';
import { socialLinks } from '../data';

/**
 * Social presence — simple link row, matching brand footer tone.
 */
export function ContactSocialSection() {
  const reduced = usePrefersReducedMotion();

  return (
    <Section tone="light" className="border-t border-black/8 py-16 md:py-20">
      <SectionIntro
        title="Follow the studio"
        description="Bridal looks, festive fittings, and atelier moments from Kurnool."
        align="center"
      />

      <motion.ul
        className="mt-10 flex flex-wrap items-center justify-center gap-x-10 gap-y-4"
        variants={reduced ? undefined : staggerChildren}
        initial={reduced ? false : 'hidden'}
        whileInView={reduced ? undefined : 'visible'}
        viewport={{ once: true }}
      >
        {socialLinks.map((link) => (
          <motion.li key={link.label} variants={reduced ? undefined : fadeUp}>
            <a
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-heading text-xl text-black transition-colors hover:text-black/60 md:text-2xl"
            >
              {link.label}
            </a>
          </motion.li>
        ))}
      </motion.ul>
    </Section>
  );
}
