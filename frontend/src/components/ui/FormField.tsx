import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

export interface FormFieldProps {
  label?: string;
  required?: boolean;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
  tone?: 'light' | 'dark';
}

export function FormField({
  label,
  required,
  error,
  hint,
  children,
  className,
  tone = 'light',
}: FormFieldProps) {
  const labelColor = tone === 'dark' ? 'text-ink-inverse' : 'text-ink';
  const hintColor = tone === 'dark' ? 'text-ink-inverse/50' : 'text-ink/50';
  const requiredColor = tone === 'dark' ? 'text-gold' : 'text-gold';

  return (
    <div className={cn('flex w-full flex-col gap-1.5', className)}>
      {label ? (
        <label className={cn('text-xs font-semibold uppercase tracking-wider', labelColor)}>
          {label}
          {required ? (
            <span className={cn('ml-0.5', requiredColor)} aria-hidden>
              *
            </span>
          ) : null}
        </label>
      ) : null}
      {children}
      {hint && !error ? (
        <p className={cn('text-xs', hintColor)}>{hint}</p>
      ) : null}
      {error ? (
        <p role="alert" className="text-xs text-rose-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
