function formatINR(v: number) {
  return `₹${v.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
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
      icon: '💵',
      sub: `${count} total recorded payments`,
    },
    {
      label: 'UPI / Digital Share',
      value: formatINR(upiTotal),
      icon: '📱',
      sub: 'Direct bank & QR transactions',
      highlight: true,
    },
    {
      label: 'Cash & Counter',
      value: formatINR(cashTotal),
      icon: '🪙',
      sub: 'Studio desk receipts',
    },
    {
      label: 'Average Receipt',
      value: count > 0 ? formatINR(Math.round(totalAmount / count)) : '₹0',
      icon: '📊',
      sub: 'Per transaction average',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {cards.map((c) => (
        <div
          key={c.label}
          className="rounded-xl border p-3.5 shadow-xs transition-colors bg-surface-raised border-line text-ink-raised"
        >
          <div className="flex items-center justify-between opacity-70">
            <span className="text-[11px] font-semibold uppercase tracking-wider">{c.label}</span>
            <span className="text-sm">{c.icon}</span>
          </div>
          <div className="mt-2 text-2xl font-bold font-heading tracking-tight text-inherit truncate">
            {c.value}
          </div>
          <div className="mt-1 text-[10px] opacity-50 truncate">{c.sub}</div>
        </div>
      ))}
    </div>
  );
}
