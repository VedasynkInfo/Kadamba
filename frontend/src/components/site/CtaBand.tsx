import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { OptimizedImage } from '@/components/media/OptimizedImage';
import { Button } from '@/components/ui';
import { usePublicContent } from '@/hooks/usePublicContent';
import { cn } from '@/utils/cn';
import { Reveal } from './Reveal';

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
 * Every page ends in the same room — an oxblood plate, a serif invitation, two
 * doors out (book a consultation, or speak to the studio on WhatsApp). Repeating
 * it is the point: by the third page a visitor knows exactly where the page is
 * going to leave them.
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
    <section className={cn('relative isolate overflow-hidden bg-espresso text-ink-inverse', className)}>
      <div className="grid lg:grid-cols-2">
        <div className="relative min-h-[22rem] lg:min-h-[34rem]">
          <OptimizedImage
            src={image}
            alt=""
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-espresso/30 to-espresso lg:bg-gradient-to-r lg:from-transparent lg:to-espresso" />
          <div className="absolute inset-0 bg-espresso/20 lg:hidden" />
        </div>

        <div className="on-dark flex items-center px-6 py-16 sm:px-10 lg:px-16 lg:py-24">
          <Reveal className="w-full max-w-xl">
            <p className="eyebrow text-gold/85">{eyebrow}</p>
            <h2 className="display-lg mt-6 text-ink-inverse">
              {title}
              {accent ? <> <span className="display-accent">{accent}</span></> : null}
            </h2>
            <p className="mt-6 max-w-md text-[0.98rem] leading-relaxed text-ink-inverse/65">{copy}</p>

            <div className="mt-10 flex flex-wrap items-center gap-3">
              <Button
                variant="primary"
                size="lg"
                className="rounded-none px-7 py-3 text-[0.7rem] font-semibold uppercase tracking-[0.18em]"
                onClick={() => navigate(action.to)}
              >
                {action.label}
              </Button>
              {whatsapp ? (
                <Button
                  variant="secondary"
                  size="lg"
                  className="rounded-none border-ink-inverse/25 px-7 py-3 text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-ink-inverse hover:border-gold hover:text-gold"
                  onClick={() => window.open(whatsappHref(), '_blank', 'noopener,noreferrer')}
                >
                  WhatsApp
                </Button>
              ) : null}
            </div>

            <p className="mt-10 border-t border-ink-inverse/15 pt-6 text-[0.62rem] uppercase tracking-[0.24em] text-ink-inverse/40">
              By appointment &middot; Kurnool, Andhra Pradesh &middot; Serving India and the world
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
