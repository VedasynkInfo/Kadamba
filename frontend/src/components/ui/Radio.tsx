import type { InputHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/utils/cn';

export interface RadioOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface RadioGroupProps {
  name: string;
  label?: string;
  options: RadioOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  error?: string;
  className?: string;
}

/**
 * Radio button group with gold accent styling.
 */
export function RadioGroup({
  name,
  label,
  options,
  value,
  defaultValue,
  onChange,
  error,
  className,
}: RadioGroupProps) {
  return (
    <fieldset className={cn('flex flex-col gap-2', className)}>
      {label ? <legend className="mb-1 text-sm font-medium text-black">{label}</legend> : null}
      <div className="flex flex-col gap-2" role="radiogroup" aria-label={label}>
        {options.map((opt) => (
          <label
            key={opt.value}
            className={cn(
              'inline-flex cursor-pointer items-center gap-2.5 text-sm text-black',
              opt.disabled && 'cursor-not-allowed opacity-50',
            )}
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              disabled={opt.disabled}
              checked={value !== undefined ? value === opt.value : undefined}
              defaultChecked={
                value === undefined ? defaultValue === opt.value : undefined
              }
              onChange={() => onChange?.(opt.value)}
              className={cn(
                'size-4 appearance-none rounded-full border border-black/25 bg-cream',
                'checked:border-gold checked:bg-gold checked:shadow-[inset_0_0_0_3px_#fffdd0]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40',
              )}
            />
            <span>{opt.label}</span>
          </label>
        ))}
      </div>
      {error ? (
        <p role="alert" className="text-xs text-red-700">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}

export type RadioProps = InputHTMLAttributes<HTMLInputElement> & { children?: ReactNode };
