import { useScrollReveal } from '@/hooks/useScrollReveal';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { motion } from 'framer-motion';
import { Section, SectionIntro } from '@/components/ui';
import { fadeUp, staggerChildren } from '@/motion/variants';
import { fabricNotes } from '../data';

/**
 * The material vocabulary.
 *
 * Cloth first. A boutique that names its fabrics plainly — where they are
 * woven, what they are like — earns the question before it is asked, and it
 * gives a client something concrete to hold a dress against.
 */
export function FabricsSection() {
  const reduced = usePrefersReducedMotion();
  const listRef = useScrollReveal<HTMLUListElement>({ selector: '[data-reveal]', stagger: 0.1 });

  return (
    <Section tone="dark" className="py-16 md:py-24">
      <SectionIntro
        eyebrow="The cloth"
        title="What we cut, and why"
        description="Four fabrics do most of the work in this studio. We name the mill, the hand, and what the cloth will do once it is on you."
      />

      <motion.ul
        ref={listRef}
        className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-ink-inverse/10 bg-ink-inverse/10 md:mt-16 md:grid-cols-2"
        variants={reduced ? undefined : staggerChildren}
        initial={reduced ? false : 'hidden'}
        whileInView={reduced ? undefined : 'visible'}
        viewport={{ once: true, amount: 0.2 }}
      >
        {fabricNotes.map((note) => (
          <motion.li
            key={note.id}
            data-reveal
            variants={reduced ? undefined : fadeUp}
            className="on-dark bg-espresso p-7 md:p-9"
          >
            <p className="text-[0.65rem] uppercase tracking-[0.25em] text-gold/80">{note.origin}</p>
            <h3 className="mt-3 font-heading text-2xl text-ink-inverse">{note.name}</h3>
            <p className="mt-3 text-sm leading-relaxed text-ink-inverse/70">{note.description}</p>
          </motion.li>
        ))}
      </motion.ul>
    </Section>
  );
}
