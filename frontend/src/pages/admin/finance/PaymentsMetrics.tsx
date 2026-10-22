import { CountUp } from '@/components/motion/CountUp';
import { Icon } from '@/components/icons';
function formatINR(v: number) {
  return `â¹${v.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

interface PaymentsMetricsProps {
  totalAmount: number;
  count: number;
  upiTotal: number;
  cashTotal: number;
}

export function PaymentsMetrics({ totalAmount, count, upiTotal, cashTotal }: PaymentsMetricsProps) {
  const cards = [
    {
      label: 'Monthly Inflow',
      value: formatINR(totalAmount),
      icon: 'cash',
      sub: `${count} total recorded payments`,
    },
    {
      label: 'UPI / Digital Share',
      value: formatINR(upiTotal),
      icon: 'card',
      sub: 'Direct bank & QR transactions',
      highlight: true,
    },
    {
      label: 'Cash & Counter',
      value: formatINR(cashTotal),
      icon: 'coins',
      sub: 'Studio desk receipts',
    },
    {
      label: 'Average Receipt',
      value: count > 0 ? formatINR(Math.round(totalAmount / count)) : 'â¹0',
      icon: 'chart',
      sub: 'Per transaction average',
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
          <div className="mt-1 text-[10px] opacity-70 truncate">{c.sub}</div>
        </div>
      ))}
    </div>
  );
}
