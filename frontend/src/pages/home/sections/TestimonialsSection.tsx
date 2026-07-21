import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button, Section, SectionIntro } from '@/components/ui';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { fadeIn } from '@/motion/variants';
import { testimonials } from '../data';

/**
 * Animated testimonial carousel.
 */
export function TestimonialsSection() {
  const reduced = usePrefersReducedMotion();
  const [index, setIndex] = useState(0);
  const current = testimonials[index];

  const prev = () => setIndex((i) => (i === 0 ? testimonials.length - 1 : i - 1));
  const next = () => setIndex((i) => (i === testimonials.length - 1 ? 0 : i + 1));

  return (
    <Section tone="dark" className="py-16 md:py-24">
      <SectionIntro
        tone="dark"
        title="Client voices"
        description="Words from brides and families who trust our boutique and tailoring in Kurnool."
      />

      <div className="relative mt-10 min-h-[14rem]">
        <AnimatePresence mode="wait">
          <motion.blockquote
            key={current.id}
            variants={reduced ? undefined : fadeIn}
            initial={reduced ? false : 'hidden'}
            animate="visible"
            exit={reduced ? undefined : { opacity: 0 }}
            className="w-full max-w-3xl"
          >
            <p className="font-heading text-2xl leading-relaxed text-cream md:text-3xl md:leading-snug">
              &ldquo;{current.quote}&rdquo;
            </p>
            <footer className="mt-6 text-sm leading-relaxed">
              <cite className="not-italic text-gold">{current.name}</cite>
              <span className="text-cream/60"> — {current.role}</span>
            </footer>
          </motion.blockquote>
        </AnimatePresence>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <Button variant="secondary" size="sm" className="!text-cream" onClick={prev}>
          Previous
        </Button>
        <Button variant="secondary" size="sm" className="!text-cream" onClick={next}>
          Next
        </Button>
        <p className="text-xs text-cream/50" aria-live="polite">
          {index + 1} / {testimonials.length}
        </p>
      </div>
    </Section>
  );
}
