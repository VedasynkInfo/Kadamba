import { cn } from '@/utils/cn';

export interface FilterOption {
  /** The value used by the page's state — `All`, `Bridal`, a category code. */
  id: string;
  label: string;
}

export interface FilterRowProps {
  options: FilterOption[];
  value: string;
  onChange: (id: string) => void;
  /** `dark` for a section on espresso, `light` for the paper pages. */
  tone?: 'light' | 'dark';
  className?: string;
  /** What the group filters, for screen readers. */
  label?: string;
}

/**
 * The house filter.
 *
 * The console uses pills because they read as controls. On the public site a
 * filter is a line of the page's own type: uppercase, ruled, and underlined
 * where active. One component keeps the catalogue, the gallery and the journal
 * from drifting into three different treatments.
 */
export function FilterRow({
  options,
  value,
  onChange,
  tone = 'light',
  className,
  label = 'Filter',
}: FilterRowProps) {
  const dark = tone === 'dark';

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-x-7 gap-y-2 border-b pb-3',
        dark ? 'border-ink-inverse/15' : 'border-ink/12',
        className,
      )}
      role="group"
      aria-label={label}
    >
      {options.map((option) => {
        const active = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            aria-pressed={active}
            className={cn(
              'min-h-9 border-b pb-2 text-[0.6rem] font-semibold uppercase tracking-[0.2em] transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2',
              active
                ? dark
                  ? 'border-gold text-gold'
                  : 'border-brand-strong text-ink'
                : dark
                  ? 'border-transparent text-ink-inverse/45 hover:text-ink-inverse/80'
                  : 'border-transparent text-ink/40 hover:text-ink/75',
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
