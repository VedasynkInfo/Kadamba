import { Icon } from '@/components/icons';
import { Button, Input, Modal } from '@/components/ui';

interface OrderFinancialModalProps {
  open: boolean;
  onClose: () => void;
  paymentMode: 'record' | 'quote' | 'adjust';
  paymentAmount: string;
  setPaymentAmount: (v: string) => void;
  paymentDate: string;
  setPaymentDate: (v: string) => void;
  paymentMethod: 'cash' | 'upi' | 'bank' | 'card' | 'other';
  setPaymentMethod: (v: 'cash' | 'upi' | 'bank' | 'card' | 'other') => void;
  paymentReference: string;
  setPaymentReference: (v: string) => void;
  paymentNotes: string;
  setPaymentNotes: (v: string) => void;
  totalQuoted: string;
  setTotalQuoted: (v: string) => void;
  currentBalance: number;
  savingPayment: boolean;
  onSave: () => void;
}

export function OrderFinancialModal({
  open,
  onClose,
  paymentMode,
  paymentAmount,
  setPaymentAmount,
  paymentDate,
  setPaymentDate,
  paymentMethod,
  setPaymentMethod,
  paymentReference,
  setPaymentReference,
  paymentNotes,
  setPaymentNotes,
  totalQuoted,
  setTotalQuoted,
  currentBalance,
  savingPayment,
  onSave,
}: OrderFinancialModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={paymentMode === 'record' ? 'Record Payment' : 'Adjust Quoted Amount'}
    >
      {paymentMode === 'record' ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-ink/55 mb-1.5">Amount (₹) *</label>
              <Input
                id="record-payment-amount"
                type="number"
                min="0.01"
                step="0.01"
                placeholder="e.g. 5000"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs text-ink/55 mb-1.5">Date *</label>
              <Input
                id="record-payment-date"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-ink/55 mb-1.5">Method *</label>
            <select
              id="record-payment-method"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value as any)}
              className="w-full rounded border border-line bg-surface-raised px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
              <option value="bank">Bank Transfer</option>
              <option value="card">Card</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-ink/55 mb-1.5">Reference / UPI ID</label>
            <Input
              id="record-payment-ref"
              placeholder="Transaction ID, UPI reference…"
              value={paymentReference}
              onChange={(e) => setPaymentReference(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-ink/55 mb-1.5">Notes</label>
            <Input
              id="record-payment-notes"
              placeholder="Optional note"
              value={paymentNotes}
              onChange={(e) => setPaymentNotes(e.target.value)}
            />
          </div>
          <div className="rounded bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
            Current balance: <strong>₹{currentBalance}</strong>
            {paymentAmount && Number(paymentAmount) > 0 && (
              <span className="ml-2">
                <Icon name="arrowRight" size={14} className="mr-1 inline align-middle" /> After payment:{' '}
                <strong>₹{Math.max(0, currentBalance - Number(paymentAmount))}</strong>
              </span>
            )}
          </div>
          <div className="flex gap-3 justify-end pt-2 border-t border-line">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button size="sm" disabled={savingPayment} onClick={onSave}>
              {savingPayment ? 'Recording…' : 'Record Payment'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-ink/55 mb-1.5">Total Quoted Amount (₹)</label>
            <Input
              type="number"
              min="0"
              value={totalQuoted}
              onChange={(e) => setTotalQuoted(e.target.value)}
            />
          </div>
          <div className="flex gap-3 justify-end pt-2 border-t border-line">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button size="sm" disabled={savingPayment} onClick={onSave}>
              {savingPayment ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
