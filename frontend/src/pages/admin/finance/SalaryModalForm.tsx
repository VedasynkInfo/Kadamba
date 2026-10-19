import { useState, useEffect } from 'react';
import { financeApi } from '@/services/finance/financeService';
import type { Staff } from '@/services/staff/staffService';

interface SalaryModalFormProps {
  open: boolean;
  staffList: Staff[];
  onClose: () => void;
  onSuccess: () => void;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function SalaryModalForm({ open, staffList, onClose, onSuccess }: SalaryModalFormProps) {
  const [staffId, setStaffId] = useState('');
  const [year, setYear] = useState(() => new Date().getFullYear().toString());
  const [month, setMonth] = useState(() => (new Date().getMonth() + 1).toString());
  const [amount, setAmount] = useState('');
  const [paidAt, setPaidAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setError(null);
      setStaffId(staffList[0]?.id || '');
      if (staffList[0]?.salaryAmount) {
        setAmount(String(staffList[0].salaryAmount));
      } else {
        setAmount('');
      }
      setYear(new Date().getFullYear().toString());
      setMonth((new Date().getMonth() + 1).toString());
      setPaidAt(new Date().toISOString().slice(0, 10));
      setNotes('');
    }
  }, [open, staffList]);

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

  function handleStaffChange(id: string) {
    setStaffId(id);
    const selected = staffList.find((s) => s.id === id);
    if (selected?.salaryAmount) {
      setAmount(String(selected.salaryAmount));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!staffId || !amount || !paidAt) {
      setError('Staff artisan, disbursement amount, and payment date are required.');
      return;
    }
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid salary disbursement amount greater than zero.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      await financeApi.recordSalary({
        staffId,
        year: Number(year),
        month: Number(month),
        amount: numAmount,
        paidAt: new Date(paidAt).toISOString(),
        notes: notes.trim() || undefined,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to record salary';
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
      aria-label="Disburse salary modal"
    >
      <div
        className="w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden transition-all text-xs"
        style={{
          backgroundColor: 'var(--admin-card, #141b26)',
          borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.22))',
          color: 'var(--admin-card-text, var(--admin-text, #f3f4f6))',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between border-b px-5 py-4"
          style={{ borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.18))' }}
        >
          <div className="flex items-center gap-2.5">
            <span className="text-xl">💰</span>
            <div>
              <h3 className="font-heading text-base font-bold tracking-wide">
                Disburse Artisan Salary
              </h3>
              <p className="text-[10px] opacity-60 mt-0.5">
                Record monthly remuneration or piece-rate payout for workshop staff
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border text-sm opacity-60 hover:opacity-100 transition cursor-pointer"
            style={{ borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.2))' }}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {error ? (
          <div className="mx-5 mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-red-400">
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Staff Member */}
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold opacity-75 uppercase tracking-wider">
              Staff Member / Artisan *
            </label>
            <select
              value={staffId}
              onChange={(e) => handleStaffChange(e.target.value)}
              className="w-full rounded-xl border py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--admin-primary,#b59410)] cursor-pointer"
              style={{
                backgroundColor: 'var(--admin-card, #141b26)',
                borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.25))',
                color: 'inherit',
              }}
            >
              {staffList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName} ({s.locality}) — {s.employmentType}
                </option>
              ))}
            </select>
          </div>

          {/* Period: Year & Month */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold opacity-75 uppercase tracking-wider">
                Pay Period Month *
              </label>
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="w-full rounded-xl border py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--admin-primary,#b59410)] cursor-pointer"
                style={{
                  backgroundColor: 'var(--admin-card, #141b26)',
                  borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.25))',
                  color: 'inherit',
                }}
              >
                {MONTH_NAMES.map((name, idx) => (
                  <option key={idx + 1} value={String(idx + 1)}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-semibold opacity-75 uppercase tracking-wider">
                Pay Period Year *
              </label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full rounded-xl border py-2 px-3 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[var(--admin-primary,#b59410)]"
                style={{
                  backgroundColor: 'rgba(128, 128, 128, 0.05)',
                  borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.25))',
                  color: 'inherit',
                }}
              />
            </div>
          </div>

          {/* Amount & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold opacity-75 uppercase tracking-wider">
                Payout Amount (₹) *
              </label>
              <input
                type="number"
                required
                min="1"
                step="100"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 25000"
                className="w-full rounded-xl border py-2 px-3 text-xs font-bold text-amber-400 focus:outline-none focus:ring-1 focus:ring-[var(--admin-primary,#b59410)]"
                style={{
                  backgroundColor: 'rgba(128, 128, 128, 0.05)',
                  borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.25))',
                }}
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-semibold opacity-75 uppercase tracking-wider">
                Payment Date *
              </label>
              <input
                type="date"
                required
                value={paidAt}
                onChange={(e) => setPaidAt(e.target.value)}
                className="w-full rounded-xl border py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--admin-primary,#b59410)]"
                style={{
                  backgroundColor: 'rgba(128, 128, 128, 0.05)',
                  borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.25))',
                  color: 'inherit',
                }}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold opacity-75 uppercase tracking-wider">
              Disbursement Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Bank transfer reference, IMPS txn ID, or cash payout notes..."
              className="w-full rounded-xl border py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--admin-primary,#b59410)]"
              style={{
                backgroundColor: 'rgba(128, 128, 128, 0.05)',
                borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.25))',
                color: 'inherit',
              }}
            />
          </div>

          {/* Footer */}
          <div
            className="flex items-center justify-end gap-3 pt-3 border-t"
            style={{ borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.15))' }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl px-4 py-2 text-xs font-semibold border hover:bg-current/[0.05] transition cursor-pointer"
              style={{ borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.25))' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !staffId}
              className="rounded-xl px-5 py-2 text-xs font-bold shadow-xs transition hover:opacity-95 disabled:opacity-50 cursor-pointer"
              style={{
                backgroundColor: 'var(--admin-primary, #b59410)',
                color: 'var(--admin-primary-text, #ffffff)',
              }}
            >
              {submitting ? 'Disbursing...' : 'Disburse Salary'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
