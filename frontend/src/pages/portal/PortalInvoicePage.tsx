import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { portalApi } from '@/services/portal/portalService';
import { Button, Spinner } from '@/components/ui';
import {
  InvoiceDocument,
  type InvoiceDocumentData,
} from '@/components/invoices/InvoiceDocument';

export default function PortalInvoicePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState<InvoiceDocumentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const data = await portalApi.invoice(id);
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
    <div className="space-y-6">
      <div className="print:hidden flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate('/portal/payments')}
          className="text-xs uppercase tracking-[0.18em] text-cream/50 hover:text-gold"
        >
          ← Payments & invoices
        </button>
        <div className="flex flex-wrap gap-2">
          {invoice ? (
            <Link
              to={`/portal/orders/${invoice.order.id}`}
              className="inline-flex items-center border border-gold/25 px-3 py-2 text-xs uppercase tracking-[0.14em] text-cream/70 hover:border-gold hover:text-gold"
            >
              View order
            </Link>
          ) : null}
          <Button type="button" size="sm" onClick={() => window.print()} disabled={!invoice}>
            Print / Save PDF
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner label="Loading invoice" />
        </div>
      ) : error || !invoice ? (
        <p className="py-12 text-center text-rose-300">{error || 'Invoice not found'}</p>
      ) : (
        <div className="overflow-x-auto pb-4">
          <InvoiceDocument invoice={invoice} />
        </div>
      )}

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
    </div>
  );
}
