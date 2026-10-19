import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/utils/cn';

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
 * Modern Aceternity & 21st.dev inspired Card with top-edge light beam,
 * dynamic public/admin tokens, and luxury hover transitions.
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
  const isAdmin = variant === 'admin';

  if (variant === 'image') {
    return (
      <Comp
        className={cn(
          'group relative overflow-hidden rounded-xl bg-black text-cream shadow-md transition-all duration-300',
          'focus-within:ring-2 focus-within:ring-gold',
          className,
        )}
        style={style}
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
          'group relative flex flex-col overflow-hidden rounded-xl border p-6 transition-all duration-300',
          featured
            ? 'border-gold shadow-[0_8px_30px_rgba(255,215,0,0.18)]'
            : 'border-white/10 hover:border-gold/40 hover:shadow-lg',
          className,
        )}
        style={{
          backgroundColor: featured ? '#000000' : 'var(--public-card, #ffffff)',
          color: featured ? 'var(--color-cream, #fffdd0)' : 'var(--public-card-text, #171717)',
          ...style,
        }}
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
          'group relative overflow-hidden rounded-xl border p-6 transition-all duration-300',
          'hover:border-gold/50 hover:shadow-lg hover:-translate-y-0.5',
          className,
        )}
        style={{
          backgroundColor: 'var(--public-card, #ffffff)',
          borderColor: 'rgba(0, 0, 0, 0.08)',
          color: 'var(--public-card-text, #171717)',
          ...style,
        }}
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
        'group relative overflow-hidden rounded-xl border p-6 transition-all duration-200',
        isAdmin ? 'shadow-sm hover:border-white/20' : 'hover:shadow-md',
        className,
      )}
      style={{
        backgroundColor: isAdmin ? 'var(--admin-card, #1f2937)' : 'var(--public-card, #ffffff)',
        borderColor: isAdmin ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
        color: isAdmin ? 'var(--admin-card-text, #f3f4f6)' : 'var(--public-card-text, #171717)',
        ...style,
      }}
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
