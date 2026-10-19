import { Icon, type GlyphName } from '@/components/icons';

function formatINR(v: number) {
  return `₹${v.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

interface StaffMetricsProps {
  totalStaff: number;
  activeStaff: number;
  permanentCount: number;
  monthlyPayroll: number;
}

export function StaffMetrics({
  totalStaff,
  activeStaff,
  permanentCount,
  monthlyPayroll,
}: StaffMetricsProps) {
  const cards: {
    label: string;
    value: string | number;
    subtext: string;
    accent: string;
    borderAccent: string;
    icon: GlyphName;
  }[] = [
    {
      label: 'Total Artisans',
      value: totalStaff,
      subtext: 'Registered workshop profiles',
      accent: 'text-brand',
      borderAccent: 'border-l-brand',
      icon: 'staff',
    },
    {
      label: 'Active On-Floor',
      value: activeStaff,
      subtext: `${totalStaff - activeStaff} inactive / on leave`,
      accent: 'text-emerald-400',
      borderAccent: 'border-l-emerald-500',
      icon: 'speed',
    },
    {
      label: 'Permanent Roster',
      value: permanentCount,
      subtext: `${totalStaff - permanentCount} freelance / interns`,
      accent: 'text-blue-400',
      borderAccent: 'border-l-blue-500',
      icon: 'badge',
    },
    {
      label: 'Monthly Payroll',
      value: formatINR(monthlyPayroll),
      subtext: 'Fixed monthly commitment',
      accent: 'text-amber-400',
      borderAccent: 'border-l-amber-500',
      icon: 'salary',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
      {cards.map((c) => (
        <div
          key={c.label}
          className={`rounded-xl border border-l-4 p-4 shadow-xs transition hover:shadow-md ${c.borderAccent} bg-surface-raised border-line text-ink-raised`}
        >
          <div className="flex items-center justify-between text-xs opacity-65">
            <span className="font-semibold uppercase tracking-wider text-[10px]">{c.label}</span>
            <span className="text-base">
              <Icon name={c.icon} size={16} />
            </span>
          </div>
          <div className={`mt-2 font-heading text-2xl font-bold tracking-tight ${c.accent}`}>
            {c.value}
          </div>
          <p className="mt-1 text-[11px] opacity-60 truncate">{c.subtext}</p>
        </div>
      ))}
    </div>
  );
}
