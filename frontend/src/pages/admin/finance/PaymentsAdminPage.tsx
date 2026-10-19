import { useCallback, useEffect, useMemo, useState } from 'react';
import { financeApi, type PaymentRecord } from '@/services/finance/financeService';
import { PageMeta, staticPageMeta } from '@/seo';
import { PaymentsMetrics } from './PaymentsMetrics';
import { PaymentsToolbar } from './PaymentsToolbar';
import { PaymentsTable } from './PaymentsTable';
import { PaymentPreviewModal } from './PaymentPreviewModal';
import { PaymentRecordModal } from './PaymentRecordModal';

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

function currentYearMonth() {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

function yearOptions(currentYear: number) {
  const start = 2024;
  const years: { value: string; label: string }[] = [];
  for (let y = currentYear; y >= start; y -= 1) {
    years.push({ value: String(y), label: String(y) });
  }
  return years;
}

function monthOptions(year: number, currentYear: number, currentMonth: number) {
  return MONTH_NAMES.map((name, idx) => {
    const month = idx + 1;
    const isFuture = year > currentYear || (year === currentYear && month > currentMonth);
    return {
      value: String(month),
      label: isFuture ? `${name} (future)` : name,
      disabled: isFuture,
    };
  });
}

export default function PaymentsAdminPage() {
  const today = useMemo(() => currentYearMonth(), []);
  const [year, setYear] = useState(today.year);
  const [month, setMonth] = useState(today.month);
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);

  // Filtering
  const [query, setQuery] = useState('');
  const [selectedMethod, setSelectedMethod] = useState('All');

  // Modals
  const [previewPayment, setPreviewPayment] = useState<PaymentRecord | null>(null);
  const [recordModalOpen, setRecordModalOpen] = useState(false);

  const months = useMemo(
    () => monthOptions(year, today.year, today.month),
    [year, today.year, today.month],
  );

  const years = useMemo(() => yearOptions(today.year), [today.year]);

  // Clamp future months
  useEffect(() => {
    const opt = months.find((m) => Number(m.value) === month);
    if (opt?.disabled) {
      const allowed = [...months].reverse().find((m) => !m.disabled);
      if (allowed) setMonth(Number(allowed.value));
    }
  }, [months, month]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await financeApi.listPayments({
        year,
        month,
        limit: 100,
        page: 1,
      });
      setPayments(data.items);
    } catch (err) {
      console.error('Failed to load payments', err);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    void load();
  }, [load]);

  // Filtered Payments
  const filtered = useMemo(() => {
    let result = [...payments];

    if (selectedMethod !== 'All') {
      result = result.filter(
        (p) => p.method.toLowerCase() === selectedMethod.toLowerCase(),
      );
    }

    if (query.trim()) {
      const q = query.toLowerCase().trim();
      result = result.filter((p) => {
        const ref = (p.reference || '').toLowerCase();
        const notes = (p.notes || '').toLowerCase();
        const client = (p.order?.customer?.name || '').toLowerCase();
        const phone = (p.order?.customer?.phone || '').toLowerCase();
        const orderNum = p.order?.orderNumber ? String(p.order.orderNumber) : '';
        return (
          ref.includes(q) ||
          notes.includes(q) ||
          client.includes(q) ||
          phone.includes(q) ||
          orderNum.includes(q)
        );
      });
    }

    return result;
  }, [payments, selectedMethod, query]);

  // Metrics
  const totalRevenue = useMemo(
    () => payments.reduce((sum, p) => sum + (p.amount || 0), 0),
    [payments],
  );

  const upiTotal = useMemo(
    () =>
      payments
        .filter((p) => p.method === 'upi')
        .reduce((sum, p) => sum + (p.amount || 0), 0),
    [payments],
  );

  const cashTotal = useMemo(
    () =>
      payments
        .filter((p) => p.method === 'cash')
        .reduce((sum, p) => sum + (p.amount || 0), 0),
    [payments],
  );

  return (
    <>
      <PageMeta {...staticPageMeta.admin} path="/admin/payments" title="Payments Desk" />

      <div className="space-y-6">
        {/* Compact Modern Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1
              className="font-heading text-xl font-bold tracking-tight sm:text-2xl"
              style={{ color: 'var(--admin-text, #f3f4f6)' }}
            >
              Payments Desk
            </h1>
            <p className="text-xs opacity-60">
              Revenue receipts & advances received — {MONTH_NAMES[month - 1]} {year}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void load()}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition hover:bg-current/[0.05] active:scale-98 cursor-pointer"
              style={{ borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.25))' }}
            >
              <span className={loading ? 'animate-spin' : ''}>??</span>
              <span>Sync Receipts</span>
            </button>
          </div>
        </div>

        {/* Pulse Metric Cards */}
        <PaymentsMetrics
          totalAmount={totalRevenue}
          count={payments.length}
          upiTotal={upiTotal}
          cashTotal={cashTotal}
        />

        {/* Unified Search & Filters Toolbar */}
        <PaymentsToolbar
          query={query}
          onQueryChange={setQuery}
          year={year}
          onYearChange={setYear}
          month={month}
          onMonthChange={setMonth}
          yearOptions={years}
          monthOptions={months}
          selectedMethod={selectedMethod}
          onMethodChange={setSelectedMethod}
          filteredCount={filtered.length}
          totalCount={payments.length}
          onRecordPayment={() => setRecordModalOpen(true)}
        />

        {/* Locked Fixed Grid Table */}
        <PaymentsTable
          items={filtered}
          loading={loading}
          onPreview={(pay) => setPreviewPayment(pay)}
          onNewPayment={() => setRecordModalOpen(true)}
        />
      </div>

      {/* Snapshot Preview Modal */}
      <PaymentPreviewModal
        payment={previewPayment}
        onClose={() => setPreviewPayment(null)}
      />

      {/* Record Payment Dialog Modal */}
      <PaymentRecordModal
        open={recordModalOpen}
        onClose={() => setRecordModalOpen(false)}
        onSuccess={() => void load()}
      />
    </>
  );
}
