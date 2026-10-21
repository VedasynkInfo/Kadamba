import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useMotionValueEvent, useTransform } from 'framer-motion';
import { OptimizedImage } from '@/components/media/OptimizedImage';
import { Section, SectionIntro } from '@/components/ui';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import type { PortfolioProject } from '../data';

interface PortfolioBeforeAfterSectionProps {
  project: PortfolioProject;
}

/**
 * Before / after comparison with a draggable, inertial divider.
 *
 * `dragMomentum` lets a flick carry the divider a little further before it
 * settles, which is the tactile part of the interaction. The clip is a motion
 * value, so dragging never renders React per frame. Reduced-motion visitors get
 * the honest fallback: both photographs side by side.
 */
export function PortfolioBeforeAfterSection({ project }: PortfolioBeforeAfterSectionProps) {
  const reduced = usePrefersReducedMotion();
  const pair = project.beforeAfter;
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [percent, setPercent] = useState(50);
  const x = useMotionValue(0);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry?.contentRect.width ?? 0));
    observer.observe(node);
    setWidth(node.getBoundingClientRect().width);
    return () => observer.disconnect();
  }, [reduced]);

  useEffect(() => {
    x.set(0);
    setPercent(50);
  }, [project.id, x]);

  useEffect(() => {
    if (!width) return;
    const max = Math.max(0, width / 2 - 24);
    x.set(Math.max(-max, Math.min(max, x.get())));
  }, [width, x]);

  useMotionValueEvent(x, 'change', (value) => {
    if (!width) return;
    setPercent(Math.max(0, Math.min(100, Math.round(50 + (value / width) * 100))));
  });

  const clipPath = useTransform(
    x,
    (value) => `inset(0 ${Math.max(0, 50 - (width ? (value / width) * 100 : 0))}% 0 0)`,
  );
  const handleLeft = useTransform(x, (value) => `calc(50% + ${value}px)`);

  if (!pair) return null;

  const moveBy = (deltaPercent: number) => {
    if (!width) return;
    const next = Math.max(-width / 2, Math.min(width / 2, x.get() + (width * deltaPercent) / 100));
    x.set(next);
  };

  return (
    <Section tone="dark" className="py-16 md:py-24">
      <motion.div
        initial={reduced ? false : { opacity: 0, y: 18 }}
        whileInView={reduced ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-8%' }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <SectionIntro tone="dark" title="Before & after" description={pair.note} />

        {reduced ? (
          <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2">
            <ComparisonFigure image={pair.beforeImage} alt={pair.beforeAlt} label="Before" />
            <ComparisonFigure image={pair.afterImage} alt={pair.afterAlt} label="After" />
          </div>
        ) : (
          <div
            ref={containerRef}
            className="relative mx-auto mt-12 aspect-[4/5] w-full max-w-3xl select-none overflow-hidden md:aspect-[16/10]"
          >
            <OptimizedImage
              sizes="(min-width: 1200px) 768px, 100vw"
              src={pair.afterImage}
              alt={pair.afterAlt}
              className="absolute inset-0 h-full w-full object-cover"
              width={1200}
              height={900}
            />
            <motion.div className="absolute inset-0" style={{ clipPath }} aria-hidden>
              <OptimizedImage
                sizes="(min-width: 1200px) 768px, 100vw"
                src={pair.beforeImage}
                alt=""
                className="h-full w-full object-cover"
                width={1200}
                height={900}
              />
            </motion.div>

            <span className="absolute left-4 top-4 bg-black/65 px-2.5 py-1 text-[0.6rem] uppercase tracking-[0.24em] text-ink-inverse">
              Before
            </span>
            <span className="absolute right-4 top-4 bg-black/65 px-2.5 py-1 text-[0.6rem] uppercase tracking-[0.24em] text-ink-inverse">
              After
            </span>

            <motion.button
              type="button"
              role="slider"
              aria-label="Compare before and after"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={percent}
              aria-valuetext={`${percent}% before`}
              drag="x"
              // Write the gesture into the same motion value that drives the
              // clip and divider position. Without `_dragX`, Framer would apply
              // its own transform and the image would never reveal.
              _dragX={x}
              dragConstraints={{
                left: -(width / 2 - 24),
                right: width / 2 - 24,
              }}
              dragElastic={0.06}
              dragMomentum
              style={{ left: handleLeft }}
              onKeyDown={(event) => {
                if (event.key === 'ArrowLeft') {
                  event.preventDefault();
                  moveBy(-4);
                }
                if (event.key === 'ArrowRight') {
                  event.preventDefault();
                  moveBy(4);
                }
              }}
              className="absolute top-0 z-10 flex h-full w-12 -translate-x-1/2 cursor-ew-resize items-center justify-center bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
              <span
                className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-gold/80"
                aria-hidden
              />
              <span className="relative flex size-10 items-center justify-center rounded-full border border-gold/60 bg-black/80 text-gold">
                <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden>
                  <path
                    d="m9 7-4 5 4 5M15 7l4 5-4 5"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </motion.button>
          </div>
        )}
      </motion.div>
    </Section>
  );
}

function ComparisonFigure({ image, alt, label }: { image: string; alt: string; label: string }) {
  return (
    <figure>
      <div className="relative aspect-[3/4] overflow-hidden">
        <OptimizedImage
          sizes="(min-width: 1200px) 552px, 50vw"
          src={image}
          alt={alt}
          className="h-full w-full object-cover"
          width={900}
          height={1200}
        />
      </div>
      <figcaption className="mt-4 font-heading text-xs uppercase tracking-[0.3em] text-gold">
        {label}
      </figcaption>
    </figure>
  );
}
