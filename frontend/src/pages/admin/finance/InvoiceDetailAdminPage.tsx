import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { financeApi, type InvoiceDetail } from '@/services/finance/financeService';
import { Button, Spinner } from '@/components/ui';
import { InvoiceDocument } from '@/components/invoices/InvoiceDocument';
import { PageMeta, staticPageMeta } from '@/seo';

export default function InvoiceDetailAdminPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await financeApi.getInvoice(id);
        if (!cancelled) setInvoice(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load invoice');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <>
      <PageMeta
        {...staticPageMeta.admin}
        path={`/admin/invoices/${id || ''}`}
        title={invoice ? `Invoice ${invoice.invoiceNumber}` : 'Invoice'}
      />

      <div className="print:hidden mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-6 sm:px-6 md:px-10">
        <button
          type="button"
          onClick={() => navigate('/admin/invoices')}
          className="text-xs uppercase tracking-[0.2em] text-black/45 transition hover:text-black"
        >
          ← All invoices
        </button>
        <div className="flex flex-wrap gap-2">
          {invoice ? (
            <Link
              to={`/admin/orders/${invoice.order.id}`}
              className="inline-flex items-center border border-black/15 px-3 py-2 text-xs uppercase tracking-[0.14em] text-black/65 hover:border-gold hover:text-black"
            >
              Open order
            </Link>
          ) : null}
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => window.print()}
            disabled={!invoice}
          >
            Print / Save PDF
          </Button>
        </div>
      </div>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 md:px-10 print:px-0 print:pb-0">
        {loading ? (
          <div className="flex justify-center py-20">
            <Spinner label="Loading invoice" />
          </div>
        ) : error || !invoice ? (
          <p className="py-16 text-center text-black/50">{error || 'Invoice not found'}</p>
        ) : (
          <InvoiceDocument invoice={invoice} />
        )}
      </section>

      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          .invoice-document, .invoice-document * { visibility: visible !important; }
          .invoice-document {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            box-shadow: none !important;
          }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </>
  );
}
