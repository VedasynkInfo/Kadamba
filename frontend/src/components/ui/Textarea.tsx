import type { TextareaHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

/**
 * Multiline text field matching Input styling.
 */
export function Textarea({
  label,
  error,
  hint,
  id,
  className,
  disabled,
  rows = 4,
  ...props
}: TextareaProps) {
  const areaId = id ?? props.name;

  return (
    <div className="flex w-full flex-col gap-1.5">
      {label ? (
        <label htmlFor={areaId} className="text-sm font-medium text-inherit opacity-90">
          {label}
          {props.required ? (
            <span className="ml-0.5 text-gold" aria-hidden>
              *
            </span>
          ) : null}
        </label>
      ) : null}
      <textarea
        id={areaId}
        disabled={disabled}
        rows={rows}
        aria-invalid={error ? true : undefined}
        aria-describedby={
          error ? `${areaId}-error` : hint ? `${areaId}-hint` : undefined
        }
        className={cn(
          'w-full resize-y rounded-lg border px-3.5 py-2 text-sm transition-all',
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
        <p id={`${areaId}-hint`} className="text-xs text-ink/70">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${areaId}-error`} role="alert" className="text-xs text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
