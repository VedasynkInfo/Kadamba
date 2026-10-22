import { useState, useEffect } from 'react';
import { Icon } from '@/components/icons';
import { financeApi, type ExpenseRecord } from '@/services/finance/financeService';
import { DateField, Select } from '@/components/ui';

interface ExpenseModalFormProps {
  open: boolean;
  expense: ExpenseRecord | null;
  onClose: () => void;
  onSuccess: () => void;
}

const CATEGORIES = [
  { value: 'fabric', label: 'Fabric Procurement' },
  { value: 'embroidery materials', label: 'Maggam & Embroidery Materials' },
  { value: 'rent', label: 'Boutique & Studio Rent' },
  { value: 'utilities', label: 'Electricity & Utilities' },
  { value: 'marketing', label: 'Marketing & Ad Campaigns' },
  { value: 'misc', label: 'General / Miscellaneous' },
];

export function ExpenseModalForm({ open, expense, onClose, onSuccess }: ExpenseModalFormProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string>('misc');
  const [amount, setAmount] = useState('');
  const [spentAt, setSpentAt] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setError(null);
      if (expense) {
        setTitle(expense.title);
        setCategory(expense.category);
        setAmount(String(expense.amount));
        setSpentAt(expense.spentAt.slice(0, 10));
        setNotes(expense.notes || '');
      } else {
        setTitle('');
        setCategory('fabric');
        setAmount('');
        setSpentAt(new Date().toISOString().slice(0, 10));
        setNotes('');
      }
    }
  }, [open, expense]);

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
    if (!title.trim() || !amount || !spentAt) {
      setError('Title, amount, and date are required fields.');
      return;
    }
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid expense amount greater than zero.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        title: title.trim(),
        category,
        amount: numAmount,
        spentAt: new Date(spentAt).toISOString(),
        notes: notes.trim() || undefined,
      };

      if (expense) {
        await financeApi.updateExpense(expense.id, payload as any);
      } else {
        await financeApi.recordExpense(payload as any);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to record expense';
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
      aria-label="Expense modal"
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
            <span className="text-xl"><Icon name="expense" size={14} className="mr-1 inline align-middle" /> </span>
            <div>
              <h3 className="font-heading text-base font-bold tracking-wide">
                {expense ? 'Edit Expense Record' : 'Record New Studio Expense'}
              </h3>
              <p className="text-[10px] opacity-60 mt-0.5">
                Log procurement, raw materials, studio rent, and overheads
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border text-sm opacity-60 hover:opacity-100 transition cursor-pointer border-line"
            aria-label="Close modal"
          >
            <Icon name="close" size={16} />
          </button>
        </div>

        {error ? (
          <div className="mx-5 mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-red-400">
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Title */}
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold opacity-75 uppercase tracking-wider">
              Expense Item Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Raw Silk Fabric Roll (20m), Zardozi Threads"
              className="w-full rounded-xl border py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-focus bg-surface-sunken border-line"
            />
          </div>

          {/* Category & Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold opacity-75 uppercase tracking-wider">
                Category *
              </label>
              <Select
                value={category}
                onChange={(value) => setCategory(value)}
                options={CATEGORIES.map((cat) => ({ value: cat.value, label: cat.label }))}
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-semibold opacity-75 uppercase tracking-wider">
                Amount (₹) *
              </label>
              <input
                type="number"
                required
                min="1"
                step="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 4500"
                className="w-full rounded-xl border py-2 px-3 text-xs font-bold text-rose-400 focus:outline-none focus:ring-1 focus:ring-focus bg-surface-sunken border-line"
              />
            </div>
          </div>

          {/* Date */}
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold opacity-75 uppercase tracking-wider">
              Date Incurred *
            </label>
            <DateField
              required
              value={spentAt}
              onChange={(value) => setSpentAt(value)}
              />
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold opacity-75 uppercase tracking-wider">
              Notes / Vendor Details
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Vendor invoice #, merchant name, receipt details..."
              className="w-full rounded-xl border py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-focus bg-surface-sunken border-line"
            />
          </div>

          {/* Footer */}
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
              disabled={submitting}
              className="rounded-xl px-5 py-2 text-xs font-bold shadow-xs transition hover:opacity-95 disabled:opacity-50 cursor-pointer bg-brand text-ink-on-brand"
            >
              {submitting ? 'Saving...' : expense ? 'Update Expense' : 'Record Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
