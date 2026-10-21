import type { InputHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  error?: string;
}

/**
 * Accessible checkbox with custom gold accent.
 */
export function Checkbox({ label, error, id, className, disabled, ...props }: CheckboxProps) {
  const checkId = id ?? props.name;

  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={checkId}
        className={cn(
          'inline-flex cursor-pointer items-start gap-2.5 text-sm text-ink',
          disabled && 'cursor-not-allowed opacity-50',
          className,
        )}
      >
        <input
          id={checkId}
          type="checkbox"
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          className={cn(
            'mt-0.5 size-4 shrink-0 appearance-none rounded border border-line-strong bg-surface-field',
            'checked:border-gold checked:bg-gold',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus/40',
            'disabled:cursor-not-allowed',
          )}
          {...props}
        />
        <span>{label}</span>
      </label>
      {error ? (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
