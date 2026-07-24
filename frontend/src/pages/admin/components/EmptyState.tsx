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
        'flex flex-col items-center justify-center rounded-md border border-dashed border-black/15 px-6 py-16 text-center',
        className,
      )}
    >
      <p className="font-heading text-xl text-black">{title}</p>
      {description ? <p className="mt-2 max-w-sm text-sm text-black/55">{description}</p> : null}
      {actionLabel && onAction ? (
        <Button variant="primary" size="sm" className="mt-6" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
