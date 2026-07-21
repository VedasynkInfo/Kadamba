import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/utils/cn';

export type CardVariant = 'default' | 'image' | 'pricing' | 'service';

export interface CardProps extends HTMLAttributes<HTMLElement> {
  variant?: CardVariant;
  children: ReactNode;
  /** Optional media for image / service cards. */
  media?: ReactNode;
  /** Highlight pricing card as featured. */
  featured?: boolean;
  as?: 'article' | 'div' | 'section';
}

/**
 * Flexible card layouts: default, image overlay, pricing, and service.
 */
export function Card({
  variant = 'default',
  children,
  media,
  featured = false,
  as: Comp = 'article',
  className,
  ...props
}: CardProps) {
  if (variant === 'image') {
    return (
      <Comp
        className={cn(
          'group relative overflow-hidden rounded-lg bg-black text-cream',
          'focus-within:ring-2 focus-within:ring-gold',
          className,
        )}
        {...props}
      >
        <div className="aspect-[4/3] w-full overflow-hidden bg-elevated">{media}</div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-5 transition-transform duration-300 ease-[var(--ease-luxury)] group-hover:-translate-y-1">
          {children}
        </div>
      </Comp>
    );
  }

  if (variant === 'pricing') {
    return (
      <Comp
        className={cn(
          'flex flex-col rounded-lg border p-6 transition-shadow duration-300',
          featured
            ? 'border-gold bg-black text-cream shadow-[var(--shadow-gold)]'
            : 'border-black/10 bg-cream text-black',
          className,
        )}
        {...props}
      >
        {featured ? (
          <span className="mb-3 inline-block self-start text-xs font-semibold uppercase tracking-widest text-gold">
            Featured
          </span>
        ) : null}
        {children}
      </Comp>
    );
  }

  if (variant === 'service') {
    return (
      <Comp
        className={cn(
          'rounded-lg border border-black/10 bg-cream p-6 transition-all duration-300',
          'hover:border-gold/50 hover:shadow-[var(--shadow-soft)]',
          className,
        )}
        {...props}
      >
        {media ? <div className="mb-4 text-gold">{media}</div> : null}
        {children}
      </Comp>
    );
  }

  return (
    <Comp
      className={cn('rounded-lg border border-black/10 bg-cream p-6 text-black', className)}
      {...props}
    >
      {children}
    </Comp>
  );
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h3 className={cn('font-heading text-xl text-inherit', className)}>{children}</h3>
  );
}

export function CardDescription({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <p className={cn('mt-2 text-sm opacity-70', className)}>{children}</p>;
}
