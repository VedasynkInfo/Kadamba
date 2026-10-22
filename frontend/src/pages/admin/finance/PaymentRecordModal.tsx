import { useState, useEffect } from 'react';
import { financeApi } from '@/services/finance/financeService';
import { ordersApi, type Order } from '@/services/orders/orderService';
import { DateField, Select } from '@/components/ui';

interface PaymentRecordModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultOrderId?: string;
}

export function PaymentRecordModal({
  open,
  onClose,
  onSuccess,
  defaultOrderId,
}: PaymentRecordModalProps) {
  const [orderQuery, setOrderQuery] = useState('');
  const [orderResults, setOrderResults] = useState<Order[]>([]);
  const [searchingOrders, setSearchingOrders] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const [amount, setAmount] = useState<string>('');
  const [method, setMethod] = useState<'upi' | 'cash' | 'card' | 'bank' | 'other'>('upi');
  const [paidAt, setPaidAt] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [bypassBalanceCheck, setBypassBalanceCheck] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load default order if provided
  useEffect(() => {
    if (!open) return;
    if (defaultOrderId) {
      ordersApi.get(defaultOrderId).then((ord: Order) => {
        setSelectedOrder(ord);
        if (ord.paymentSummary?.balance && ord.paymentSummary.balance > 0) {
          setAmount(String(ord.paymentSummary.balance));
        }
      }).catch(() => {});
    }
  }, [open, defaultOrderId]);

  // Order search debounce
  useEffect(() => {
    if (!open || orderQuery.trim().length < 2) {
      setOrderResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchingOrders(true);
      try {
        const res = await ordersApi.list({ search: orderQuery.trim(), limit: 6 });
        setOrderResults(res.items);
      } catch {
        setOrderResults([]);
      } finally {
        setSearchingOrders(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [orderQuery, open]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (open) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedOrder) {
      setError('Please search and select an order first.');
      return;
    }
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      setError('Please enter a valid payment amount greater than zero.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await financeApi.recordPayment({
        orderId: selectedOrder.id,
        amount: numAmount,
        method,
        paidAt: new Date(paidAt).toISOString(),
        reference: reference.trim() || undefined,
        notes: notes.trim() || undefined,
        bypassBalanceCheck,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to record payment';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Record payment"
    >
      <div
        className="w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden transition-all text-xs bg-surface-raised border-line text-ink-raised"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between border-b px-5 py-4 border-line"
        >
          <div className="flex items-center gap-2.5">
            <span className="text-xl">??</span>
            <div>
              <h3 className="font-heading text-base font-bold tracking-wide">Record Payment</h3>
              <p className="text-[10px] opacity-70 mt-0.5">Post an advance or settlement to an active workshop order</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border text-sm opacity-70 hover:opacity-100 transition cursor-pointer border-line"
            aria-label="Close modal"
          >
            ?
          </button>
        </div>

        {error ? (
          <div className="mx-5 mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-red-400">
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[78vh] overflow-y-auto">
          {/* Order Selection */}
          <div className="space-y-1.5">
            <label className="block text-[11px] font-semibold opacity-75 uppercase tracking-wider">
              Target Order *
            </label>
            {selectedOrder ? (
              <div
                className="flex items-center justify-between rounded-xl border p-3 border-brand bg-brand/[0.08]"
              >
                <div>
                  <span className="font-bold text-xs">
                    Order #{selectedOrder.orderNumber} — {selectedOrder.customerId?.name || 'Client'}
                  </span>
                  <div className="text-[10px] opacity-65 flex items-center gap-2 mt-0.5">
                    <span>Quoted: ₹{selectedOrder.paymentSummary?.totalQuoted || 0}</span>
                    <span>•</span>
                    <span className="text-emerald-400 font-semibold">
                      Paid: ₹{selectedOrder.paymentSummary?.totalPaid || 0}
                    </span>
                    <span>•</span>
                    <span className="text-amber-400 font-semibold">
                      Balance: ₹{selectedOrder.paymentSummary?.balance || 0}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedOrder(null);
                    setAmount('');
                  }}
                  className="rounded px-2 py-1 text-[10px] font-bold border border-red-500/30 text-red-400 hover:bg-red-500/10 cursor-pointer"
                >
                  Change
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  value={orderQuery}
                  onChange={(e) => setOrderQuery(e.target.value)}
                  placeholder="Search by order #, client name, or phone..."
                  className="w-full rounded-xl border py-2.5 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-focus bg-surface-sunken border-line"
                />
                {searchingOrders ? (
                  <span className="absolute right-3 top-2.5 text-[10px] opacity-70 animate-pulse">
                    Searching...
                  </span>
                ) : null}

                {orderResults.length > 0 ? (
                  <div
                    className="absolute z-20 top-full mt-1 w-full rounded-xl border shadow-xl max-h-48 overflow-y-auto bg-surface-raised border-line"
                  >
                    {orderResults.map((ord) => (
                      <button
                        key={ord.id}
                        type="button"
                        onClick={() => {
                          setSelectedOrder(ord);
                          setOrderQuery('');
                          setOrderResults([]);
                          if (ord.paymentSummary?.balance && ord.paymentSummary.balance > 0) {
                            setAmount(String(ord.paymentSummary.balance));
                          }
                        }}
                        className="w-full text-left p-2.5 hover:bg-current/[0.06] border-b last:border-b-0 cursor-pointer transition border-line"
                      >
                        <div className="font-bold text-xs">
                          #{ord.orderNumber} — {ord.customerId?.name || 'Client'} ({ord.customerId?.phone || ''})
                        </div>
                        <div className="text-[10px] opacity-70 flex gap-2 mt-0.5">
                          <span>Balance: ?{ord.paymentSummary?.balance ?? 0}</span>
                          <span>Status: {ord.status}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* Amount & Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold opacity-75 uppercase tracking-wider">
                Amount (?) *
              </label>
              <input
                type="number"
                min="1"
                step="1"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 5000"
                className="w-full rounded-xl border py-2 px-3 text-xs font-bold text-emerald-400 focus:outline-none focus:ring-1 focus:ring-focus bg-surface-sunken border-line"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-semibold opacity-75 uppercase tracking-wider">
                Method *
              </label>
              <Select
                value={method}
                onChange={(value) => setMethod(value as any)}
                options={[{ value: 'upi', label: 'UPI / QR Code' }, { value: 'cash', label: 'Cash Counter' }, { value: 'card', label: 'Credit/Debit Card' }, { value: 'bank', label: 'Bank Transfer (IMPS/NEFT)' }, { value: 'other', label: 'Other Method' }]}
              />
            </div>
          </div>

          {/* Date & Reference */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold opacity-75 uppercase tracking-wider">
                Payment Date *
              </label>
              <DateField
                required
                value={paidAt}
                onChange={(value) => setPaidAt(value)}
                />
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-semibold opacity-75 uppercase tracking-wider">
                Ref / Txn ID
              </label>
              <input
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="e.g. UPI-9982371 or Chq #12"
                className="w-full rounded-xl border py-2 px-3 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-focus bg-surface-sunken border-line"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold opacity-75 uppercase tracking-wider">
              Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. 50% advance for wedding lehenga"
              className="w-full rounded-xl border py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-focus bg-surface-sunken border-line"
            />
          </div>

          {/* Balance Overpayment Option */}
          <label className="flex items-center gap-2 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={bypassBalanceCheck}
              onChange={(e) => setBypassBalanceCheck(e.target.checked)}
              className="rounded text-brand-strong focus:ring-0"
            />
            <span className="text-[11px] opacity-70">
              Allow payment exceeding current outstanding balance
            </span>
          </label>

          {/* Form Actions */}
          <div
            className="flex items-center justify-end gap-3 pt-3 border-t border-line"
          >
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl px-4 py-2 text-xs font-semibold border hover:bg-current/[0.05] transition cursor-pointer border-line"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !selectedOrder}
              className="rounded-xl px-5 py-2 text-xs font-bold shadow-xs transition hover:opacity-95 disabled:opacity-70 cursor-pointer bg-brand text-ink-on-brand"
            >
              {submitting ? 'Recording...' : 'Record Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
