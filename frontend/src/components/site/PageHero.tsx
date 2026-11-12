import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ParallaxImage } from '@/components/motion/ParallaxImage';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { cn } from '@/utils/cn';

export type PageHeroVariant =
  | 'split'
  | 'catalogue'
  | 'mosaic'
  | 'archive'
  | 'journal'
  | 'portrait'
  | 'contact'
  | 'consultation'
  | 'atlas'
  | 'standard';

export interface PageHeroProps {
  variant?: PageHeroVariant;
  eyebrow?: ReactNode;
  title: ReactNode;
  accent?: ReactNode;
  description?: ReactNode;
  image: string;
  imageAlt: string;
  facts?: Array<{ label: string; value: string }>;
  trail?: Array<{ label: string; to?: string }>;
  size?: 'tall' | 'standard';
  children?: ReactNode;
}

function Breadcrumb({ trail, dark }: { trail?: PageHeroProps['trail']; dark?: boolean }) {
  if (!trail?.length) return null;
  return (
    <nav aria-label="Breadcrumb" className="mb-7">
      <ol
        className={cn(
          'flex flex-wrap items-center gap-2 text-[0.6rem] uppercase tracking-[0.24em]',
          dark ? 'text-ink-inverse/65' : 'text-ink/70',
        )}
      >
        <li>
          <Link to="/" className="transition hover:text-gold">
            Home
          </Link>
        </li>
        {trail.map((item) => (
          <li key={item.label} className="flex items-center gap-2">
            <span aria-hidden className="text-gold/60">
              /
            </span>
            {item.to ? (
              <Link to={item.to} className="transition hover:text-gold">
                {item.label}
              </Link>
            ) : (
              <span className={dark ? 'text-ink-inverse/85' : 'text-ink/80'}>{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

function Eyebrow({ children, dark }: { children: ReactNode; dark?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-px w-9 bg-gold/70" aria-hidden />
      <p className={cn('eyebrow', dark ? 'text-gold/90' : 'text-brand-strong')}>{children}</p>
    </div>
  );
}

function Heading({
  title,
  accent,
  dark,
  size = 'lg',
}: {
  title: ReactNode;
  accent?: ReactNode;
  dark?: boolean;
  size?: 'md' | 'lg' | 'xl';
}) {
  return (
    <h1
      className={cn(
        'font-heading font-light tracking-[-0.04em]',
        size === 'xl' && 'text-[clamp(3.4rem,9vw,8.2rem)] leading-[0.88]',
        size === 'lg' && 'text-[clamp(2.9rem,6.8vw,6.2rem)] leading-[0.92]',
        size === 'md' && 'text-[clamp(2.5rem,5.4vw,4.8rem)] leading-[0.96]',
        dark ? 'text-ink-inverse' : 'text-ink',
      )}
    >
      {title}
      {accent ? <span className="display-accent block">{accent}</span> : null}
    </h1>
  );
}

function Copy({
  eyebrow,
  title,
  accent,
  description,
  dark,
  headingSize = 'lg',
  children,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  accent?: ReactNode;
  description?: ReactNode;
  dark?: boolean;
  headingSize?: 'md' | 'lg' | 'xl';
  children?: ReactNode;
}) {
  return (
    <div>
      {eyebrow ? <Eyebrow dark={dark}>{eyebrow}</Eyebrow> : null}
      <div className="mt-6">
        <Heading title={title} accent={accent} dark={dark} size={headingSize} />
      </div>
      {description ? (
        <p
          className={cn(
            'mt-7 max-w-xl text-[0.98rem] leading-[1.85]',
            dark ? 'text-ink-inverse/72' : 'text-ink/70',
          )}
        >
          {description}
        </p>
      ) : null}
      {children ? <div className="mt-8">{children}</div> : null}
    </div>
  );
}

function Facts({
  facts,
  dark,
  className,
}: {
  facts?: PageHeroProps['facts'];
  dark?: boolean;
  className?: string;
}) {
  if (!facts?.length) return null;
  return (
    <dl className={cn('grid grid-cols-2 gap-x-8 gap-y-5 sm:grid-cols-4', className)}>
      {facts.map((fact) => (
        <div key={fact.label}>
          <dt
            className={cn(
              'text-[0.54rem] font-semibold uppercase tracking-[0.24em]',
              dark ? 'text-ink-inverse/55' : 'text-ink/70',
            )}
          >
            {fact.label}
          </dt>
          <dd
            className={cn(
              'mt-1.5 font-heading text-lg leading-tight md:text-xl',
              dark ? 'text-ink-inverse' : 'text-ink',
            )}
          >
            {fact.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function RevealBlock({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const reduced = usePrefersReducedMotion();
  if (reduced) return <>{children}</>;
  return (
    <motion.div
      initial={{ opacity: 0, y: 26 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Page headers with distinct compositions per surface.
 *
 * The pages share type, colour and image language, not a template. Services
 * opens as a split stage; Collections as a paper catalogue; Gallery as a
 * contact sheet; Portfolio as an archive; the Journal as a cover; About as a
 * portrait wall; Contact and Consultation as appointment rooms; Kurnool as an
 * atlas. Every image drifts against the scroll.
 */
export function PageHero({
  variant = 'standard',
  eyebrow,
  title,
  accent,
  description,
  image,
  imageAlt,
  facts,
  trail,
  children,
}: PageHeroProps) {
  if (variant === 'portrait') {
    return (
      <section className="relative overflow-hidden bg-surface">
        <div className="house-container grid gap-12 py-24 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:gap-20 lg:py-32">
          <div>
            <Breadcrumb trail={trail} />
            <RevealBlock>
              <Copy eyebrow={eyebrow} title={title} accent={accent} description={description} headingSize="lg">
                {children}
              </Copy>
            </RevealBlock>
            <RevealBlock delay={0.18}>
              <Facts facts={facts} className="mt-10 border-t border-ink/12 pt-6" />
            </RevealBlock>
          </div>
          <RevealBlock delay={0.1}>
            <div className="relative lg:pl-10">
              <div className="plate plate-frame plate-frame-dark relative aspect-[4/5] overflow-hidden">
                <ParallaxImage
                  src={image}
                  alt={imageAlt}
                  className="absolute inset-0"
                  speed={0.09}
                  sizes="(min-width: 1024px) 52vw, 100vw"
                />
              </div>
              <div className="on-dark absolute -bottom-6 -left-2 border border-gold/45 bg-espresso px-6 py-5 text-center text-gold lg:left-2">
                <span className="block font-heading text-4xl leading-none">15</span>
                <span className="mt-1 block text-[0.5rem] uppercase tracking-[0.24em]">years in one room</span>
              </div>
              <span className="pointer-events-none absolute -right-4 top-8 hidden [writing-mode:vertical-rl] text-[0.55rem] uppercase tracking-[0.35em] text-ink/60 xl:block">
                Kadamba · Kurnool
              </span>
            </div>
          </RevealBlock>
        </div>
      </section>
    );
  }

  if (variant === 'catalogue') {
    return (
      <section className="relative overflow-hidden bg-[#f3efe7]">
        <div className="house-container py-20 lg:py-28">
          <div className="flex items-end justify-between gap-6 border-b border-ink/15 pb-6">
            <Breadcrumb trail={trail} />
            <p className="hidden text-[0.55rem] uppercase tracking-[0.3em] text-ink/65 sm:block">
              The catalogue · Vol. 01
            </p>
          </div>
          <div className="mt-12 grid gap-12 lg:grid-cols-[1.12fr_0.88fr] lg:items-center lg:gap-20">
            <RevealBlock>
              <Copy eyebrow={eyebrow} title={title} accent={accent} description={description} headingSize="xl">
                {children}
              </Copy>
              <Facts facts={facts} className="mt-10 border-t border-ink/12 pt-6" />
            </RevealBlock>
            <RevealBlock delay={0.12}>
              <div className="relative mx-auto w-full max-w-[33rem]">
                <div className="absolute -left-4 -top-4 h-full w-full border border-gold/40" aria-hidden />
                <div className="plate relative aspect-[4/5] overflow-hidden">
                  <ParallaxImage
                    src={image}
                    alt={imageAlt}
                    className="absolute inset-0"
                    speed={0.1}
                    sizes="(min-width: 1024px) 42vw, 100vw"
                  />
                </div>
                <span className="absolute -bottom-4 right-4 bg-[#f3efe7] px-4 py-2 font-mono text-[0.55rem] uppercase tracking-[0.24em] text-ink/70">
                  Made to order
                </span>
              </div>
            </RevealBlock>
          </div>

        </div>
      </section>
    );
  }

  if (variant === 'mosaic') {
    return (
      <section className="on-dark relative isolate min-h-[min(88svh,860px)] overflow-hidden bg-espresso text-ink-inverse">
        <ParallaxImage
          src={image}
          alt={imageAlt}
          className="absolute inset-0"
          speed={0.07}
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#120d0b_0%,rgba(18,13,11,0.86)_36%,rgba(18,13,11,0.18)_100%)]" aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-t from-[#120d0b] via-transparent to-[#120d0b]/35" aria-hidden />
        <div className="house-container relative z-10 flex min-h-[inherit] flex-col justify-between pb-12 pt-32">
          <Breadcrumb trail={trail} dark />
          <div className="grid gap-10 lg:grid-cols-[1fr_0.85fr] lg:items-end">
            <RevealBlock>
              <Copy eyebrow={eyebrow} title={title} accent={accent} description={description} dark headingSize="xl">
                {children}
              </Copy>
              <Facts facts={facts} dark className="mt-10 border-t border-ink-inverse/15 pt-6" />
            </RevealBlock>
            <RevealBlock delay={0.14}>
              <div className="hidden grid-cols-3 gap-3 lg:grid">
                {[0, 1, 2].map((index) => (
                  <div
                    key={index}
                    className={cn(
                      'relative overflow-hidden border border-gold/25',
                      index === 1 ? 'mt-10 aspect-[3/4]' : 'aspect-[3/4]',
                    )}
                  >
                    <ParallaxImage
                      src={image}
                      alt=""
                      className="absolute inset-0"
                      speed={0.05 + index * 0.02}
                      imageClassName="scale-110"
                      sizes="15vw"
                    />
                    <span className="absolute inset-0 bg-espresso/20" aria-hidden />
                    <span className="absolute bottom-2 left-2 font-mono text-[0.5rem] uppercase tracking-[0.2em] text-gold/80">
                      0{index + 1}
                    </span>
                  </div>
                ))}
              </div>
            </RevealBlock>
          </div>
        </div>
      </section>
    );
  }

  if (variant === 'archive') {
    return (
      <section className="on-dark relative isolate overflow-hidden bg-[#120d0b] text-ink-inverse">
        <span className="pointer-events-none absolute -right-6 top-24 select-none font-heading text-[18rem] leading-none text-transparent [-webkit-text-stroke:1px_rgba(212,166,42,0.16)]" aria-hidden>
          Archive
        </span>
        <div className="house-container grid gap-10 py-24 lg:grid-cols-[0.82fr_1.18fr] lg:items-center lg:gap-20 lg:py-32">
          <RevealBlock>
            <div className="relative mx-auto w-full max-w-md">
              <div className="plate plate-frame relative aspect-[3/4] overflow-hidden">
                <ParallaxImage src={image} alt={imageAlt} className="absolute inset-0" speed={0.1} sizes="(min-width: 1024px) 34vw, 100vw" />
              </div>
              <span className="absolute -left-4 top-8 h-24 w-px bg-gold/60" aria-hidden />
              <span className="absolute -left-4 top-8 pl-4 [writing-mode:vertical-rl] text-[0.5rem] uppercase tracking-[0.3em] text-gold/70">
                Selected work
              </span>
            </div>
          </RevealBlock>
          <div>
            <Breadcrumb trail={trail} dark />
            <RevealBlock delay={0.1}>
              <Copy eyebrow={eyebrow} title={title} accent={accent} description={description} dark headingSize="lg">
                {children}
              </Copy>
            </RevealBlock>
            <RevealBlock delay={0.18}>
              <Facts facts={facts} dark className="mt-10 border-t border-ink-inverse/15 pt-6" />
            </RevealBlock>
          </div>
        </div>
      </section>
    );
  }

  if (variant === 'journal') {
    return (
      <section className="relative overflow-hidden bg-[#faf7f1]">
        <div className="house-container py-16 lg:py-24">
          <div className="flex items-center justify-between border-y border-ink/15 py-3 text-[0.55rem] uppercase tracking-[0.3em] text-ink/70">
            <span>The Kadamba Journal</span>
            <span className="hidden sm:block">Kurnool · Issue 01</span>
            <span>Est. 2009</span>
          </div>
          <div className="mt-12 grid gap-12 lg:grid-cols-[1.12fr_0.88fr] lg:items-end lg:gap-20">
            <div>
              <Breadcrumb trail={trail} />
              <RevealBlock>
                <Copy eyebrow={eyebrow} title={title} accent={accent} description={description} headingSize="xl">
                  {children}
                </Copy>
              </RevealBlock>
              <RevealBlock delay={0.16}>
                <Facts facts={facts} className="mt-10 border-t border-ink/12 pt-6" />
              </RevealBlock>
            </div>
            <RevealBlock delay={0.1}>
              <figure className="relative">
                <div className="plate plate-frame plate-frame-dark relative aspect-[4/5] overflow-hidden">
                  <ParallaxImage src={image} alt={imageAlt} className="absolute inset-0" speed={0.09} sizes="(min-width: 1024px) 38vw, 100vw" />
                </div>
                <figcaption className="mt-3 flex items-center justify-between text-[0.55rem] uppercase tracking-[0.22em] text-ink/70">
                  <span>Notes from the table</span>
                  <span>01 / 05</span>
                </figcaption>
              </figure>
            </RevealBlock>
          </div>
        </div>
      </section>
    );
  }

  if (variant === 'contact') {
    return (
      <section className="relative overflow-hidden bg-surface-sunken">
        <div className="house-container grid gap-12 py-20 lg:grid-cols-[1.02fr_0.98fr] lg:items-center lg:gap-20 lg:py-28">
          <div>
            <Breadcrumb trail={trail} />
            <RevealBlock>
              <Copy eyebrow={eyebrow} title={title} accent={accent} description={description} headingSize="lg">
                {children}
              </Copy>
            </RevealBlock>
            <RevealBlock delay={0.16}>
              <Facts facts={facts} className="mt-10 border-t border-ink/12 pt-6" />
            </RevealBlock>
          </div>
          <RevealBlock delay={0.1}>
            <div className="relative">
              <div className="plate plate-frame relative aspect-[4/3] overflow-hidden">
                <ParallaxImage src={image} alt={imageAlt} className="absolute inset-0" speed={0.08} sizes="(min-width: 1024px) 46vw, 100vw" />
              </div>
              <div className="on-dark absolute -bottom-6 left-4 max-w-[15rem] border border-gold/35 bg-espresso p-5 text-ink-inverse shadow-[0_24px_60px_rgba(18,13,11,0.28)]">
                <p className="text-[0.5rem] uppercase tracking-[0.26em] text-gold">By appointment</p>
                <p className="mt-2 font-heading text-lg leading-snug">Sreenivas Nagar, Kurnool</p>
                <p className="mt-1 text-[0.7rem] text-ink-inverse/60">Mon–Sat · 10–7</p>
              </div>
            </div>
          </RevealBlock>
        </div>
      </section>
    );
  }

  if (variant === 'consultation') {
    return (
      <section className="relative overflow-hidden bg-surface">
        <div className="house-container grid gap-12 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-20 lg:py-28">
          <div>
            <Breadcrumb trail={trail} />
            <RevealBlock>
              <Copy eyebrow={eyebrow} title={title} accent={accent} description={description} headingSize="lg">
                {children}
              </Copy>
            </RevealBlock>
            <RevealBlock delay={0.16}>
              <Facts facts={facts} className="mt-10 border-t border-ink/12 pt-6" />
            </RevealBlock>
          </div>
          <RevealBlock delay={0.1}>
            <div className="relative">
              <div className="plate plate-frame plate-frame-dark relative aspect-[4/5] overflow-hidden">
                <ParallaxImage src={image} alt={imageAlt} className="absolute inset-0" speed={0.1} sizes="(min-width: 1024px) 42vw, 100vw" />
              </div>
              <div className="absolute inset-x-4 bottom-4 border border-white/20 bg-espresso/85 p-4 backdrop-blur-sm">
                <p className="text-[0.5rem] uppercase tracking-[0.26em] text-gold">The appointment</p>
                <ol className="mt-3 grid gap-2 text-[0.68rem] text-ink-inverse/75">
                  <li>01 · The conversation</li>
                  <li>02 · Cloth and silhouette</li>
                  <li>03 · Measurements</li>
                  <li>04 · The plan</li>
                </ol>
              </div>
            </div>
          </RevealBlock>
        </div>
      </section>
    );
  }

  if (variant === 'atlas') {
    return (
      <section className="on-dark relative isolate overflow-hidden bg-espresso text-ink-inverse">
        <ParallaxImage src={image} alt={imageAlt} className="absolute inset-0" speed={0.06} sizes="100vw" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#120d0b_0%,rgba(18,13,11,0.9)_44%,rgba(18,13,11,0.2)_100%)]" aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-t from-[#120d0b] via-transparent to-[#120d0b]/35" aria-hidden />
        <div className="house-container relative z-10 flex min-h-[min(80svh,780px)] flex-col justify-between pb-10 pt-32">
          <Breadcrumb trail={trail} dark />
          <div className="max-w-4xl">
            <RevealBlock>
              <Copy eyebrow={eyebrow} title={title} accent={accent} description={description} dark headingSize="xl">
                {children}
              </Copy>
            </RevealBlock>
            <RevealBlock delay={0.16}>
              <Facts facts={facts} dark className="mt-10 border-t border-ink-inverse/15 pt-6" />
            </RevealBlock>
          </div>
          <div className="mt-10 flex flex-wrap gap-x-6 gap-y-2 border-t border-ink-inverse/15 pt-5 text-[0.55rem] uppercase tracking-[0.26em] text-ink-inverse/50">
            <span>Kurnool</span><span className="text-gold/60">✦</span>
            <span>Adoni</span><span className="text-gold/60">✦</span>
            <span>Nandyal</span><span className="text-gold/60">✦</span>
            <span>Yemmiganur</span><span className="text-gold/60">✦</span>
            <span>Dhone</span>
          </div>
        </div>
      </section>
    );
  }

  // `split` and the default: a dark stage with the image on the right.
  return (
    <section className="on-dark relative isolate min-h-[min(84svh,820px)] overflow-hidden bg-[#120d0b] text-ink-inverse">
      <div className="absolute inset-0 lg:left-[44%]">
        <ParallaxImage src={image} alt={imageAlt} className="absolute inset-0" speed={0.07} sizes="(min-width: 1024px) 58vw, 100vw" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,#120d0b_0%,rgba(18,13,11,0.9)_38%,rgba(18,13,11,0.12)_100%)]" aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-t from-[#120d0b] via-transparent to-[#120d0b]/40" aria-hidden />
      </div>
      <div className="house-container relative z-10 flex min-h-[inherit] flex-col justify-end pb-12 pt-32 lg:pb-16">
        <Breadcrumb trail={trail} dark />
        <div className="grid gap-10 lg:grid-cols-[1fr_0.82fr] lg:items-end">
          <div>
            <RevealBlock>
              <Copy eyebrow={eyebrow} title={title} accent={accent} description={description} dark headingSize="xl">
                {children}
              </Copy>
            </RevealBlock>
            <RevealBlock delay={0.18}>
              <Facts facts={facts} dark className="mt-10 border-t border-ink-inverse/15 pt-6" />
            </RevealBlock>
          </div>
          <div className="hidden justify-self-end lg:block">
            <div className="flex items-center gap-3 text-[0.55rem] uppercase tracking-[0.26em] text-ink-inverse/50">
              <span className="scroll-line" aria-hidden />
              Scroll
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
