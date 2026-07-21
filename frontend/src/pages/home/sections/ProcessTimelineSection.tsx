import { motion } from 'framer-motion';
import { Section, SectionIntro } from '@/components/ui';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { fadeUp, staggerChildren } from '@/motion/variants';
import { processSteps } from '../data';

/**
 * Step-by-step studio process timeline.
 */
export function ProcessTimelineSection() {
  const reduced = usePrefersReducedMotion();

  return (
    <Section tone="dark" className="py-16 md:py-24">
      <SectionIntro
        tone="dark"
        title="Our process"
        description="Four clear stages from consultation to final delivery of your outfit."
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
          {processSteps.map((step) => (
            <motion.li key={step.id} variants={reduced ? undefined : fadeUp} className="relative">
              <span className="inline-flex size-10 items-center justify-center rounded-full border border-gold/50 bg-black font-heading text-sm text-gold">
                {step.step}
              </span>
              <h3 className="mt-4 font-heading text-xl text-cream">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-cream/70">{step.description}</p>
            </motion.li>
          ))}
        </motion.ol>
      </div>
    </Section>
  );
}
