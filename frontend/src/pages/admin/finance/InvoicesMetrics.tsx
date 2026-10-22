import { CountUp } from '@/components/motion/CountUp';
import { Icon } from '@/components/icons';
function formatINR(v: number) {
  return `â¹${v.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

interface InvoicesMetricsProps {
  summary: {
    totalQuoted: number;
    totalPaid: number;
    totalBalance: number;
    ordersWithBalance?: number;
    unpaid?: number;
    partial?: number;
    paid?: number;
  };
}

export function InvoicesMetrics({ summary }: InvoicesMetricsProps) {
  const cards = [
    {
      label: 'Total Quoted Value',
      value: formatINR(summary.totalQuoted || 0),
      icon: 'invoice',
      sub: 'All atelier commissioned work',
    },
    {
      label: 'Collected Payments',
      value: formatINR(summary.totalPaid || 0),
      icon: 'cash',
      sub: 'Advances & completed payments',
      highlight: true,
    },
    {
      label: 'Outstanding Balance',
      value: formatINR(summary.totalBalance || 0),
      icon: 'outstanding',
      sub: `${summary.unpaid || 0} unpaid Â· ${summary.partial || 0} partial`,
    },
    {
      label: 'Fully Cleared Invoices',
      value: summary.paid || 0,
      icon: 'successDouble',
      sub: 'Orders settled in full',
    },
  ] as const;

  return (
    <div className="stagger-items grid grid-cols-2 gap-3 sm:grid-cols-4">
      {cards.map((c) => (
        <div
          key={c.label}
          className="rounded-xl border p-3.5 shadow-xs transition-colors bg-surface-raised border-line text-ink-raised"
        >
          <div className="flex items-center justify-between opacity-70">
            <span className="text-[11px] font-semibold uppercase tracking-wider">{c.label}</span>
            <span className="text-sm"><Icon name={c.icon} size={16} /></span>
          </div>
          <div className="mt-2 text-2xl font-bold font-heading tracking-tight text-inherit truncate">
            {typeof c.value === 'number' ? <CountUp value={c.value} /> : c.value}
          </div>
          <div className="mt-1 text-[10px] opacity-50 truncate">{c.sub}</div>
        </div>
      ))}
    </div>
  );
}
