import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { OptimizedImage } from '@/components/media/OptimizedImage';
import { Button } from '@/components/ui';
import { usePublicContent } from '@/hooks/usePublicContent';
import { cn } from '@/utils/cn';
import { Reveal } from './Reveal';
import { Parallax } from '@/components/motion/Parallax';

export interface CtaBandProps {
  eyebrow?: string;
  title: ReactNode;
  accent?: ReactNode;
  copy: string;
  image: string;
  /** The primary route action. */
  action: { label: string; to: string };
  /** Show the WhatsApp button as well. Defaults to true. */
  whatsapp?: boolean;
  className?: string;
}

/**
 * The closing panel.
 *
 * One full-bleed photograph, a very large invitation, and two doors out. The
 * image is the ground, not a card; the type sits on it like a magazine cover.
 */
export function CtaBand({
  eyebrow = 'Begin',
  title,
  accent,
  copy,
  image,
  action,
  whatsapp = true,
  className,
}: CtaBandProps) {
  const navigate = useNavigate();
  const { whatsappHref } = usePublicContent();

  return (
    <section
      className={cn(
        'on-dark relative isolate flex min-h-[min(84svh,820px)] overflow-hidden bg-[#120d0b] text-ink-inverse',
        className,
      )}
    >
      <Parallax speed={0.16} scale={1.16} className="absolute inset-0">
        <OptimizedImage
          src={image}
          alt=""
          sizes="100vw"
          className="h-full w-full object-cover"
        />
      </Parallax>
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(18,13,11,0.58)_0%,rgba(18,13,11,0.2)_32%,rgba(18,13,11,0.92)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(18,13,11,0.78)_0%,transparent_62%)]" />

      <span
        className="pointer-events-none absolute -right-4 top-20 hidden select-none font-heading text-[16rem] leading-none text-transparent [-webkit-text-stroke:1px_rgba(212,166,42,0.18)] xl:block"
        aria-hidden
      >
        Begin
      </span>

      <div className="house-container relative z-10 flex min-h-[inherit] flex-col justify-end pb-14 pt-32 lg:pb-20">
        <Reveal className="max-w-4xl">
          <div className="flex items-center gap-4">
            <span className="h-px w-10 bg-gold/70" aria-hidden />
            <p className="eyebrow text-gold/90">{eyebrow}</p>
          </div>
          <h2 className="mt-7 max-w-[15ch] font-heading text-[clamp(2.8rem,6.6vw,6.4rem)] font-light leading-[0.92] tracking-[-0.04em] text-ink-inverse">
            {title}
            {accent ? (
              <>
                {' '}
                <span className="display-accent">{accent}</span>
              </>
            ) : null}
          </h2>
          <p className="mt-7 max-w-xl text-[0.98rem] leading-[1.8] text-ink-inverse/72">{copy}</p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Button
              variant="primary"
              size="lg"
              className="group rounded-none px-7 py-3.5 text-[0.68rem] font-semibold uppercase tracking-[0.2em]"
              onClick={() => navigate(action.to)}
            >
              {action.label}
              <span
                className="ml-2 inline-block transition-transform duration-300 group-hover:translate-x-1"
                aria-hidden
              >
                →
              </span>
            </Button>
            {whatsapp ? (
              <Button
                variant="secondary"
                size="lg"
                className="rounded-none border-ink-inverse/30 px-7 py-3.5 text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-ink-inverse hover:border-gold hover:text-gold"
                onClick={() => window.open(whatsappHref(), '_blank', 'noopener,noreferrer')}
              >
                WhatsApp
              </Button>
            ) : null}
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-2 border-t border-ink-inverse/15 pt-6 text-[0.58rem] font-semibold uppercase tracking-[0.24em] text-ink-inverse/55">
            <span>By appointment</span>
            <span className="text-gold/60" aria-hidden>
              /
            </span>
            <span>Kurnool, Andhra Pradesh</span>
            <span className="text-gold/60" aria-hidden>
              /
            </span>
            <span>Serving India &amp; the world</span>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
