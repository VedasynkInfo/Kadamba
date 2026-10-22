import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Icon } from '@/components/icons';
import { cn } from '@/utils/cn';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  /** A short note shown under the label — a category's count, a status hint. */
  hint?: string;
}

export interface SelectProps {
  label?: string;
  error?: string;
  hint?: string;
  options: SelectOption[];
  placeholder?: string;
  /** The selected value. `''` means "nothing selected". */
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  id?: string;
  name?: string;
  className?: string;
  /** Rendered before the options — a search box for a long list. */
  searchable?: boolean;
  /** Marks the field as required for assistive technology and the form. */
  required?: boolean;
  'aria-label'?: string;
}

/**
 * A custom listbox.
 *
 * There is no native `<select>` here on purpose. A native select cannot be
 * styled into the product — its option list is drawn by the operating system,
 * so it ignores the design system, the theme, and the font — and on a long
 * list it offers no search. This is the ARIA listbox pattern instead:
 *
 *  - the trigger is a button with `aria-haspopup="listbox"` and
 *    `aria-expanded`;
 *  - the list is `role="listbox"`, each option `role="option"` with
 *    `aria-selected`;
 *  - the active option is tracked with `aria-activedescendant`, so the
 *    screen reader announces it while the DOM focus stays on the trigger;
 *  - Arrow keys move, Enter/Space choose, Escape closes, Home/End jump, and
 *    typing letters jumps to an option that starts with them.
 *
 * The trigger is a real `<button>`, so it is reachable by Tab and announced
 * as a button — which a native select is not.
 */
