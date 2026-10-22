import { Button } from '@/components/ui';
import { cn } from '@/utils/cn';

interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-md border border-dashed border-line px-6 py-16 text-center',
        className,
      )}
    >
      <p className="font-heading text-xl text-ink">{title}</p>
      {description ? <p className="mt-2 max-w-sm text-sm text-ink/70">{description}</p> : null}
      {actionLabel && onAction ? (
        <Button variant="primary" size="sm" className="mt-6" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
