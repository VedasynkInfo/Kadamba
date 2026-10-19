import type { ReactNode } from 'react';
import { Button } from '@/components/ui';
import { cn } from '@/utils/cn';
import type { AppError } from '@/lib/apiError';

/**
 * Surfaces come in two flavours — the public site is light, the admin console
 * and the dark sections of the public site are not — so every state takes a
 * `tone`. Phase 6 replaces the raw neutrals with semantic surface tokens.
 */
export type ContentTone = 'light' | 'dark';

const toneStyles: Record<ContentTone, { shell: string; title: string; body: string; skeleton: string }> = {
  light: {
    shell: 'border-zinc-300/70',
    title: 'text-zinc-800',
    body: 'text-zinc-600',
    skeleton: 'bg-zinc-500/10',
  },
  dark: {
    shell: 'border-cream/25',
    title: 'text-cream',
    body: 'text-cream/70',
    skeleton: 'bg-cream/10',
  },
};

interface ContentShellProps {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  tone: ContentTone;
  className?: string;
}

function ContentShell({ title, description, action, tone, className }: ContentShellProps) {
  const styles = toneStyles[tone];

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-6 py-12 text-center',
        styles.shell,
        className,
      )}
      role="status"
    >
      <p className={cn('text-sm font-semibold tracking-tight', styles.title)}>{title}</p>
      {description ? (
        <div className={cn('max-w-md text-sm leading-relaxed', styles.body)}>{description}</div>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export interface ContentEmptyProps {
  title?: string;
  description?: ReactNode;
  action?: ReactNode;
  tone?: ContentTone;
  className?: string;
}

/** Loaded successfully, and there is genuinely nothing to show. */
export function ContentEmpty({
  title = 'Nothing here yet',
  description = 'Content will appear here as soon as it is published.',
  action,
  tone = 'light',
  className,
}: ContentEmptyProps) {
  return (
    <ContentShell
      title={title}
      description={description}
      action={action}
      tone={tone}
      className={className}
    />
  );
}

export interface ContentErrorProps {
  error: AppError | null;
  /** Offer a retry where the surface owns a refetch. */
  onRetry?: () => void;
  title?: string;
  tone?: ContentTone;
  className?: string;
}

/**
 * The request failed. The message comes from the server when it supplied one,
 * otherwise from the client's per-code defaults, so this never renders a stack
 * trace or a blank box.
 */
export function ContentError({
  error,
  onRetry,
  title = 'We could not load this',
  tone = 'light',
  className,
}: ContentErrorProps) {
  const detail = error?.message ?? 'Something went wrong while loading this content.';
  const reference = error?.requestId ? `Reference: ${error.requestId}` : undefined;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-2 rounded-lg border border-red-500/40 bg-red-500/5 px-6 py-12 text-center',
        className,
      )}
      role="alert"
    >
      <p className="text-sm font-semibold tracking-tight text-red-500">{title}</p>
      <p className={cn('max-w-md text-sm leading-relaxed', toneStyles[tone].body)}>{detail}</p>
      {reference ? (
        <p className={cn('font-mono text-xs', toneStyles[tone].body)}>{reference}</p>
      ) : null}
      {onRetry ? (
        <Button variant="ghost" size="sm" className="mt-2" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}

export interface ContentLoadingProps {
  /** Number of placeholder blocks to draw. */
  count?: number;
  /** `grid` for card decks, `list` for rows, `block` for a single region. */
  variant?: 'grid' | 'list' | 'block';
  /** Column count for the `grid` variant, matched to the real layout. */
  columns?: 2 | 3 | 4;
  label?: string;
  tone?: ContentTone;
  className?: string;
}

const gridColumns: Record<2 | 3 | 4, string> = {
  2: 'md:grid-cols-2',
  3: 'md:grid-cols-2 lg:grid-cols-3',
  4: 'md:grid-cols-2 lg:grid-cols-4',
};

/**
 * Skeleton placeholders, sized to the layout that is about to replace them so
 * the page does not jump when data lands (CLS 0).
 */
export function ContentLoading({
  count = 3,
  variant = 'grid',
  columns = 3,
  label = 'Loading',
  tone = 'light',
  className,
}: ContentLoadingProps) {
  const blocks = Array.from({ length: count }, (_, index) => index);
  const skeleton = toneStyles[tone].skeleton;

  return (
    <div className={className} role="status" aria-live="polite" aria-busy>
      <span className="sr-only">{label}</span>
      {variant === 'block' ? (
        <div className={cn('h-48 animate-pulse rounded-lg', skeleton)} />
      ) : (
        <div className={cn(variant === 'grid' ? cn('grid gap-6', gridColumns[columns]) : 'space-y-3')}>
          {blocks.map((index) => (
            <div
              key={index}
              className={cn(
                'animate-pulse rounded-lg',
                skeleton,
                variant === 'grid' ? 'h-64' : 'h-12',
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
