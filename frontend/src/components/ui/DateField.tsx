import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Icon } from '@/components/icons';
import { cn } from '@/utils/cn';

export interface DateFieldProps {
  label?: string;
  error?: string;
  hint?: string;
  /** ISO date, `YYYY-MM-DD`. An empty string means "not set". */
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  id?: string;
  name?: string;
  className?: string;
  placeholder?: string;
  min?: string;
  max?: string;
  /** Marks the field as required for assistive technology and the form. */
  required?: boolean;
  'aria-label'?: string;
}

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function toIso(date: Date): string {
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function parseIso(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatHuman(value: string): string {
  const date = parseIso(value);
  if (!date) return '';
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

/**
 * A date field with a real calendar.
 *
 * Not a native date input: the browser's own date picker is an operating
 * system widget, so it cannot be styled, it ignores the theme and the font,
 * and it reads differently on every platform. This is a button that opens a
 * calendar grid instead — fully themed, keyboard-operable, and the same
 * everywhere.
 *
 * The grid follows the ARIA date-picker pattern: arrow keys move by day and
 * week, Page Up/Down move by month, Home/End jump to the ends of the week,
 * Enter picks, Escape closes. The trigger is a button with
 * `aria-haspopup="dialog"`, and the grid is a `role="grid"` of buttons, so a
 * screen reader announces the day, the weekday and whether it is selected.
 */
export function DateField({
  label,
  error,
  hint,
  value,
  onChange,
  disabled,
  id,
  name,
  className,
  placeholder = 'Pick a date',
  min,
  max,
  required = false,
  'aria-label': ariaLabel,
}: DateFieldProps) {
  const generatedId = useId();
  const triggerId = id ?? generatedId;
  const dialogId = `${triggerId}-calendar`;
  const errorId = `${triggerId}-error`;
  const hintId = `${triggerId}-hint`;

  const [open, setOpen] = useState(false);
  const selected = useMemo(() => parseIso(value), [value]);
  const [viewMonth, setViewMonth] = useState(() => selected ?? new Date());
  const [focusedDay, setFocusedDay] = useState<string>(() => value || toIso(new Date()));

  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const close = useCallback((returnFocus = true) => {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  useEffect(() => {
    if (open) setViewMonth(selected ?? new Date());
  }, [open, selected]);

  /** The six-week grid the month is drawn on, Monday first. */
  const weeks = useMemo(() => {
    const first = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1);
    // Monday-first: getDay() is Sunday-first, so shift it.
    const offset = (first.getDay() + 6) % 7;
    const start = new Date(first);
    start.setDate(first.getDate() - offset);

    const days: Date[] = [];
    for (let i = 0; i < 42; i += 1) {
      const day = new Date(start);
      day.setDate(start.getDate() + i);
      days.push(day);
    }
    return days;
  }, [viewMonth]);

  function isDisabled(iso: string) {
    if (min && iso < min) return true;
    if (max && iso > max) return true;
    return false;
  }

  function moveFocus(days: number) {
    const current = parseIso(focusedDay) ?? new Date();
    const next = new Date(current);
    next.setDate(current.getDate() + days);
    setFocusedDay(toIso(next));
    if (next.getMonth() !== viewMonth.getMonth() || next.getFullYear() !== viewMonth.getFullYear()) {
      setViewMonth(new Date(next.getFullYear(), next.getMonth(), 1));
    }
  }

  function onGridKeyDown(event: React.KeyboardEvent) {
    switch (event.key) {
      case 'ArrowRight':
        event.preventDefault();
        moveFocus(1);
        break;
      case 'ArrowLeft':
        event.preventDefault();
        moveFocus(-1);
        break;
      case 'ArrowDown':
        event.preventDefault();
        moveFocus(7);
        break;
      case 'ArrowUp':
        event.preventDefault();
        moveFocus(-7);
        break;
      case 'PageDown':
        event.preventDefault();
        setViewMonth(
          new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1),
        );
        break;
      case 'PageUp':
        event.preventDefault();
        setViewMonth(
          new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1),
        );
        break;
      case 'Home': {
        event.preventDefault();
        const current = parseIso(focusedDay);
        // Monday-first: getDay() is Sunday-first, so shift it.
        const offset = current ? (current.getDay() + 6) % 7 : 0;
        moveFocus(-offset);
        break;
      }
      case 'End': {
        event.preventDefault();
        const current = parseIso(focusedDay);
        const offset = current ? (current.getDay() + 6) % 7 : 0;
        moveFocus(6 - offset);
        break;
      }
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (!isDisabled(focusedDay)) {
          onChange(focusedDay);
          close();
        }
        break;
      case 'Escape':
        event.preventDefault();
        close();
        break;
      default:
        break;
    }
  }

  const today = toIso(new Date());

  return (
    <div className="flex w-full flex-col gap-1.5" ref={rootRef}>
      {label ? (
        <label htmlFor={triggerId} className="text-sm font-medium text-inherit opacity-90">
          {label}
        </label>
      ) : null}

      <div className="relative">
        <button
          ref={triggerRef}
          id={triggerId}
          type="button"
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={open ? dialogId : undefined}
          aria-invalid={error ? true : undefined}
          aria-label={ariaLabel}
          aria-required={required || undefined}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
          disabled={disabled}
          onClick={() => setOpen((current) => !current)}
          onKeyDown={(event) => {
            // While the calendar is open the trigger still holds the DOM
            // focus — that is what `aria-activedescendant` is for — so the
            // navigation keys are handled here rather than on the grid.
            if (!open) {
              if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                setOpen(true);
                setFocusedDay(value || toIso(new Date()));
                setViewMonth(selected ?? new Date());
              }
              return;
            }
            onGridKeyDown(event);
          }}
          className={cn(
            'flex w-full items-center justify-between gap-2 rounded-lg border py-2 pl-3.5 pr-3 text-left text-sm transition-all',
            'bg-surface-field text-ink-raised border-line',
            'focus:border-focus focus:outline-none focus:ring-2 focus:ring-focus/30',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error ? 'border-danger' : undefined,
            className,
          )}
        >
          <span className={cn('truncate', !value && 'text-ink/50')}>
            {value ? formatHuman(value) : placeholder}
          </span>
          <Icon name="calendar" size={15} className="shrink-0 text-ink-raised/60" />
        </button>

        {open ? (
          <div
            id={dialogId}
            role="dialog"
            aria-label={ariaLabel ?? label ?? 'Choose a date'}
            className="absolute z-50 mt-1.5 w-[19rem] rounded-xl border border-line bg-surface-raised p-3 shadow-[var(--shadow-raised)]"
          >
            <div className="mb-2 flex items-center justify-between">
              <button
                type="button"
                aria-label="Previous month"
                onClick={() =>
                  setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1))
                }
                className="rounded-md p-1.5 text-ink/60 transition hover:bg-ink/[0.06] hover:text-ink"
              >
                <Icon name="chevronLeft" size={15} />
              </button>
              <p className="text-sm font-semibold text-ink">
                {MONTHS[viewMonth.getMonth()]} {viewMonth.getFullYear()}
              </p>
              <button
                type="button"
                aria-label="Next month"
                onClick={() =>
                  setViewMonth(new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1))
                }
                className="rounded-md p-1.5 text-ink/60 transition hover:bg-ink/[0.06] hover:text-ink"
              >
                <Icon name="chevronRight" size={15} />
              </button>
            </div>

            <div className="mb-1 grid grid-cols-7 gap-0.5">
              {WEEKDAYS.map((day) => (
                <div
                  key={day}
                  className="py-1 text-center text-[0.6rem] font-semibold uppercase tracking-wider text-ink/45"
                >
                  {day}
                </div>
              ))}
            </div>

            <div
              ref={gridRef}
              role="grid"
              aria-label="Choose a date"
              className="grid grid-cols-7 gap-0.5"
            >
              {weeks.map((day) => {
                const iso = toIso(day);
                const inMonth = day.getMonth() === viewMonth.getMonth();
                const isSelected = iso === value;
                const isToday = iso === today;
                const disabled = isDisabled(iso);
                return (
                  <button
                    key={iso}
                    type="button"
                    role="gridcell"
                    tabIndex={iso === focusedDay ? 0 : -1}
                    aria-selected={isSelected}
                    aria-label={day.toLocaleDateString('en-GB', {
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                    disabled={disabled}
                    onClick={() => {
                      if (disabled) return;
                      onChange(iso);
                      close();
                    }}
                    onFocus={() => setFocusedDay(iso)}
                    className={cn(
                      'rounded-md py-1.5 text-xs tabular-nums transition',
                      inMonth ? 'text-ink' : 'text-ink/30',
                      isSelected
                        ? 'bg-brand font-semibold text-ink-on-brand'
                        : isToday
                          ? 'ring-1 ring-inset ring-brand/50 text-ink'
                          : 'hover:bg-ink/[0.06]',
                      disabled && 'cursor-not-allowed opacity-30 hover:bg-transparent',
                    )}
                  >
                    {day.getDate()}
                  </button>
                );
              })}
            </div>

            <div className="mt-2 flex items-center justify-between border-t border-line pt-2">
              <button
                type="button"
                onClick={() => {
                  onChange('');
                  close();
                }}
                className="rounded-md px-2 py-1 text-xs text-ink/60 transition hover:bg-ink/[0.06] hover:text-ink"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => {
                  onChange(today);
                  close();
                }}
                className="rounded-md px-2 py-1 text-xs font-semibold text-brand-strong transition hover:bg-brand/10"
              >
                Today
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {name ? <input type="hidden" name={name} value={value} readOnly /> : null}

      {hint && !error ? (
        <p id={hintId} className="text-xs text-ink/60">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="text-xs text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
