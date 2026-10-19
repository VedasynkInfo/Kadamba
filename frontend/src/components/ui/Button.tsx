import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/utils/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'luxury' | 'admin';
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
  primary:
    'bg-[var(--color-primary,#000000)] text-[var(--color-primary-text,#ffffff)] border border-white/10 hover:opacity-90 shadow-sm focus-visible:ring-[var(--color-accent,#b59410)]',
  admin:
    'bg-[var(--admin-primary,var(--color-accent,#b59410))] text-[var(--admin-primary-text,#000000)] border border-white/20 hover:brightness-105 shadow-sm font-semibold focus-visible:ring-gold',
  secondary:
    'bg-transparent text-inherit border border-white/15 hover:border-gold/50 hover:bg-white/[0.05] shadow-xs',
  ghost:
    'bg-transparent text-inherit hover:bg-white/[0.08] border border-transparent',
  luxury:
    'bg-black text-gold border border-gold/40 hover:border-gold hover:shadow-[0_0_20px_rgba(255,215,0,0.2)] relative overflow-hidden',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-md',
  md: 'px-4 py-2 text-sm rounded-lg',
  lg: 'px-6 py-3 text-base rounded-lg',
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
        'transition-all duration-200 ease-[var(--ease-luxury)]',
        'active:scale-[0.98] disabled:active:scale-100',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-transparent',
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
