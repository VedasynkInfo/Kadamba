import { Link } from 'react-router-dom';
import { Icon } from '@/components/icons';
import type { FinanceSummary } from '@/services/finance/financeService';

function formatINR(v: number) {
  return `₹${v.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

interface FinanceOverviewTabProps {
  summary: FinanceSummary;
}

export function FinanceOverviewTab({ summary }: FinanceOverviewTabProps) {
  const maxVal = Math.max(
    ...summary.series.map((r) => Math.max(r.revenue, r.expenses + (r.profit < 0 ? Math.abs(r.profit) : 0))),
    1,
  );

  return (
    <div className="space-y-6 text-xs">
      {/* Visual Revenue vs Expense Progression */}
      {summary.series.length > 0 ? (
        <div
          className="rounded-xl border p-5 shadow-xs transition-colors bg-surface-raised border-line text-ink-raised"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-5">
            <div>
              <h3 className="font-heading text-base font-bold tracking-wide">
                Workshop Performance Progression
              </h3>
              <p className="text-[11px] opacity-60 mt-0.5">
                Monthly revenue collections vs atelier operational costs (last 6 months)
              </p>
            </div>
            <div className="flex items-center gap-4 text-[11px]">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-3 rounded-full bg-emerald-400 inline-block" />
                <span className="opacity-70">Client Inflows</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-3 rounded-full bg-rose-400 inline-block" />
                <span className="opacity-70">Studio Outflows</span>
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {summary.series.slice(-6).map((row) => {
              const revPct = Math.min((row.revenue / maxVal) * 100, 100);
              const expPct = Math.min((row.expenses / maxVal) * 100, 100);

              return (
                <div key={row.month} className="space-y-1.5">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="font-semibold uppercase tracking-wider opacity-80">
                      {row.month}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-emerald-400 font-semibold">{formatINR(row.revenue)}</span>
                      <span className="opacity-40">/</span>
                      <span className="text-rose-400 font-semibold">{formatINR(row.expenses)}</span>
                    </div>
                  </div>

                  <div
                    className="h-3 w-full rounded-full overflow-hidden flex gap-1 p-0.5 bg-surface-sunken"
                  >
                    <div
                      className="h-full rounded-full bg-emerald-400 transition-all duration-500"
                      style={{ width: `${revPct}%` }}
                      title={`Revenue: ${formatINR(row.revenue)}`}
                    />
                    <div
                      className="h-full rounded-full bg-rose-400 transition-all duration-500"
                      style={{ width: `${expPct}%` }}
                      title={`Expenses: ${formatINR(row.expenses)}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Quick Access Portals */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div
          className="rounded-xl border p-5 shadow-xs transition hover:border-brand bg-surface-raised border-line text-ink-raised"
        >
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-heading text-sm font-bold">Invoices & Billing Hub</h4>
            <Icon name="file" size={14} />
          </div>
          <p className="text-xs opacity-60 mb-4">
            Manage tax invoices, proforma bills, settlement statuses, and client billing links.
          </p>
          <Link
            to="/admin/invoices"
            className="inline-flex items-center gap-1 font-semibold text-brand hover:underline"
          >
            <span>Open Invoices Desk</span>
            <span><Icon name="arrowRight" size={14} className="mr-1 inline align-middle" /> </span>
          </Link>
        </div>

        <div
          className="rounded-xl border p-5 shadow-xs transition hover:border-brand bg-surface-raised border-line text-ink-raised"
        >
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-heading text-sm font-bold">Payments & Receipts</h4>
            <span className="text-lg"><Icon name="card" size={14} className="mr-1 inline align-middle" /> </span>
          </div>
          <p className="text-xs opacity-60 mb-4">
            Audit daily receipts across UPI, cash counter, cards, and send WhatsApp receipts.
          </p>
          <Link
            to="/admin/payments"
            className="inline-flex items-center gap-1 font-semibold text-brand hover:underline"
          >
            <span>Open Payments Desk</span>
            <span><Icon name="arrowRight" size={14} className="mr-1 inline align-middle" /> </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
