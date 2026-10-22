import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';
import { OptimizedImage } from '@/components/media/OptimizedImage';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { cn } from '@/utils/cn';

export interface PageHeroProps {
  eyebrow?: ReactNode;
  title: ReactNode;
  accent?: ReactNode;
  description?: ReactNode;
  image: string;
  imageAlt: string;
  /** A small set of facts printed along the bottom rule. */
  facts?: Array<{ label: string; value: string }>;
  /** Where the page sits, for the breadcrumb. */
  trail?: Array<{ label: string; to?: string }>;
  /** Shorten the banner on a utility page. */
  size?: 'tall' | 'standard';
  children?: ReactNode;
}

/**
 * The interior page banner.
 *
 * Every page below the home page opens the same way: a photograph held behind a
 * veil, the page's name in the serif, one honest sentence, and a rule of facts.
 * It is deliberately shorter than the home hero — a visitor who has already
 * chosen a page does not need to be sold to again, they need to know where they
 * are.
 */
export function PageHero({
  eyebrow,
  title,
  accent,
  description,
  image,
  imageAlt,
  facts,
  trail,
  size = 'standard',
  children,
}: PageHeroProps) {
  const ref = useRef<HTMLElement>(null);
  const reduced = usePrefersReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], ['0%', '14%']);

  return (
    <section
      ref={ref}
      className={cn(
        'on-dark relative isolate flex w-full overflow-hidden bg-espresso text-ink-inverse',
        size === 'tall'
          ? 'min-h-[min(88svh,860px)]'
          : 'min-h-[min(72svh,700px)]',
      )}
      aria-label={typeof title === 'string' ? title : undefined}
    >
      <motion.div
        className="absolute inset-0"
        style={reduced ? undefined : { y }}
        aria-hidden={false}
      >
        <OptimizedImage
          src={image}
          alt={imageAlt}
          priority
          sizes="100vw"
          width={2000}
          height={1250}
          className="h-[116%] w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-espresso/90 via-espresso/55 to-espresso/5" />
        <div className="absolute inset-0 bg-gradient-to-t from-espresso via-transparent to-espresso/25" />
      </motion.div>

      {/* The vertical rule and its label — the house signature on every banner. */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 hidden w-px bg-gold/25 lg:block" />
      <span className="pointer-events-none absolute left-6 top-1/2 z-10 hidden -translate-y-1/2 lg:block">
        <span className="rail-label text-gold/70">Kadamba &middot; Kurnool</span>
      </span>

      <div className="house-container relative z-10 flex flex-col justify-end pb-12 pt-32 lg:pb-16 lg:pt-40">
        {trail?.length ? (
          <nav aria-label="Breadcrumb" className="mb-8">
            <ol className="flex flex-wrap items-center gap-2 text-[0.65rem] uppercase tracking-[0.22em] text-ink-inverse/55">
              <li>
                <Link to="/" className="transition hover:text-gold">
                  Home
                </Link>
              </li>
              {trail.map((item) => (
                <li key={item.label} className="flex items-center gap-2">
                  <span aria-hidden className="text-gold/50">
                    /
                  </span>
                  {item.to ? (
                    <Link to={item.to} className="transition hover:text-gold">
                      {item.label}
                    </Link>
                  ) : (
                    <span className="text-ink-inverse/85">{item.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        ) : null}

        {eyebrow ? (
          <RevealLine>
            <p className="eyebrow text-gold/85">{eyebrow}</p>
          </RevealLine>
        ) : null}

        <RevealLine delay={0.08}>
          <h1 className="display-xl mt-6 max-w-4xl text-ink-inverse">
            {title}
            {accent ? <> <span className="display-accent">{accent}</span></> : null}
          </h1>
        </RevealLine>

        {description ? (
          <RevealLine delay={0.16}>
            <p className="text-lede mt-7 max-w-2xl text-ink-inverse/75">{description}</p>
          </RevealLine>
        ) : null}

        {children ? <div className="mt-8">{children}</div> : null}

        {facts?.length ? (
          <RevealLine delay={0.24}>
            <dl className="mt-12 grid grid-cols-2 gap-x-8 gap-y-5 border-t border-ink-inverse/15 pt-7 sm:grid-cols-4">
              {facts.map((fact) => (
                <div key={fact.label}>
                  <dt className="text-[0.6rem] font-semibold uppercase tracking-[0.24em] text-ink-inverse/45">
                    {fact.label}
                  </dt>
                  <dd className="mt-2 font-heading text-lg text-ink-inverse">{fact.value}</dd>
                </div>
              ))}
            </dl>
          </RevealLine>
        ) : null}
      </div>
    </section>
  );
}

function RevealLine({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const reduced = usePrefersReducedMotion();
  if (reduced) return <>{children}</>;
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
