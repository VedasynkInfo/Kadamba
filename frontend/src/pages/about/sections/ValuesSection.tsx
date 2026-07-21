import { motion } from 'framer-motion';
import { Section, SectionIntro } from '@/components/ui';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { fadeUp, staggerChildren } from '@/motion/variants';
import { values } from '../data';

/**
 * Studio values — trust, craftsmanship, personal fitting.
 */
export function ValuesSection() {
  const reduced = usePrefersReducedMotion();

  return (
    <Section tone="light" className="py-16 md:py-24">
      <SectionIntro
        title="What we value"
        description="The principles behind every bridal fitting and traditional ensemble at Kadamba."
      />

      <motion.ul
        className="mt-12 grid gap-10 md:grid-cols-3"
        variants={reduced ? undefined : staggerChildren}
        initial={reduced ? false : 'hidden'}
        whileInView={reduced ? undefined : 'visible'}
        viewport={{ once: true, amount: 0.25 }}
      >
        {values.map((item) => (
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
