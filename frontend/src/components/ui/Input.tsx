import { useId, type InputHTMLAttributes } from 'react';
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
  // A generated id keeps the label associated with the field even when the
  // caller gives neither an `id` nor a `name`. Without it the `<label>` has
  // no `for`, the input is announced with no name at all, and clicking the
  // label does not focus the field.
  const generatedId = useId();
  const inputId = id ?? props.name ?? generatedId;

  return (
    <div className="flex w-full flex-col gap-1.5">
      {label ? (
        <label htmlFor={inputId} className="text-sm font-medium text-inherit opacity-90">
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
          'w-full rounded-lg border px-3.5 py-2 text-sm transition-all duration-150',
          'bg-surface-field text-ink-raised border-line',
          'placeholder:text-ink/60',
          'focus:border-focus focus:outline-none focus:ring-2 focus:ring-focus/30',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error ? 'border-danger' : undefined,
          className,
        )}
        {...props}
      />
      {hint && !error ? (
        <p id={`${inputId}-hint`} className="text-xs text-ink/70">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${inputId}-error`} role="alert" className="text-xs text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
