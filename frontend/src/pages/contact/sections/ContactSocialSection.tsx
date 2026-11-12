import { motion } from 'framer-motion';
import { Section, SectionIntro } from '@/components/ui';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { usePublicContent } from '@/hooks/usePublicContent';
import { fadeUp, staggerChildren } from '@/motion/variants';

/**
 * Social presence — settings-driven, and absent until the studio has real
 * profiles. Linking to instagram.com/ is worse than showing no link at all.
 */
export function ContactSocialSection() {
  const reduced = usePrefersReducedMotion();
  const { settings } = usePublicContent();
  const socialLinks = settings.social ?? [];

  if (socialLinks.length === 0) return null;

  return (
    <Section tone="light" className="border-t border-line/8 py-16 md:py-20">
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
              className="font-heading text-xl text-ink transition-colors hover:text-ink/60 md:text-2xl"
            >
              {link.label}
            </a>
          </motion.li>
        ))}
      </motion.ul>
    </Section>
  );
}
