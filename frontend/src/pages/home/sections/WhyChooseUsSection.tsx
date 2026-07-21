import { motion } from 'framer-motion';
import { Section, SectionIntro } from '@/components/ui';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { fadeUp, staggerChildren } from '@/motion/variants';
import { whyChooseUs } from '../data';

/**
 * Studio differentiators — one purpose, clear hierarchy.
 */
export function WhyChooseUsSection() {
  const reduced = usePrefersReducedMotion();

  return (
    <Section tone="light" className="py-16 md:py-24">
      <SectionIntro
        title="Why choose Kadamba"
        description="A studio practice built on craft, composure, and lasting material choices."
      />

      <motion.ul
        className="mt-12 grid gap-10 md:grid-cols-3"
        variants={reduced ? undefined : staggerChildren}
        initial={reduced ? false : 'hidden'}
        whileInView={reduced ? undefined : 'visible'}
        viewport={{ once: true, amount: 0.25 }}
      >
        {whyChooseUs.map((item) => (
          <motion.li key={item.id} variants={reduced ? undefined : fadeUp}>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Kadamba</p>
            <h3 className="mt-3 font-heading text-2xl leading-snug">{item.title}</h3>
            <p className="mt-3 text-base leading-relaxed text-black/70">{item.description}</p>
          </motion.li>
        ))}
      </motion.ul>
    </Section>
  );
}
