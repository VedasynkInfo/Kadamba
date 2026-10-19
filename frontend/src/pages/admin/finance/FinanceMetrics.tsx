import { Icon } from '@/components/icons';
import type { FinanceSummary } from '@/services/finance/financeService';

function formatINR(v: number) {
  return `₹${v.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

interface FinanceMetricsProps {
  summary: FinanceSummary;
}

export function FinanceMetrics({ summary }: FinanceMetricsProps) {
  const cards = [
    {
      label: 'Total Revenue',
      value: formatINR(summary.totalRevenue),
      subtext: `MTD: ${formatINR(summary.revenueMtd)}`,
      accent: 'text-emerald-400',
      borderAccent: 'border-l-emerald-500',
      icon: 'revenue',
    },
    {
      label: 'Operational Expenses',
      value: formatINR(summary.totalExpenses),
      subtext: 'Fabrics, material, atelier overheads',
      accent: 'text-rose-400',
      borderAccent: 'border-l-rose-500',
      icon: 'expense',
    },
    {
      label: 'Artisan Salaries',
      value: formatINR(summary.totalSalaries),
      subtext: 'Craftsmen & tailoring payroll',
      accent: 'text-amber-400',
      borderAccent: 'border-l-amber-500',
      icon: 'salary',
    },
    {
      label: 'Pending Receivables',
      value: formatINR(summary.pendingBalance),
      subtext: 'Uncollected client balances',
      accent: 'text-purple-400',
      borderAccent: 'border-l-purple-500',
      icon: 'outstanding',
    },
    {
      label: 'Net Studio Profit',
      value: formatINR(summary.netProfit),
      subtext: summary.netProfit >= 0 ? 'Profitable operating period' : 'Operating deficit',
      accent: summary.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400',
      borderAccent: summary.netProfit >= 0 ? 'border-l-emerald-500' : 'border-l-rose-500',
      icon: 'profit',
    },
  ] as const;

  return (
    <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-3 lg:grid-cols-5">
      {cards.map((c) => (
        <div
          key={c.label}
          className={`rounded-xl border border-l-4 p-4 shadow-xs transition hover:shadow-md ${c.borderAccent} bg-surface-raised border-line text-ink-raised`}
        >
          <div className="flex items-center justify-between text-xs opacity-65">
            <span className="font-semibold uppercase tracking-wider text-[10px]">{c.label}</span>
            <span className="text-base"><Icon name={c.icon} size={16} /></span>
          </div>
          <div className={`mt-2 font-heading text-xl font-bold tracking-tight ${c.accent}`}>
            {c.value}
          </div>
          <p className="mt-1 text-[10px] opacity-60 truncate">{c.subtext}</p>
        </div>
      ))}
    </div>
  );
}
