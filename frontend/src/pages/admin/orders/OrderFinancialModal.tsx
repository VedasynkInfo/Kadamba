import { Icon } from '@/components/icons';
import { Button, DateField, Input, Modal } from '@/components/ui';
import { Select } from '@/components/ui';

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
              <label className="block text-xs text-ink/70 mb-1.5">Amount (₹) *</label>
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
              <label className="block text-xs text-ink/70 mb-1.5">Date *</label>
              <DateField
                id="record-payment-date"
                value={paymentDate}
                onChange={(value) => setPaymentDate(value)}
                />
            </div>
          </div>
          <div>
            <label className="block text-xs text-ink/70 mb-1.5">Method *</label>
            <Select
              id="record-payment-method"
              value={paymentMethod}
              onChange={(value) => setPaymentMethod(value as any)}
              options={[{ value: 'cash', label: 'Cash' }, { value: 'upi', label: 'UPI' }, { value: 'bank', label: 'Bank Transfer' }, { value: 'card', label: 'Card' }, { value: 'other', label: 'Other' }]}
            />
          </div>
          <div>
            <label className="block text-xs text-ink/70 mb-1.5">Reference / UPI ID</label>
            <Input
              id="record-payment-ref"
              placeholder="Transaction ID, UPI reference…"
              value={paymentReference}
              onChange={(e) => setPaymentReference(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-ink/70 mb-1.5">Notes</label>
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
            <label className="block text-xs text-ink/70 mb-1.5">Total Quoted Amount (₹)</label>
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
