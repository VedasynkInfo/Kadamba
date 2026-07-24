import { cn } from '@/utils/cn';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'danger',
  isLoading = false,
}: ConfirmDialogProps) {
  if (!open) return null;

  const variants = {
    danger: 'bg-cream border-rose-200 text-black',
    warning: 'bg-cream border-amber-200 text-black',
    info: 'bg-cream border-black/15 text-black',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        className={cn('w-full max-w-md rounded-lg border p-6 shadow-lg', variants[variant])}
        role="dialog"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-description"
      >
        <h2 id="confirm-title" className="font-heading text-lg text-black">
          {title}
        </h2>
        <p id="confirm-description" className="mt-2 text-sm text-black/70">
          {description}
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-sm border border-black/15 px-4 py-2 text-sm font-medium transition hover:bg-black/5"
            disabled={isLoading}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => {
              void onConfirm();
            }}
            className={cn(
              'rounded-sm border px-4 py-2 text-sm font-medium transition',
              variant === 'danger'
                ? 'border-rose-700 bg-rose-700 text-white hover:bg-rose-800'
                : 'border-black bg-black text-cream hover:bg-black/90',
            )}
            disabled={isLoading}
          >
            {isLoading ? 'Processing…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
