import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { OptimizedImage } from '@/components/media/OptimizedImage';
import { Button } from '@/components/ui';
import { Reveal } from '@/components/site';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { bridalNotes, plate } from '../content';

/**
 * The bridal commission.
 *
 * The one full-bleed dark panel in the middle of the page, because a wedding is
 * the reason most people arrive and it deserves the largest photograph on the
 * site. The three pieces of the ensemble are listed underneath — lehenga, blouse,
 * dupatta — because "bridal" is not one garment.
 */
export function BridalSection() {
  const ref = useRef<HTMLElement>(null);
  const navigate = useNavigate();
  const reduced = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [1.08, 1, 1.06]);

  return (
    <section
      ref={ref}
      className="on-dark relative isolate overflow-hidden bg-espresso text-ink-inverse"
    >
      <motion.div className="absolute inset-0" style={reduced ? undefined : { scale }} aria-hidden>
        <OptimizedImage
          src={plate.lehenga}
          alt=""
          sizes="100vw"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,8,6,0.82),rgba(10,8,6,0.55)_42%,rgba(10,8,6,0.94))]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_30%,rgba(201,162,39,0.18),transparent_60%)]" />
      </motion.div>

      <div className="house-container relative py-[calc(var(--section-y)*1.1)]">
        <div className="max-w-4xl">
          <Reveal>
            <p className="eyebrow text-gold/90">The bridal commission</p>
            <h2 className="display-xl mt-7 text-ink-inverse">
              Everything else <span className="display-accent">is planned around it.</span>
            </h2>
            <p className="mt-7 max-w-xl text-[1rem] leading-relaxed text-ink-inverse/70">
              A bridal ensemble is three pieces in one decision. We design them together, fit them
              together, and finish them together — so that on the morning of the wedding nothing
              about the garment needs to be adjusted, pinned or hoped for.
            </p>
          </Reveal>

          <div className="mt-14 grid gap-px overflow-hidden border border-ink-inverse/15 bg-ink-inverse/15 sm:grid-cols-3">
            {bridalNotes.map((note, index) => (
              <Reveal key={note.id} delay={index * 0.08} className="bg-espresso/85 p-6 backdrop-blur-sm">
                <p className="font-mono text-[0.6rem] tabular-nums tracking-[0.2em] text-gold/70">
                  {String(index + 1).padStart(2, '0')}
                </p>
                <h3 className="mt-4 font-heading text-xl text-ink-inverse">{note.label}</h3>
                <p className="mt-3 text-[0.84rem] leading-relaxed text-ink-inverse/60">
                  {note.text}
                </p>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.1} className="mt-10 flex flex-wrap items-center gap-4">
            <Button
              variant="primary"
              size="lg"
              className="rounded-none px-7 py-3 text-[0.7rem] font-semibold uppercase tracking-[0.18em]"
              onClick={() => navigate('/services/bridal-wear')}
            >
              Begin a bridal commission
            </Button>
            <p className="text-[0.62rem] uppercase tracking-[0.22em] text-ink-inverse/45">
              Eight to sixteen weeks &middot; two fittings
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
