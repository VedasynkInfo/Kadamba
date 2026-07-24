import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { financeApi, type PaymentRecord } from '@/services/finance/financeService';
import { Button, Select, Spinner } from '@/components/ui';
import { AdminHorizonBanner } from '../components/AdminHorizonBanner';
import { PageMeta, staticPageMeta } from '@/seo';

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

function formatINR(v: number) {
  return `₹${v.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

function currentYearMonth() {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}

/** Build year options: from 2024 through current year (no future years). */
function yearOptions(currentYear: number) {
  const start = 2024;
  const years: number[] = [];
  for (let y = currentYear; y >= start; y -= 1) years.push(y);
  return years.map((y) => ({ value: String(y), label: String(y) }));
}

/** Months for selected year — future months disabled for current year. */
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
  const today = currentYearMonth();
  const [year, setYear] = useState(today.year);
  const [month, setMonth] = useState(today.month);
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [total, setTotal] = useState(0);

  const months = useMemo(
    () => monthOptions(year, today.year, today.month),
    [year, today.year, today.month],
  );

  // If year changes and selected month becomes future, clamp to current/last allowed
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
      setTotal(data.pagination.total);
    } catch (err) {
      console.error('Failed to load payments', err);
      setPayments([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    void load();
  }, [load]);

  const monthRevenue = useMemo(
    () => payments.reduce((sum, p) => sum + (p.amount || 0), 0),
    [payments],
  );

  const methodBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of payments) {
      map.set(p.method, (map.get(p.method) || 0) + p.amount);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [payments]);

  return (
    <>
      <PageMeta {...staticPageMeta.admin} path="/admin/payments" title="Payments" />
      <AdminHorizonBanner
        title="Payments desk"
        copy="Revenue received from workshop orders — filter by month. Future months are disabled."
        actionLabel="View invoices"
        actionTo="/admin/invoices"
      />

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 md:px-10">
        <div className="flex flex-wrap items-end gap-4">
          <Select
            label="Year"
            value={String(year)}
            onChange={(e) => setYear(Number(e.target.value))}
            options={yearOptions(today.year)}
            className="max-w-[140px]"
          />
          <Select
            label="Month"
            value={String(month)}
            onChange={(e) => setMonth(Number(e.target.value))}
            options={months}
            className="max-w-[200px]"
          />
          <Button type="button" variant="ghost" className="border border-black/15" onClick={load}>
            Refresh
          </Button>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="border border-black/10 bg-white p-5">
            <p className="text-[0.65rem] uppercase tracking-[0.18em] text-black/40">
              {MONTH_NAMES[month - 1]} {year} revenue
            </p>
            <p className="mt-2 font-heading text-3xl text-black">{formatINR(monthRevenue)}</p>
          </div>
          <div className="border border-black/10 bg-white p-5">
            <p className="text-[0.65rem] uppercase tracking-[0.18em] text-black/40">Payments</p>
            <p className="mt-2 font-heading text-3xl text-black">{total}</p>
          </div>
          <div className="border border-black/10 bg-white p-5">
            <p className="text-[0.65rem] uppercase tracking-[0.18em] text-black/40">By method</p>
            <ul className="mt-2 space-y-1 text-sm text-black/70">
              {methodBreakdown.length === 0 ? (
                <li className="text-black/40">No receipts this month</li>
              ) : (
                methodBreakdown.map(([method, amount]) => (
                  <li key={method} className="flex justify-between gap-4">
                    <span className="uppercase tracking-wide">{method}</span>
                    <span>{formatINR(amount)}</span>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>

        <div className="mt-10 overflow-x-auto">
          {loading ? (
            <div className="flex justify-center py-16">
              <Spinner label="Loading payments" />
            </div>
          ) : (
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr className="border-b border-black/15 text-[0.65rem] uppercase tracking-[0.16em] text-black/45">
                  <th className="py-3 pr-4 font-medium">Date</th>
                  <th className="py-3 pr-4 font-medium">Order</th>
                  <th className="py-3 pr-4 font-medium">Customer</th>
                  <th className="py-3 pr-4 font-medium">Amount</th>
                  <th className="py-3 pr-4 font-medium">Method</th>
                  <th className="py-3 pr-4 font-medium">Reference</th>
                  <th className="py-3 font-medium"> </th>
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-14 text-center text-black/40">
                      No payments recorded for {MONTH_NAMES[month - 1]} {year}.
                    </td>
                  </tr>
                ) : (
                  payments.map((p) => {
                    const order =
                      p.order ||
                      (typeof p.orderId === 'object' && p.orderId
                        ? {
                            id: String(p.orderId.id || p.orderId._id || ''),
                            orderNumber: p.orderId.orderNumber,
                            referenceId: p.orderId.referenceId,
                            title: p.orderId.title,
                            customer: p.orderId.customer,
                          }
                        : undefined);
                    const orderId =
                      order?.id || (typeof p.orderId === 'string' ? p.orderId : undefined);

                    return (
                      <tr key={p.id} className="border-b border-black/8 hover:bg-cream/40">
                        <td className="py-4 pr-4 text-black/70">{formatDate(p.paidAt)}</td>
                        <td className="py-4 pr-4">
                          <p className="font-heading">
                            {order?.orderNumber ? `#${order.orderNumber}` : '—'}
                          </p>
                          <p className="text-xs text-black/45">
                            {order?.referenceId || order?.title || '—'}
                          </p>
                        </td>
                        <td className="py-4 pr-4">
                          <p>{order?.customer?.name || '—'}</p>
                          <p className="text-xs text-black/45">{order?.customer?.phone}</p>
                        </td>
                        <td className="py-4 pr-4 font-medium">{formatINR(p.amount)}</td>
                        <td className="py-4 pr-4 uppercase tracking-wide text-black/65">
                          {p.method}
                        </td>
                        <td className="py-4 pr-4 text-xs text-black/50">{p.reference || '—'}</td>
                        <td className="py-4 text-right">
                          {orderId ? (
                            <Link
                              to={`/admin/orders/${orderId}`}
                              className="text-xs uppercase tracking-[0.14em] text-black/55 hover:text-gold"
                            >
                              Order
                            </Link>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </>
  );
}
