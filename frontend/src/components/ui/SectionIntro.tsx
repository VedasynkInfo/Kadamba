import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/utils/cn';
import { Heading, type HeadingLevel } from './Heading';

export interface SectionIntroProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  title: ReactNode;
  description?: ReactNode;
  /** A small uppercase label above the title — the section's subject. */
  eyebrow?: ReactNode;
  /** Heading level for the title. */
  as?: HeadingLevel;
  /** Light (cream) or dark (black) section surfaces. */
  tone?: 'light' | 'dark';
  /** Optional right-side actions (filters, links). */
  actions?: ReactNode;
  /** Center the intro block (e.g. CTA banners). */
  align?: 'start' | 'center';
}

/**
 * Classic section header — title + readable lede measure.
 * Always use this instead of ad-hoc max-w-sm/md/lg/xl on body copy.
 */
export function SectionIntro({
  title,
  description,
  eyebrow,
  as = 2,
  tone = 'light',
  actions,
  align = 'start',
  className,
  ...props
}: SectionIntroProps) {
  const isDark = tone === 'dark';
  const centered = align === 'center';
  const hasActions = Boolean(actions);

  return (
    <div
      className={cn(
        'w-full',
        hasActions && !centered && 'flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between',
        centered && 'text-center',
        className,
      )}
      {...props}
    >
      <div className={cn('min-w-0 flex-1', centered && 'mx-auto')}>
        {eyebrow ? (
          <p
            className={cn(
              'text-[0.65rem] font-semibold uppercase tracking-[0.28em]',
              isDark ? 'text-gold/85' : 'text-brand-strong',
            )}
          >
            {eyebrow}
          </p>
        ) : null}
        <Heading
          as={as}
          className={cn(eyebrow && 'mt-3', isDark && 'text-ink-inverse', centered && 'mx-auto')}
        >
          {title}
        </Heading>
        {description ? (
          <p
            className={cn(
              'text-lede mt-4',
              isDark ? 'text-ink-inverse/75' : 'text-ink/70',
              centered && 'mx-auto',
            )}
          >
            {description}
          </p>
        ) : null}
      </div>
      {hasActions ? <div className={cn('shrink-0', centered && 'mt-6')}>{actions}</div> : null}
    </div>
  );
}