export function Select({
  label,
  error,
  hint,
  options,
  placeholder = 'Select…',
  value,
  onChange,
  disabled,
  id,
  name,
  className,
  searchable = false,
  required = false,
  'aria-label': ariaLabel,
}: SelectProps) {
  const generatedId = useId();
  const listboxId = `${id ?? generatedId}-listbox`;
  const triggerId = id ?? generatedId;
  const errorId = `${triggerId}-error`;
  const hintId = `${triggerId}-hint`;

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [query, setQuery] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selected = useMemo(
    () => options.find((option) => option.value === value) ?? null,
    [options, value],
  );

  const filtered = useMemo(() => {
    if (!searchable || !query.trim()) return options;
    const needle = query.trim().toLowerCase();
    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(needle) ||
        (option.hint ?? '').toLowerCase().includes(needle),
    );
  }, [options, query, searchable]);

  const close = useCallback((returnFocus = true) => {
    setOpen(false);
    setQuery('');
    if (returnFocus) triggerRef.current?.focus();
  }, []);

  const openList = useCallback(() => {
    if (disabled) return;
    setOpen(true);
    setQuery('');
    const index = options.findIndex((option) => option.value === value);
    setActiveIndex(index >= 0 ? index : 0);
  }, [disabled, options, value]);

  const commit = useCallback(
    (option: SelectOption) => {
      if (option.disabled) return;
      onChange(option.value);
      close();
    },
    [close, onChange],
  );

  // Clicking outside closes the list, the way every menu does.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, [open]);

  // Keep the active option scrolled into view while arrowing through a long list.
  useEffect(() => {
    if (!open || activeIndex < 0) return;
    const node = listRef.current?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`);
    node?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex, open]);

  function move(step: number) {
    if (!filtered.length) return;
    let next = activeIndex;
    for (let i = 0; i < filtered.length; i += 1) {
      next = (next + step + filtered.length) % filtered.length;
      if (!filtered[next]?.disabled) break;
    }
    setActiveIndex(next);
  }

  function onKeyDown(event: React.KeyboardEvent) {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!open) openList();
        else move(1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (!open) openList();
        else move(-1);
        break;
      case 'Home':
        if (open) {
          event.preventDefault();
          setActiveIndex(0);
        }
        break;
      case 'End':
        if (open) {
          event.preventDefault();
          setActiveIndex(filtered.length - 1);
        }
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (!open) {
          openList();
        } else if (activeIndex >= 0 && filtered[activeIndex]) {
          commit(filtered[activeIndex]);
        }
        break;
      case 'Escape':
        if (open) {
          event.preventDefault();
          close();
        }
        break;
      case 'Tab':
        if (open) close(false);
        break;
      default: {
        // Type-ahead: jump to the option starting with the typed letter.
        if (open && event.key.length === 1 && /\S/.test(event.key)) {
          const needle = event.key.toLowerCase();
          const index = filtered.findIndex(
            (option) => option.label.toLowerCase().startsWith(needle),
          );
          if (index >= 0) {
            event.preventDefault();
            setActiveIndex(index);
          }
        }
      }
    }
  }

  const activeOptionId = activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined;

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
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? listboxId : undefined}
          aria-activedescendant={open ? activeOptionId : undefined}
          aria-invalid={error ? true : undefined}
          aria-label={ariaLabel}
          aria-required={required || undefined}
          aria-describedby={
            error ? errorId : hint ? hintId : undefined
          }
          disabled={disabled}
          onClick={() => (open ? close() : openList())}
          onKeyDown={onKeyDown}
          className={cn(
            'flex w-full items-center justify-between gap-2 rounded-lg border py-2 pl-3.5 pr-9 text-left text-sm transition-all',
            'bg-surface-field text-ink-raised border-line',
            'focus:border-focus focus:outline-none focus:ring-2 focus:ring-focus/30',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error ? 'border-danger' : undefined,
            className,
          )}
        >
          <span className={cn('truncate', !selected && 'text-ink/50')}>
            {selected?.label ?? placeholder}
          </span>
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn(
              'pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-raised/70',
              open && 'rotate-180',
            )}
          >
            <path d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {open ? (
          <div
            className="absolute z-50 mt-1.5 w-full overflow-hidden rounded-lg border border-line bg-surface-raised shadow-[var(--shadow-raised)]"
            role="presentation"
          >
            {searchable ? (
              <div className="border-b border-line p-2">
                <div className="relative">
                  <span className="pointer-events-none absolute inset-y-0 left-2.5 flex items-center text-ink/40">
                    <Icon name="search" size={13} />
                  </span>
                  <input
                    autoFocus
                    type="text"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search…"
                    aria-label="Filter options"
                    className="w-full rounded-md border border-line bg-surface-field py-1.5 pl-7 pr-2 text-xs text-ink outline-none focus:border-focus"
                  />
                </div>
              </div>
            ) : null}

            <ul
              ref={listRef}
              id={listboxId}
              role="listbox"
              aria-label={ariaLabel ?? label ?? 'Options'}
              className="max-h-60 overflow-y-auto py-1"
            >
              {filtered.length === 0 ? (
                <li className="px-3 py-2 text-xs text-ink/55">No matches</li>
              ) : (
                filtered.map((option, index) => {
                  const isSelected = option.value === value;
                  const isActive = index === activeIndex;
                  return (
                    <li
                      key={option.value}
                      id={`${listboxId}-option-${index}`}
                      role="option"
                      data-index={index}
                      aria-selected={isSelected}
                      aria-disabled={option.disabled || undefined}
                      onMouseEnter={() => setActiveIndex(index)}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => commit(option)}
                      className={cn(
                        'flex cursor-pointer items-center justify-between gap-3 px-3 py-1.5 text-sm',
                        isActive ? 'bg-brand/10 text-ink' : 'text-ink/80',
                        isSelected && 'font-semibold text-brand-strong',
                        option.disabled && 'cursor-not-allowed opacity-40',
                      )}
                    >
                      <span className="truncate">{option.label}</span>
                      {option.hint ? (
                        <span className="shrink-0 text-[0.65rem] text-ink/45">{option.hint}</span>
                      ) : null}
                    </li>
                  );
                })
              )}
            </ul>
          </div>
        ) : null}
      </div>

      {/* The name is carried for form posts; the value itself is controlled. */}
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
