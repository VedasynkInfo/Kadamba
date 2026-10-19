import { useCallback, useEffect, useState, useMemo } from 'react';
import {
  financeApi,
  type InvoiceRecord,
  type InvoiceListResult,
} from '@/services/finance/financeService';
import { AdminHorizonBanner } from '../components/AdminHorizonBanner';
import { PageMeta, staticPageMeta } from '@/seo';
import { InvoicesMetrics } from './InvoicesMetrics';
import { InvoicesToolbar } from './InvoicesToolbar';
import { InvoicesTable } from './InvoicesTable';
import { InvoicePreviewModal } from './InvoicePreviewModal';

export default function InvoicesAdminPage() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<InvoiceRecord[]>([]);
  const [summary, setSummary] = useState<InvoiceListResult['summary'] | null>(null);
  const [paymentStatus, setPaymentStatus] = useState('All');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [query, setQuery] = useState('');

  // Preview Modal
  const [previewInvoice, setPreviewInvoice] = useState<InvoiceRecord | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await financeApi.listInvoices({
        paymentStatus,
        page,
        limit: 50,
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

  const filtered = useMemo(() => {
    if (!query.trim()) return items;
    const needle = query.trim().toLowerCase();
    return items.filter((inv) => {
      return (
        inv.title.toLowerCase().includes(needle) ||
        inv.customer.name.toLowerCase().includes(needle) ||
        inv.customer.phone.includes(needle) ||
        String(inv.orderNumber).includes(needle) ||
        (inv.invoiceNumber || '').toLowerCase().includes(needle) ||
        (inv.referenceId || '').toLowerCase().includes(needle)
      );
    });
  }, [items, query]);

  const hasActiveFilters = Boolean(query || paymentStatus !== 'All');

  function resetFilters() {
    setQuery('');
    setPaymentStatus('All');
    setPage(1);
  }

  return (
    <div className="min-h-screen">
      <PageMeta {...staticPageMeta.admin} path="/admin/invoices" title="Invoices" />
      <AdminHorizonBanner
        title="Client Invoices & Billing Desk"
        copy="Workshop orders with quoted values, advances, outstanding balances, and printable tax receipts."
        actionLabel="Record Payment"
        actionTo="/admin/payments"
      />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 md:px-8 space-y-6">
        {/* Metric Pulse Strip */}
        {summary ? <InvoicesMetrics summary={summary} /> : null}

        {/* Search, Filter & Action Toolbar */}
        <InvoicesToolbar
          query={query}
          onQueryChange={setQuery}
          selectedStatus={paymentStatus}
          onStatusChange={setPaymentStatus}
          hasActiveFilters={hasActiveFilters}
          onResetFilters={resetFilters}
          filteredCount={filtered.length}
          totalCount={total || items.length}
        />

        {/* Modern Compact Table Card */}
        <InvoicesTable
          items={filtered}
          loading={loading}
          hasActiveFilters={hasActiveFilters}
          onResetFilters={resetFilters}
          onPreview={setPreviewInvoice}
        />
      </div>

      {/* Invoice Quick Preview Modal */}
      <InvoicePreviewModal
        invoice={previewInvoice}
        onClose={() => setPreviewInvoice(null)}
      />
    </div>
  );
}
