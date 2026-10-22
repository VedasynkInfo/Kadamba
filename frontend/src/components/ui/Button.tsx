import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/utils/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'luxury' | 'admin' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual style of the button. */
  variant?: ButtonVariant;
  /** Padding and font size. */
  size?: ButtonSize;
  /** Shows a loading spinner and disables interaction. */
  loading?: boolean;
  children: ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  /* Gold is the action colour across the whole product: a filled button is
     gold with dark ink on it, which is the only pairing that stays legible
     on the light surfaces the console and the public site now share. */
  primary:
    'bg-[var(--color-primary)] text-[var(--color-primary-text)] border border-black/10 hover:bg-[var(--color-primary-hover)] shadow-sm focus-visible:ring-focus',
  admin:
    'bg-brand text-ink-on-brand border border-black/10 hover:brightness-[0.97] shadow-sm font-semibold focus-visible:ring-focus',
  secondary:
    'bg-surface-raised text-ink border border-line hover:border-brand/45 hover:bg-surface-sunken shadow-xs',
  danger:
    'bg-danger/10 text-danger border border-danger/30 hover:bg-danger/15 shadow-xs',
  ghost:
    'bg-transparent text-ink hover:bg-current/[0.06] border border-transparent',
  luxury:
    'bg-espresso text-gold border border-gold/40 hover:border-gold hover:shadow-[0_0_20px_rgba(227,178,60,0.22)] relative overflow-hidden',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-4 py-2 text-sm rounded-lg',
  lg: 'px-6 py-2.5 text-base rounded-xl',
};

/**
 * Modern Aceternity & shadcn-inspired button with tactile feedback,
 * top-edge highlight beam, and dynamic theme compatibility.
 */
export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className,
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={cn(
        'group relative inline-flex items-center justify-center gap-2 font-medium tracking-wide',
        'transition-all duration-200 ease-luxury',
        'active:scale-[0.98] disabled:active:scale-100',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-1 focus-visible:ring-offset-transparent',
        'disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {/* Aceternity style subtle top-edge luminous highlight for solid buttons */}
      {(variant === 'primary' || variant === 'admin' || variant === 'luxury') && (
        <span
          className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent rounded-t-lg"
          aria-hidden
        />
      )}

      {loading ? (
        <span
          className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
          aria-hidden
        />
      ) : null}
      {children}
    </button>
  );
}
