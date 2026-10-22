import type { SalaryRecord } from '@/services/finance/financeService';
import { EmptyState } from '../components/EmptyState';

const MONTH_NAMES = [
  '',
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
  return `â¹${v.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
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

interface FinanceSalariesTabProps {
  salaries: SalaryRecord[];
  onAddSalary: () => void;
}

export function FinanceSalariesTab({ salaries, onAddSalary }: FinanceSalariesTabProps) {
  return (
    <div className="space-y-4">
      {/* Action Toolbar */}
      <div
        className="rounded-xl border p-3.5 shadow-xs transition-colors flex items-center justify-between gap-3 bg-surface-raised border-line text-ink-raised"
      >
        <div>
          <h3 className="font-heading text-sm font-bold tracking-wide">Artisan Payroll Ledger</h3>
          <p className="text-[11px] opacity-70 mt-0.5">
            Disbursements to workshop tailors, masters, and maggam specialists
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs opacity-70">
            Total <strong>{salaries.length}</strong> disbursements
          </span>
          <button
            type="button"
            onClick={onAddSalary}
            className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold shadow-xs transition hover:opacity-95 active:scale-98 cursor-pointer bg-brand text-ink-on-brand"
          >
            <span className="text-sm font-black">+</span>
            <span>Record Salary</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div
        className="rounded-xl border shadow-xs overflow-visible transition-colors bg-surface-raised border-line text-ink-raised"
      >
        {salaries.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="No salary disbursements recorded"
              description="No staff payroll payments have been logged yet."
              actionLabel="+ Record First Salary"
              onAction={onAddSalary}
            />
          </div>
        ) : (
          <div className="overflow-x-auto overflow-y-hidden">
            <table className="w-full min-w-[850px] text-left border-collapse text-xs table-fixed">
              <thead>
                <tr
                  className="border-b text-[0.65rem] uppercase tracking-wider font-semibold opacity-75 border-line bg-surface-sunken"
                >
                  <th className="py-3 px-4 min-w-[200px]">Artisan / Staff</th>
                  <th className="py-3 px-4 w-[160px]">Pay Period</th>
                  <th className="py-3 px-4 w-[130px]">Disbursed On</th>
                  <th className="py-3 px-4 min-w-[180px]">Disbursement Notes</th>
                  <th className="py-3 px-4 w-[140px] text-right">Amount</th>
                </tr>
              </thead>
              <tbody
                className="stagger-rows divide-y border-line"
              >
                {salaries.map((sal) => {
                  const staffObj = typeof sal.staffId === 'object' ? sal.staffId : null;
                  const staffName = staffObj?.fullName || 'Artisan';
                  const staffPhone = staffObj?.phone || '';

                  return (
                    <tr
                      key={sal.id}
                      className="transition hover:bg-current/[0.03] border-line"
                    >
                      <td className="py-3 px-4">
                        <span className="font-semibold block truncate">{staffName}</span>
                        {staffPhone ? (
                          <span className="text-[10px] opacity-70 block font-mono mt-0.5">
                            {staffPhone}
                          </span>
                        ) : null}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-semibold">
                          {MONTH_NAMES[sal.month] || sal.month} {sal.year}
                        </span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap opacity-75">
                        {formatDate(sal.paidAt)}
                      </td>

                      <td className="py-3 px-4">
                        <span className="opacity-80 block truncate max-w-[250px]">
                          {sal.notes || 'â'}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <span className="font-bold text-amber-400">{formatINR(sal.amount)}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
