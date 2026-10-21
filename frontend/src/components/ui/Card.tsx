import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/utils/cn';

/**
 * `admin` is accepted for compatibility and behaves exactly like `default`: the
 * surface a card sits on is decided by the *shell* (`index.css` re-points the
 * semantic tokens under `.admin-shell`), not by the card. Passing the variant can
 * no longer produce a card that disagrees with the background it is on — which
 * is what the old inline `var(--admin-card)` branches did the moment a card
 * was rendered outside the shell it was written for.
 */
export type CardVariant = 'default' | 'image' | 'pricing' | 'service' | 'admin';

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
 * Modern Aceternity & 21st.dev inspired Card with top-edge light beam and luxury
 * hover transitions. Colours come from the semantic tokens, so one card works on
 * the cream public site, in the dark console and in the portal.
 */
export function Card({
  variant = 'default',
  children,
  media,
  featured = false,
  as: Comp = 'article',
  className,
  style,
  ...props
}: CardProps) {
  if (variant === 'image') {
    return (
      <Comp
        className={cn(
          'group relative overflow-hidden rounded-xl bg-surface-inverse text-ink-inverse shadow-md transition-all duration-300',
          'focus-within:ring-2 focus-within:ring-focus',
          className,
        )}
        style={style}
        {...props}
      >
        <div className="aspect-[4/3] w-full overflow-hidden bg-elevated">{media}</div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-5 transition-transform duration-300 ease-luxury group-hover:-translate-y-1">
          {children}
        </div>
      </Comp>
    );
  }

  if (variant === 'pricing') {
    return (
      <Comp
        className={cn(
          'group relative flex flex-col overflow-hidden rounded-xl border p-6 transition-all duration-300',
          featured
            ? 'border-gold bg-surface-inverse text-ink-inverse shadow-gold'
            : 'border-line bg-surface-raised text-ink hover:border-gold/40 hover:shadow-lg',
          className,
        )}
        style={style}
        {...props}
      >
        <span
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
          aria-hidden
        />
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
          'group relative overflow-hidden rounded-xl border border-line bg-surface-raised p-6 text-ink transition-all duration-300',
          'hover:border-gold/50 hover:shadow-lg hover:-translate-y-0.5',
          className,
        )}
        style={style}
        {...props}
      >
        <span
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent"
          aria-hidden
        />
        {media ? <div className="mb-4 text-gold">{media}</div> : null}
        {children}
      </Comp>
    );
  }

  return (
    <Comp
      className={cn(
        'group relative overflow-hidden rounded-xl border border-line bg-surface-raised p-6 text-ink transition-all duration-200',
        'hover:shadow-md',
        className,
      )}
      style={style}
      {...props}
    >
      <span
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
        aria-hidden
      />
      {children}
    </Comp>
  );
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <h3 className={cn('font-heading text-xl text-inherit', className)}>{children}</h3>;
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
