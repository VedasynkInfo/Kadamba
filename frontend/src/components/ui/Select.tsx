import type { SelectHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

/**
 * Styled select menu with label and error support.
 */
export function Select({
  label,
  error,
  options,
  placeholder,
  id,
  className,
  disabled,
  ...props
}: SelectProps) {
  const selectId = id ?? props.name;

  return (
    <div className="flex w-full flex-col gap-1.5">
      {label ? (
        <label htmlFor={selectId} className="text-sm font-medium text-inherit opacity-90">
          {label}
        </label>
      ) : null}
      {/*
        The chevron is a real element, not a background image. The data-URI it
        replaced had a black stroke baked into the SVG, so it was invisible in
        the dark console — a colour that failed to follow the shell. As an inline
        SVG it inherits `currentColor` and dims with the field's disabled state,
        which a background image cannot do.
      */}
      <div className="relative">
        <select
          id={selectId}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          className={cn(
            'peer w-full appearance-none rounded-lg border py-2 pl-3.5 pr-9 text-sm transition-all',
            'bg-surface-field text-ink-raised border-line',
            'focus:border-focus focus:outline-none focus:ring-2 focus:ring-focus/30',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error ? 'border-danger' : undefined,
            className,
          )}
          {...props}
        >
          {placeholder ? (
            <option value="" disabled>
              {placeholder}
            </option>
          ) : null}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-raised/70 peer-disabled:opacity-50"
        >
          <path d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      {error ? (
        <p role="alert" className="text-xs text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
