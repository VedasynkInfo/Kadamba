import type { ReactNode } from 'react';
import { OptimizedImage } from '@/components/media/OptimizedImage';
import { cn } from '@/utils/cn';
import { Reveal } from './Reveal';

export interface QuoteBlockProps {
  quote: ReactNode;
  name: string;
  detail: string;
  image: string;
  /** The collection or occasion the quote is about. */
  context?: string;
  align?: 'left' | 'right';
  className?: string;
}

/**
 * A client's sentence, set large.
 *
 * Not a card in a carousel of five identical cards — one quotation, given the
 * whole width, with the portrait as a tall plate beside it. A single quote that
 * is allowed to be big is more persuasive than five that are not.
 */
export function QuoteBlock({
  quote,
  name,
  detail,
  image,
  context,
  align = 'left',
  className,
}: QuoteBlockProps) {
  return (
    <div
      className={cn(
        'grid items-center gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20',
        align === 'right' && 'lg:grid-cols-[1.2fr_0.8fr]',
        className,
      )}
    >
      <Reveal className={cn(align === 'right' && 'lg:order-2')}>
        <div className="plate plate-frame plate-hover aspect-[4/5] w-full">
          <OptimizedImage
            src={image}
            alt={`${name}, a Kadamba client`}
            sizes="(min-width: 1024px) 34vw, 100vw"
            className="h-full w-full object-cover"
          />
        </div>
      </Reveal>

      <Reveal delay={0.1} className={cn(align === 'right' && 'lg:order-1')}>
        {context ? <p className="eyebrow">{context}</p> : null}
        <blockquote className="mt-7">
          <p className="font-heading text-[clamp(1.7rem,3.2vw,2.9rem)] font-light italic leading-[1.22] text-ink">
            &ldquo;{quote}&rdquo;
          </p>
        </blockquote>
        <figcaption className="mt-9 flex items-center gap-4 border-t border-ink/12 pt-6">
          <span className="font-heading text-lg text-ink">{name}</span>
          <span className="h-px w-8 bg-brand-strong/60" aria-hidden />
          <span className="text-[0.62rem] uppercase tracking-[0.24em] text-ink/65">{detail}</span>
        </figcaption>
      </Reveal>
    </div>
  );
}
