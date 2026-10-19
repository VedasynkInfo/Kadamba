import { Button, Input, Modal } from '@/components/ui';

interface OrderStatusModalProps {
  open: boolean;
  onClose: () => void;
  nextStatus: string;
  transitionNote: string;
  setTransitionNote: (v: string) => void;
  transitioning: boolean;
  onTransition: (status: string, note: string) => void;
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
        <p className="text-xs text-black/65">
          You are moving this order status to{' '}
          <span className="font-semibold uppercase">{nextStatus.replace('_', ' ')}</span>.
          Please record a brief reason or notes below for audit records.
        </p>
        <Input
          type="text"
          placeholder="e.g. fabric delayed, fitting rescheduled, client requested cancel"
          required
          value={transitionNote}
          onChange={(e) => setTransitionNote(e.target.value)}
        />
        <div className="flex gap-3 justify-end pt-2 border-t border-black/5">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Abort
          </Button>
          <Button
            size="sm"
            disabled={transitioning || !transitionNote.trim()}
            onClick={() => onTransition(nextStatus, transitionNote.trim())}
          >
            {transitioning ? 'Saving...' : 'Transition'}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
