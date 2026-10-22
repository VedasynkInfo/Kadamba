import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';
import { Reveal } from './Reveal';

export interface SectionHeadProps {
  /** The small uppercase label. */
  eyebrow?: ReactNode;
  title: ReactNode;
  /** A line of italic gold that completes the title. */
  accent?: ReactNode;
  description?: ReactNode;
  /** Right-hand column: a link, a filter, a count. */
  actions?: ReactNode;
  align?: 'start' | 'center';
  tone?: 'light' | 'dark';
  /** Optional serial number, e.g. "02". */
  index?: string;
  className?: string;
  as?: 'h1' | 'h2' | 'h3';
}

/**
 * A section's title block.
 *
 * The public site has one title block, not five. An eyebrow, a serif display
 * line with an optional italic accent, a readable lede, and an optional action
 * column — that is the whole grammar, and using it everywhere is what makes
 * the pages feel edited rather than assembled.
 */
export function SectionHead({
  eyebrow,
  title,
  accent,
  description,
  actions,
  align = 'start',
  tone = 'light',
  index,
  className,
  as: Tag = 'h2',
}: SectionHeadProps) {
  const dark = tone === 'dark';
  const centered = align === 'center';

  return (
    <Reveal
      className={cn(
        'flex flex-col gap-8',
        !centered && actions && 'lg:flex-row lg:items-end lg:justify-between',
        centered && 'items-center text-center',
        className,
      )}
    >
      <div className={cn('min-w-0', centered ? 'max-w-3xl' : 'max-w-2xl')}>
        {(eyebrow || index) && (
          <p className={cn('eyebrow', centered && 'justify-center')}>
            {index ? <span className="tabular-nums">{index}</span> : null}
            {eyebrow}
          </p>
        )}
        <Tag className={cn('display-lg mt-5', dark ? 'text-ink-inverse' : 'text-ink')}>
          {title}
          {accent ? <> <span className="display-accent">{accent}</span></> : null}
        </Tag>
        {description ? (
          <p
            className={cn(
              'text-lede mt-6',
              dark ? 'text-ink-inverse/70' : 'text-ink/65',
              centered && 'mx-auto',
            )}
          >
            {description}
          </p>
        ) : null}
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </Reveal>
  );
}
