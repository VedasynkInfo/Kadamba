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
        <label htmlFor={selectId} className="text-sm font-medium text-black">
          {label}
        </label>
      ) : null}
      <select
        id={selectId}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        className={cn(
          'w-full appearance-none rounded-md border bg-cream px-3 py-2.5 text-sm text-black',
          'bg-[length:1rem] bg-[right_0.75rem_center] bg-no-repeat',
          'focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold/30',
          'disabled:cursor-not-allowed disabled:opacity-50',
          error ? 'border-red-600' : 'border-black/15',
          className,
        )}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23000000'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
        }}
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
      {error ? (
        <p role="alert" className="text-xs text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
