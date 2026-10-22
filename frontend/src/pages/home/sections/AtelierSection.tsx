import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { OptimizedImage } from '@/components/media/OptimizedImage';
import { Reveal } from '@/components/site';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { studioDisciplines } from '../data';
import { plate } from '../content';

/**
 * The atelier.
 *
 * The page has shown what the house makes; this is who makes it. A dark plate,
 * a sentence in the serif, and the four disciplines set as a work order rather
 * than a feature list. The photograph drifts against the scroll so the section
 * has depth without a video.
 */
export function AtelierSection() {
  const ref = useRef<HTMLElement>(null);
  const reduced = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['-6%', '6%']);

  return (
    <section ref={ref} className="on-dark relative overflow-hidden bg-espresso text-ink-inverse">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(201,162,39,0.16),transparent_55%)]" aria-hidden />

      <div className="house-container relative grid gap-14 py-[var(--section-y)] lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:gap-20">
        <Reveal>
          <div className="plate plate-frame aspect-[5/6] w-full overflow-hidden">
            <motion.div className="h-full w-full" style={reduced ? undefined : { y }}>
              <OptimizedImage
                src={plate.embroidery}
                alt="Hand-worked maggam on a stretched panel at the Kadamba atelier"
                sizes="(min-width: 1024px) 48vw, 100vw"
                className="h-[112%] w-full object-cover"
              />
            </motion.div>
            <div className="absolute inset-0 bg-gradient-to-t from-espresso/70 via-transparent to-transparent" />
            <p className="absolute bottom-6 left-6 right-6 z-[3] text-[0.6rem] uppercase tracking-[0.26em] text-ink-inverse/70">
              Fitting room &middot; Kadamba, Kurnool
            </p>
          </div>
        </Reveal>

        <div>
          <Reveal>
            <p className="eyebrow text-gold/85">Inside the studio</p>
            <h2 className="display-lg mt-6 text-ink-inverse">
              The hands <span className="display-accent">behind the cloth.</span>
            </h2>
            <p className="mt-6 max-w-lg text-[0.98rem] leading-relaxed text-ink-inverse/65">
              A bridal ensemble passes through six pairs of hands before it is folded into its
              cloth bag. Nobody in that chain is a stranger to the person who will wear it — that is
              the point of working at this scale.
            </p>
          </Reveal>

          <ul className="mt-12 border-t border-ink-inverse/15">
            {studioDisciplines.map((discipline, index) => (
              <Reveal
                key={discipline.id}
                delay={index * 0.05}
                as="li"
                className="grid grid-cols-[auto_1fr] gap-5 border-b border-ink-inverse/15 py-6"
              >
                <span className="mt-1 font-mono text-[0.6rem] tabular-nums tracking-[0.18em] text-gold/70">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span>
                  <span className="block font-heading text-xl text-ink-inverse md:text-2xl">
                    {discipline.title}
                  </span>
                  <span className="mt-2 block max-w-md text-sm leading-relaxed text-ink-inverse/55">
                    {discipline.description}
                  </span>
                </span>
              </Reveal>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
