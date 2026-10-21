import { Button, Modal } from '@/components/ui';

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

/**
 * A destructive decision, asked once.
 *
 * This used to be a hand-rolled overlay: no focus trap, no Escape, no initial
 * focus, and two fixed element ids shared by every dialog on the page. It now
 * sits on `Modal`, so Radix owns the keyboard contract — focus moves in, Escape
 * cancels, focus returns to the button that opened it — and the only thing left
 * here is the question and the shape of the answer.
 */
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
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onCancel}
            disabled={isLoading}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            variant={variant === 'danger' ? 'danger' : 'primary'}
            size="sm"
            onClick={() => {
              void onConfirm();
            }}
            disabled={isLoading}
          >
            {isLoading ? 'Processing…' : confirmLabel}
          </Button>
        </>
      }
    >
      <span className="sr-only">Confirmation required.</span>
    </Modal>
  );
}
