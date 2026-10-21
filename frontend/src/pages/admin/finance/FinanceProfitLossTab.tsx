import type { ProfitLossReport } from '@/services/finance/financeService';
import { Skeleton } from '../components/Skeleton';

function formatINR(v: number) {
  return `₹${v.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

interface FinanceProfitLossTabProps {
  report: ProfitLossReport | null;
  loading: boolean;
  fromDate: string;
  toDate: string;
  onFromChange: (val: string) => void;
  onToChange: (val: string) => void;
  onRefresh: () => void;
}

export function FinanceProfitLossTab({
  report,
  loading,
  fromDate,
  toDate,
  onFromChange,
  onToChange,
  onRefresh,
}: FinanceProfitLossTabProps) {
  return (
    <div className="space-y-6 text-xs">
      {/* Date Range Selector Toolbar */}
      <div
        className="rounded-xl border p-4 shadow-xs transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-surface-raised border-line text-ink-raised"
      >
        <div>
          <h3 className="font-heading text-base font-bold tracking-wide">
            Studio Profit & Loss Statement
          </h3>
          <p className="text-[11px] opacity-60 mt-0.5">
            Audit operating margins and net profit across customized reporting periods
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] opacity-65">From:</span>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => onFromChange(e.target.value)}
              className="rounded-lg border py-1.5 px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-focus bg-surface-sunken border-line"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[11px] opacity-65">To:</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => onToChange(e.target.value)}
              className="rounded-lg border py-1.5 px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-focus bg-surface-sunken border-line"
            />
          </div>

          <button
            type="button"
            onClick={onRefresh}
            className="rounded-lg px-3 py-1.5 text-xs font-bold border hover:bg-current/[0.05] transition cursor-pointer border-line"
          >
            Apply
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton variant="card" className="h-32" />
          <Skeleton variant="table" />
        </div>
      ) : report ? (
        <div className="space-y-6">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-4">
            <div
              className="rounded-xl border border-l-4 border-l-emerald-500 p-4 shadow-xs bg-surface-raised border-line"
            >
              <span className="text-[10px] uppercase font-bold tracking-wider opacity-60 block">
                Total Revenue
              </span>
              <p className="mt-1 font-heading text-xl font-bold text-emerald-400">
                {formatINR(report.summary.revenue)}
              </p>
              <span className="text-[10px] opacity-50 block mt-0.5">From workshop orders</span>
            </div>

            <div
              className="rounded-xl border border-l-4 border-l-rose-500 p-4 shadow-xs bg-surface-raised border-line"
            >
              <span className="text-[10px] uppercase font-bold tracking-wider opacity-60 block">
                Direct Expenses
              </span>
              <p className="mt-1 font-heading text-xl font-bold text-rose-400">
                {formatINR(report.summary.expenses)}
              </p>
              <span className="text-[10px] opacity-50 block mt-0.5">Procurement & overheads</span>
            </div>

            <div
              className="rounded-xl border border-l-4 border-l-amber-500 p-4 shadow-xs bg-surface-raised border-line"
            >
              <span className="text-[10px] uppercase font-bold tracking-wider opacity-60 block">
                Artisan Salaries
              </span>
              <p className="mt-1 font-heading text-xl font-bold text-amber-400">
                {formatINR(report.summary.salaries)}
              </p>
              <span className="text-[10px] opacity-50 block mt-0.5">Staff payroll payout</span>
            </div>

            <div
              className={`rounded-xl border border-l-4 p-4 shadow-xs ${
                report.summary.netProfit >= 0 ? 'border-l-emerald-500' : 'border-l-rose-500'
              } bg-surface-raised border-line`}
            >
              <span className="text-[10px] uppercase font-bold tracking-wider opacity-60 block">
                Net P&L Result
              </span>
              <p
                className={`mt-1 font-heading text-xl font-bold ${
                  report.summary.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {formatINR(report.summary.netProfit)}
              </p>
              <span className="text-[10px] opacity-50 block mt-0.5">
                {report.summary.netProfit >= 0 ? 'Net Operating Profit' : 'Operating Deficit'}
              </span>
            </div>
          </div>

          {/* Breakdown Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Top Expenses in Period */}
            <div
              className="rounded-xl border p-4 shadow-xs bg-surface-raised border-line"
            >
              <h4 className="font-heading text-sm font-bold mb-3">Expenses in Period</h4>
              {report.expenses.length === 0 ? (
                <p className="opacity-50 py-4 text-center">No expenses in this period.</p>
              ) : (
                <ul className="divide-y space-y-2 border-line">
                  {report.expenses.slice(0, 8).map((e) => (
                    <li key={e.id} className="pt-2 flex justify-between items-center text-xs">
                      <div>
                        <span className="font-semibold block truncate max-w-[200px]">{e.title}</span>
                        <span className="text-[10px] opacity-50 uppercase">{e.category}</span>
                      </div>
                      <span className="font-bold text-rose-400">{formatINR(e.amount)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Top Salaries in Period */}
            <div
              className="rounded-xl border p-4 shadow-xs bg-surface-raised border-line"
            >
              <h4 className="font-heading text-sm font-bold mb-3">Salaries in Period</h4>
              {report.salaries.length === 0 ? (
                <p className="opacity-50 py-4 text-center">No salaries disbursed in this period.</p>
              ) : (
                <ul className="divide-y space-y-2 border-line">
                  {report.salaries.slice(0, 8).map((s) => (
                    <li key={s.id} className="pt-2 flex justify-between items-center text-xs">
                      <div>
                        <span className="font-semibold block truncate max-w-[200px]">{s.staffName}</span>
                        <span className="text-[10px] opacity-50">{s.period}</span>
                      </div>
                      <span className="font-bold text-amber-400">{formatINR(s.amount)}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
