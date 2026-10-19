import { Button, Input, Modal } from '@/components/ui';
import type { OrderStatus } from '@/shared/enums';
import { orderStatusLabel } from './types';

interface OrderStatusModalProps {
  open: boolean;
  onClose: () => void;
  /** The stage being moved to; null when no transition is pending. */
  nextStatus: OrderStatus | null;
  transitionNote: string;
  setTransitionNote: (v: string) => void;
  transitioning: boolean;
  onTransition: (status: OrderStatus, note: string) => void;
}

export function OrderStatusModal({
  open,
  onClose,
  nextStatus,
  transitionNote,
  setTransitionNote,
  transitioning,
  onTransition,
}: OrderStatusModalProps) {
  return (
    <Modal open={open} onClose={onClose} title="Reason for lifecycle transition">
      <div className="space-y-4">
        <p className="text-xs text-ink/65">
          You are moving this order status to{' '}
          <span className="font-semibold uppercase">
            {nextStatus ? orderStatusLabel(nextStatus) : ''}
          </span>
          . Please record a brief reason or notes below for audit records.
        </p>
        <Input
          type="text"
          placeholder="e.g. fabric delayed, fitting rescheduled, client requested cancel"
          required
          value={transitionNote}
          onChange={(e) => setTransitionNote(e.target.value)}
        />
        <div className="flex gap-3 justify-end pt-2 border-t border-line">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Abort
          </Button>
          <Button
            size="sm"
            disabled={transitioning || !nextStatus || !transitionNote.trim()}
            onClick={() => {
              if (nextStatus) onTransition(nextStatus, transitionNote.trim());
            }}
          >
            {transitioning ? 'Saving...' : 'Transition'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
