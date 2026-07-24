import type { ReportType } from '@/services/reports/reportsService';

export interface ReportCatalogItem {
  type: ReportType;
  title: string;
  description: string;
  category: 'Orders' | 'Revenue' | 'Finance' | 'Customers & Staff';
  needsGroupBy?: boolean;
  usesAsOf?: boolean;
}

export const REPORT_CATALOG: ReportCatalogItem[] = [
  {
    type: 'orders-by-status',
    title: 'Orders by status',
    description: 'How many garment jobs sit in each production stage.',
    category: 'Orders',
  },
  {
    type: 'deliveries-trials',
    title: 'Deliveries & trials',
    description: 'Expected and completed trial and delivery dates in range.',
    category: 'Orders',
  },
  {
    type: 'revenue-trend',
    title: 'Revenue trend',
    description: 'Payments received over time (MTD / monthly).',
    category: 'Revenue',
    needsGroupBy: true,
  },
  {
    type: 'revenue-by-product',
    title: 'Revenue by product',
    description: 'Which garment types bring in payments.',
    category: 'Revenue',
  },
  {
    type: 'revenue-by-service',
    title: 'Revenue by service',
    description: 'Payments attributed to boutique services.',
    category: 'Revenue',
  },
  {
    type: 'outstanding',
    title: 'Outstanding balances',
    description: 'Open orders: advances paid vs balance due.',
    category: 'Finance',
    usesAsOf: true,
  },
  {
    type: 'expenses-salaries',
    title: 'Expenses & salaries',
    description: 'Studio outflows by expense category and salary period.',
    category: 'Finance',
  },
  {
    type: 'pnl',
    title: 'Profit & Loss',
    description: 'Payments received minus expenses and salaries.',
    category: 'Finance',
  },
  {
    type: 'leads-conversion',
    title: 'Lead sources & conversion',
    description: 'Which enquiry sources become confirmed orders.',
    category: 'Customers & Staff',
  },
  {
    type: 'staff-workload',
    title: 'Staff workload',
    description: 'Open vs completed orders per assigned tailor.',
    category: 'Customers & Staff',
  },
  {
    type: 'customer-repeat',
    title: 'Customer repeat rate',
    description: 'New vs returning clients who ordered in range.',
    category: 'Customers & Staff',
  },
];

export const REPORT_CATEGORIES = ['Orders', 'Revenue', 'Finance', 'Customers & Staff'] as const;

export function getReportMeta(type: string): ReportCatalogItem | undefined {
  return REPORT_CATALOG.find((r) => r.type === type);
}

export type DatePreset = 'mtd' | '30' | '90' | 'custom';

export function rangeFromPreset(preset: DatePreset, customFrom?: string, customTo?: string) {
  const to = new Date();
  to.setHours(23, 59, 59, 999);
  const from = new Date();
  from.setHours(0, 0, 0, 0);

  if (preset === 'mtd') {
    from.setDate(1);
  } else if (preset === '30') {
    from.setDate(from.getDate() - 30);
  } else if (preset === '90') {
    from.setDate(from.getDate() - 90);
  } else {
    const f = customFrom ? new Date(customFrom) : from;
    const t = customTo ? new Date(customTo) : to;
    f.setHours(0, 0, 0, 0);
    t.setHours(23, 59, 59, 999);
    return { from: f.toISOString(), to: t.toISOString() };
  }

  return { from: from.toISOString(), to: to.toISOString() };
}

export function formatINR(v: number) {
  return `₹${v.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

export function formatStatusLabel(status: string) {
  return status.replace(/_/g, ' ');
}
