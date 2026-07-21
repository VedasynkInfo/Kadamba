import type { InputHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

/**
 * Text input with label, hint, and error states.
 */
export function Input({
  label,
  error,
  hint,
  id,
  className,
  disabled,
  ...props
}: InputProps) {
  const inputId = id ?? props.name;

  return (
    <div className="flex w-full flex-col gap-1.5">
      {label ? (
        <label htmlFor={inputId} className="text-sm font-medium text-black">
          {label}
          {props.required ? (
            <span className="ml-0.5 text-gold" aria-hidden>
              *
            </span>
          ) : null}
        </label>
      ) : null}
      <input
        id={inputId}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        aria-describedby={
          error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined
        }
        className={cn(
          'w-full rounded-md border bg-cream px-3 py-2.5 text-sm text-black',
          'placeholder:text-black/40',
          'transition-colors duration-200',
          'focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error ? 'border-red-600' : 'border-black/15',
          className,
        )}
        {...props}
      />
      {hint && !error ? (
        <p id={`${inputId}-hint`} className="text-xs text-black/50">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${inputId}-error`} role="alert" className="text-xs text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
