import { useMemo, useState } from 'react';
import { DateField, type DateFieldProps } from './DateField';
import { Select } from './Select';

export interface DateTimeFieldProps extends Omit<DateFieldProps, 'value' | 'onChange'> {
  /** `YYYY-MM-DDTHH:mm`, or an empty string for "not set". */
  value: string;
  onChange: (value: string) => void;
  /** The times offered, in 24-hour `HH:mm`. */
  slots?: string[];
}

/** Half-hourly slots across the studio's working day. */
function defaultSlots(): string[] {
  const slots: string[] = [];
  for (let minutes = 9 * 60; minutes <= 19 * 60; minutes += 30) {
    const hours = `${Math.floor(minutes / 60)}`.padStart(2, '0');
    const mins = `${minutes % 60}`.padStart(2, '0');
    slots.push(`${hours}:${mins}`);
  }
  return slots;
}

function formatSlot(slot: string): string {
  const [hours, minutes] = slot.split(':').map(Number);
  const suffix = hours >= 12 ? 'pm' : 'am';
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hour12}:${`${minutes}`.padStart(2, '0')} ${suffix}`;
}

/**
 * A date and a time, in one field.
 *
 * The browser's `datetime-local` control is a native picker, so it cannot be
 * styled and reads differently on every platform. This is the same calendar
 * as the date field with a list of studio hours beside it — the time is a
 * choice from a list, not a second wheel.
 */
export function DateTimeField({
  value,
  onChange,
  slots,
  label,
  error,
  hint,
  min,
  max,
  id,
  name,
  className,
  placeholder = 'Pick a date',
  disabled,
  required = false,
  'aria-label': ariaLabel,
}: DateTimeFieldProps) {
  const offers = useMemo(() => slots ?? defaultSlots(), [slots]);
  const date = value.slice(0, 10);
  const time = value.slice(11, 16) || offers[0];

  const [pendingDate, setPendingDate] = useState(date);

  function commit(nextDate: string) {
    setPendingDate(nextDate);
    onChange(nextDate ? `${nextDate}T${time}` : '');
  }

  return (
    <div className={className}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <DateField
          label={label}
          error={error}
          hint={hint}
          min={min}
          max={max}
          id={id}
          name={name ? `${name}-date` : undefined}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          aria-label={ariaLabel}
          value={pendingDate}
          onChange={commit}
        />
        <Select
          label="Time"
          aria-label={ariaLabel ? `${ariaLabel} time` : 'Time'}
          disabled={disabled}
          value={time}
          onChange={(next) => onChange(pendingDate ? `${pendingDate}T${next}` : '')}
          options={offers.map((slot) => ({ value: slot, label: formatSlot(slot) }))}
        />
      </div>
    </div>
  );
}
