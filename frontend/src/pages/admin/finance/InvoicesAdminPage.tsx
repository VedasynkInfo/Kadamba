import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  financeApi,
  type InvoiceRecord,
  type InvoiceListResult,
} from '@/services/finance/financeService';
import { Button, Input, Select, Spinner } from '@/components/ui';
import { AdminHorizonBanner } from '../components/AdminHorizonBanner';
import { cn } from '@/utils/cn';
import { PageMeta, staticPageMeta } from '@/seo';

function formatINR(v: number) {
  return `₹${v.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

const BILL_STATUS_OPTIONS = [
  { value: 'All', label: 'All bills' },
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'partial', label: 'Partial' },
  { value: 'paid', label: 'Paid in full' },
  { value: 'unquoted', label: 'No quote yet' },
];

function billTone(status: InvoiceRecord['billStatus']) {
  switch (status) {
    case 'paid':
      return 'border-emerald-300 bg-emerald-50 text-emerald-800';
    case 'partial':
      return 'border-amber-300 bg-amber-50 text-amber-900';
    case 'unpaid':
      return 'border-rose-300 bg-rose-50 text-rose-800';
    default:
      return 'border-stone-200 bg-stone-50 text-stone-600';
  }
}

export default function InvoicesAdminPage() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<InvoiceRecord[]>([]);
  const [summary, setSummary] = useState<InvoiceListResult['summary'] | null>(null);
  const [paymentStatus, setPaymentStatus] = useState('All');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await financeApi.listInvoices({
        paymentStatus,
        page,
        limit: 25,
      });
      setItems(data.items);
      setSummary(data.summary);
      setTotal(data.pagination.total);
    } catch (err) {
      console.error('Failed to load invoices', err);
    } finally {
      setLoading(false);
    }
  }, [paymentStatus, page]);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = q.trim()
    ? items.filter((inv) => {
        const needle = q.trim().toLowerCase();
        return (
          inv.title.toLowerCase().includes(needle) ||
          inv.customer.name.toLowerCase().includes(needle) ||
          inv.customer.phone.includes(needle) ||
          String(inv.orderNumber).includes(needle) ||
          (inv.invoiceNumber || '').toLowerCase().includes(needle) ||
          (inv.referenceId || '').toLowerCase().includes(needle)
        );
      })
    : items;

  return (
    <>
      <PageMeta {...staticPageMeta.admin} path="/admin/invoices" title="Invoices" />
      <AdminHorizonBanner
        title="Invoices desk"
        copy="Every workshop order with quoted amount, advances, and balance — partial or full."
        actionLabel="Record payment"
        actionTo="/admin/payments"
      />

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 md:px-10">
        {summary ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="border border-black/10 bg-white p-4">
              <p className="text-[0.65rem] uppercase tracking-[0.18em] text-black/40">Quoted</p>
              <p className="mt-2 font-heading text-2xl">{formatINR(summary.totalQuoted)}</p>
            </div>
            <div className="border border-black/10 bg-white p-4">
              <p className="text-[0.65rem] uppercase tracking-[0.18em] text-black/40">Received</p>
              <p className="mt-2 font-heading text-2xl">{formatINR(summary.totalPaid)}</p>
            </div>
            <div className="border border-black/10 bg-white p-4">
              <p className="text-[0.65rem] uppercase tracking-[0.18em] text-black/40">Balance due</p>
              <p className="mt-2 font-heading text-2xl">{formatINR(summary.totalBalance)}</p>
            </div>
            <div className="border border-black/10 bg-white p-4">
              <p className="text-[0.65rem] uppercase tracking-[0.18em] text-black/40">Bills</p>
              <p className="mt-2 text-sm text-black/70">
                {summary.paid} paid · {summary.partial} partial · {summary.unpaid} unpaid
              </p>
            </div>
          </div>
        ) : null}

        <div className="mt-8 flex flex-wrap items-end gap-4">
          <Input
            label="Search invoices"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Customer, order #, reference…"
            className="max-w-xs"
          />
          <Select
            label="Bill status"
            value={paymentStatus}
            onChange={(e) => {
              setPage(1);
              setPaymentStatus(e.target.value);
            }}
            options={BILL_STATUS_OPTIONS}
            className="max-w-[200px]"
          />
          <Button type="button" variant="ghost" className="border border-black/15" onClick={load}>
            Refresh
          </Button>
        </div>

        <div className="mt-8 overflow-x-auto">
          {loading ? (
            <div className="flex justify-center py-16">
              <Spinner label="Loading invoices" />
            </div>
          ) : (
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead>
                <tr className="border-b border-black/15 text-[0.65rem] uppercase tracking-[0.16em] text-black/45">
                  <th className="py-3 pr-4 font-medium">Invoice</th>
                  <th className="py-3 pr-4 font-medium">Customer</th>
                  <th className="py-3 pr-4 font-medium">Quoted</th>
                  <th className="py-3 pr-4 font-medium">Paid</th>
                  <th className="py-3 pr-4 font-medium">Balance</th>
                  <th className="py-3 pr-4 font-medium">Bill</th>
                  <th className="py-3 font-medium"> </th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-14 text-center text-black/40">
                      No invoices match these filters.
                    </td>
                  </tr>
                ) : (
                  filtered.map((inv) => (
                    <tr key={inv.id} className="border-b border-black/8 hover:bg-cream/40">
                      <td className="py-4 pr-4">
                        <p className="font-heading text-base">
                          {inv.invoiceNumber || `INV · #${inv.orderNumber}`}
                        </p>
                        <p className="mt-0.5 text-xs text-black/50">
                          Order #{inv.orderNumber}
                          {inv.referenceId ? ` · ${inv.referenceId}` : ' · Enquiry'}
                        </p>
                        <p className="mt-1 text-xs text-black/45">{inv.title}</p>
                      </td>
                      <td className="py-4 pr-4">
                        <p className="text-black/85">{inv.customer.name}</p>
                        <p className="text-xs text-black/45">{inv.customer.phone}</p>
                      </td>
                      <td className="py-4 pr-4">{formatINR(inv.paymentSummary.totalQuoted)}</td>
                      <td className="py-4 pr-4">{formatINR(inv.paymentSummary.totalPaid)}</td>
                      <td className="py-4 pr-4 font-medium">
                        {formatINR(inv.paymentSummary.balance)}
                      </td>
                      <td className="py-4 pr-4">
                        <span
                          className={cn(
                            'inline-block border px-2 py-1 text-[0.65rem] uppercase tracking-[0.12em]',
                            billTone(inv.billStatus),
                          )}
                        >
                          {inv.billStatus}
                        </span>
                      </td>
                      <td className="py-4 text-right">
                        <div className="flex flex-col items-end gap-1.5">
                          <Link
                            to={`/admin/invoices/${inv.id}`}
                            className="text-xs uppercase tracking-[0.14em] text-gold hover:underline"
                          >
                            View invoice
                          </Link>
                          <Link
                            to={`/admin/orders/${inv.id}`}
                            className="text-[0.65rem] uppercase tracking-[0.12em] text-black/45 hover:text-black"
                          >
                            Open order
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {total > 25 ? (
          <div className="mt-6 flex items-center justify-between text-sm text-black/55">
            <p>
              Page {page} · {total} invoices
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                size="sm"
                variant="ghost"
                disabled={page * 25 >= total}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        ) : null}
      </section>
    </>
  );
}
