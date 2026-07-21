import { motion } from 'framer-motion';
import { Section, SectionIntro } from '@/components/ui';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { fadeUp, staggerChildren } from '@/motion/variants';
import { timeline } from '../data';

/**
 * Boutique milestones timeline.
 */
export function TimelineSection() {
  const reduced = usePrefersReducedMotion();

  return (
    <Section tone="dark" className="py-16 md:py-24">
      <SectionIntro
        tone="dark"
        title="Our journey"
        description="Milestones of a Kurnool boutique built on fittings, craft, and local trust."
      />

      <div className="relative mt-12">
        <div
          className="pointer-events-none absolute left-0 right-0 top-5 hidden h-px bg-gold/25 md:block"
          aria-hidden
        />
        <motion.ol
          className="grid gap-8 md:grid-cols-4"
          variants={reduced ? undefined : staggerChildren}
          initial={reduced ? false : 'hidden'}
          whileInView={reduced ? undefined : 'visible'}
          viewport={{ once: true, amount: 0.2 }}
        >
          {timeline.map((item) => (
            <motion.li key={item.id} variants={reduced ? undefined : fadeUp} className="relative">
              <span className="inline-flex min-w-10 items-center justify-center rounded-full border border-gold/50 bg-black px-3 py-2 font-heading text-xs tracking-wide text-gold">
                {item.year}
              </span>
              <h3 className="mt-4 font-heading text-xl text-cream">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-cream/70">{item.description}</p>
            </motion.li>
          ))}
        </motion.ol>
      </div>
    </Section>
  );
}
