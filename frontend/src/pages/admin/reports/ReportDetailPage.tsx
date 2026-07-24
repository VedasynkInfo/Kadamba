import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { AdminHorizonBanner } from '../components/AdminHorizonBanner';
import { adminBanners } from '../data';
import { Button, Spinner } from '@/components/ui';
import { cn } from '@/utils/cn';
import {
  reportsApi,
  type AnyReport,
  type ReportType,
  type GroupBy,
  REPORT_TYPES,
} from '@/services/reports/reportsService';
import {
  getReportMeta,
  rangeFromPreset,
  formatINR,
  formatStatusLabel,
  type DatePreset,
} from './reportCatalog';

const COLORS = ['#000000', '#b59410', '#8a731e', '#4a3f12', '#c5a228', '#6b5a1a'];

function toDateInputValue(iso: string) {
  return iso.slice(0, 10);
}

export default function ReportDetailPage() {
  const { type: typeParam } = useParams<{ type: string }>();
  const meta = typeParam ? getReportMeta(typeParam) : undefined;

  const [preset, setPreset] = useState<DatePreset>('30');
  const [customFrom, setCustomFrom] = useState(() => toDateInputValue(rangeFromPreset('30').from));
  const [customTo, setCustomTo] = useState(() => toDateInputValue(rangeFromPreset('30').to));
  const [groupBy, setGroupBy] = useState<GroupBy>('month');
  const [data, setData] = useState<AnyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [tableSearch, setTableSearch] = useState('');
  const [runKey, setRunKey] = useState(0);

  const isValidType = Boolean(typeParam && REPORT_TYPES.includes(typeParam as ReportType));

  const params = useMemo(() => {
    const range = rangeFromPreset(preset, customFrom, customTo);
    return {
      ...range,
      groupBy,
      asOf: range.to,
    };
  }, [preset, customFrom, customTo, groupBy]);

  useEffect(() => {
    if (!isValidType || !typeParam) return;
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const report = await reportsApi.fetchReport(typeParam as ReportType, params);
        if (active) setData(report);
      } catch (err: unknown) {
        console.error(err);
        if (active) setError('Could not load this report. Check the date range and try again.');
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, [typeParam, isValidType, params, runKey]);

  if (!isValidType) {
    return <Navigate to="/admin/reports" replace />;
  }

  const handleExport = async () => {
    setExporting(true);
    try {
      await reportsApi.downloadCsv(typeParam as ReportType, params);
    } catch (err) {
      console.error(err);
      setError('CSV export failed. Please retry.');
    } finally {
      setExporting(false);
    }
  };

  const definition =
    data && 'definition' in data ? data.definition : meta?.description || '';

  return (
    <>
      <AdminHorizonBanner
        density="desk"
        title={meta?.title || 'Report'}
        copy={adminBanners.reports.copy}
        actionLabel="All reports"
        actionTo="/admin/reports"
      />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:px-10">
        <div className="mb-6">
          <Link to="/admin/reports" className="text-xs font-medium text-black/50 hover:text-black">
            ← Reports hub
          </Link>
          <h2 className="mt-2 font-heading text-2xl text-black">{meta?.title}</h2>
          <p className="mt-1 text-sm text-black/55">{meta?.description}</p>
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-4 border-b border-black/10 pb-6 mb-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                ['mtd', 'MTD'],
                ['30', 'Last 30'],
                ['90', 'Last 90'],
                ['custom', 'Custom'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setPreset(key)}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded border transition',
                  preset === key
                    ? 'bg-black text-cream border-black'
                    : 'border-black/15 text-black/60 hover:border-black/40',
                )}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-end gap-3">
            {preset === 'custom' && (
              <>
                <label className="text-xs text-black/55">
                  From
                  <input
                    type="date"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    className="mt-1 block rounded border border-black/15 bg-white px-2 py-1.5 text-sm text-black"
                  />
                </label>
                <label className="text-xs text-black/55">
                  To
                  <input
                    type="date"
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                    className="mt-1 block rounded border border-black/15 bg-white px-2 py-1.5 text-sm text-black"
                  />
                </label>
              </>
            )}
            {meta?.needsGroupBy && (
              <label className="text-xs text-black/55">
                Group by
                <select
                  value={groupBy}
                  onChange={(e) => setGroupBy(e.target.value as GroupBy)}
                  className="mt-1 block rounded border border-black/15 bg-white px-2 py-1.5 text-sm text-black"
                >
                  <option value="day">Day</option>
                  <option value="week">Week</option>
                  <option value="month">Month</option>
                </select>
              </label>
            )}
            <Button variant="secondary" onClick={() => setRunKey((k) => k + 1)}>
              Run report
            </Button>
            <Button variant="primary" onClick={() => void handleExport()} disabled={exporting || loading}>
              {exporting ? 'Exporting…' : 'Export CSV'}
            </Button>
          </div>
        </div>

        {definition && (
          <p className="mb-6 text-xs text-black/45 border-l-2 border-gold/60 pl-3">
            {definition}
          </p>
        )}

        {loading ? (
          <div className="flex min-h-[320px] items-center justify-center">
            <Spinner size="lg" label="Building report…" />
          </div>
        ) : error ? (
          <div className="rounded border border-black/10 bg-cream/40 p-8 text-center">
            <p className="text-black/70 mb-4">{error}</p>
            <Button variant="secondary" onClick={() => setRunKey((k) => k + 1)}>
              Retry
            </Button>
          </div>
        ) : data ? (
          <ReportBody data={data} type={typeParam as ReportType} search={tableSearch} onSearch={setTableSearch} />
        ) : null}
      </div>
    </>
  );
}

function ReportBody({
  data,
  type,
  search,
  onSearch,
}: {
  data: AnyReport;
  type: ReportType;
  search: string;
  onSearch: (v: string) => void;
}) {
  const empty = isReportEmpty(data, type);

  if (empty) {
    return (
      <div className="flex min-h-[240px] flex-col items-center justify-center rounded border border-dashed border-black/15 bg-cream/30 p-10 text-center">
        <p className="font-heading text-lg text-black">No data for this range</p>
        <p className="mt-2 text-sm text-black/50 max-w-md">
          Try a wider date range, or record payments and orders first — reports use live boutique data.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <SummaryStrip data={data} type={type} />
      <ReportChart data={data} type={type} />
      <div>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-sm font-medium text-black">Detail table</h3>
          <input
            type="search"
            placeholder="Search table…"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            className="rounded border border-black/15 bg-white px-3 py-1.5 text-sm text-black w-full max-w-xs"
          />
        </div>
        <div className="overflow-x-auto border border-black/10">
          <ReportTable data={data} type={type} search={search} />
        </div>
      </div>
    </div>
  );
}

function isReportEmpty(data: AnyReport, type: ReportType): boolean {
  switch (type) {
    case 'orders-by-status':
      return 'total' in data && data.total === 0;
    case 'deliveries-trials':
      return 'rows' in data && Array.isArray(data.rows) && data.rows.length === 0;
    case 'revenue-trend':
    case 'revenue-by-product':
    case 'revenue-by-service':
      return 'total' in data && (data as { total: number }).total === 0;
    case 'outstanding':
      return 'summary' in data && (data as { summary: { openOrders: number } }).summary.openOrders === 0;
    case 'expenses-salaries':
      return (
        'summary' in data &&
        (data as { summary: { totalOutflow: number } }).summary.totalOutflow === 0
      );
    case 'pnl':
      return (
        'summary' in data &&
        (data as { summary: { revenue: number; expenses: number; salaries: number } }).summary
          .revenue === 0 &&
        (data as { summary: { expenses: number } }).summary.expenses === 0 &&
        (data as { summary: { salaries: number } }).summary.salaries === 0
      );
    case 'leads-conversion':
      return 'summary' in data && (data as { summary: { totalLeads: number } }).summary.totalLeads === 0;
    case 'staff-workload':
      return 'rows' in data && Array.isArray(data.rows) && data.rows.length === 0;
    case 'customer-repeat':
      return (
        'summary' in data &&
        (data as { summary: { customersInPeriod: number } }).summary.customersInPeriod === 0
      );
    default:
      return false;
  }
}

function SummaryStrip({ data, type }: { data: AnyReport; type: ReportType }) {
  const cards: Array<{ label: string; value: string }> = [];

  if (type === 'orders-by-status' && 'total' in data) {
    cards.push({ label: 'Orders', value: String(data.total) });
  }
  if (type === 'deliveries-trials' && 'summary' in data) {
    const s = (data as Extract<AnyReport, { summary: { expectedTrials: number } }>).summary;
    cards.push(
      { label: 'Expected trials', value: String(s.expectedTrials) },
      { label: 'Actual trials', value: String(s.actualTrials) },
      { label: 'Expected deliveries', value: String(s.expectedDeliveries) },
      { label: 'Actual deliveries', value: String(s.actualDeliveries) },
    );
  }
  if ((type === 'revenue-trend' || type === 'revenue-by-product' || type === 'revenue-by-service') && 'total' in data) {
    cards.push({ label: 'Gross payments', value: formatINR((data as { total: number }).total) });
  }
  if (type === 'outstanding' && 'summary' in data) {
    const s = (data as Extract<AnyReport, { summary: { totalOutstanding: number } }>).summary;
    cards.push(
      { label: 'Open orders', value: String(s.openOrders) },
      { label: 'Outstanding', value: formatINR(s.totalOutstanding) },
      { label: 'Advances', value: formatINR(s.totalAdvances) },
    );
  }
  if (type === 'expenses-salaries' && 'summary' in data) {
    const s = (data as Extract<AnyReport, { summary: { totalExpenses: number } }>).summary;
    cards.push(
      { label: 'Expenses', value: formatINR(s.totalExpenses) },
      { label: 'Salaries', value: formatINR(s.totalSalaries) },
      { label: 'Total outflow', value: formatINR(s.totalOutflow) },
    );
  }
  if (type === 'pnl' && 'summary' in data) {
    const s = (data as Extract<AnyReport, { summary: { revenue: number; netProfit: number } }>).summary;
    cards.push(
      { label: 'Revenue', value: formatINR(s.revenue) },
      { label: 'Expenses', value: formatINR(s.expenses) },
      { label: 'Salaries', value: formatINR(s.salaries) },
      { label: 'Net profit', value: formatINR(s.netProfit) },
    );
  }
  if (type === 'leads-conversion' && 'summary' in data) {
    const s = (data as Extract<AnyReport, { summary: { totalLeads: number } }>).summary;
    cards.push(
      { label: 'Leads', value: String(s.totalLeads) },
      { label: 'Converted', value: String(s.totalConverted) },
      { label: 'Conversion', value: `${s.conversionRate}%` },
    );
  }
  if (type === 'staff-workload' && 'summary' in data) {
    const s = (data as Extract<AnyReport, { summary: { staffCount: number } }>).summary;
    cards.push(
      { label: 'Staff', value: String(s.staffCount) },
      { label: 'Orders with staff', value: String(s.ordersWithStaff) },
    );
  }
  if (type === 'customer-repeat' && 'summary' in data) {
    const s = (data as Extract<AnyReport, { summary: { repeatRate: number } }>).summary;
    cards.push(
      { label: 'Customers', value: String(s.customersInPeriod) },
      { label: 'New', value: String(s.newCustomers) },
      { label: 'Returning', value: String(s.returningCustomers) },
      { label: 'Repeat rate', value: `${s.repeatRate}%` },
    );
  }

  if (!cards.length) return null;

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((c) => (
        <div key={c.label} className="border-t border-black/15 pt-3">
          <p className="text-xs uppercase tracking-wider text-black/45">{c.label}</p>
          <p className="mt-1 font-heading text-2xl text-black">{c.value}</p>
        </div>
      ))}
    </div>
  );
}

function ReportChart({ data, type }: { data: AnyReport; type: ReportType }) {
  if (type === 'orders-by-status' && 'rows' in data) {
    const rows = data.rows as Array<{ status: string; count: number }>;
    return (
      <div className="h-72 w-full">
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={rows}
              dataKey="count"
              nameKey="status"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label={({ name, percent }: { name?: string; percent?: number }) =>
                `${formatStatusLabel(String(name ?? ''))} ${((percent ?? 0) * 100).toFixed(0)}%`
              }
            >
              {rows.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(v) => [v, 'Orders']} />
            <Legend formatter={(v) => formatStatusLabel(String(v))} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (type === 'revenue-trend' && 'rows' in data) {
    const rows = data.rows as Array<{ period: string; amount: number }>;
    return (
      <div className="h-72 w-full">
        <ResponsiveContainer>
          <BarChart data={rows}>
            <CartesianGrid strokeDasharray="3 3" stroke="#00000015" />
            <XAxis dataKey="period" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v) => [formatINR(Number(v)), 'Payments']} />
            <Bar dataKey="amount" fill="#b59410" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if ((type === 'revenue-by-product' || type === 'revenue-by-service') && 'rows' in data) {
    const rows = (data.rows as Array<{ productName?: string; serviceName?: string; grossPayments: number }>).map(
      (r) => ({
        name: r.productName || r.serviceName || '—',
        amount: r.grossPayments,
      }),
    );
    return (
      <div className="h-72 w-full">
        <ResponsiveContainer>
          <BarChart data={rows} layout="vertical" margin={{ left: 40 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#00000015" />
            <XAxis type="number" tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v) => [formatINR(Number(v)), 'Payments']} />
            <Bar dataKey="amount" fill="#000000" radius={[0, 2, 2, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (type === 'leads-conversion' && 'rows' in data) {
    const rows = data.rows as Array<{ source: string; leads: number; converted: number }>;
    return (
      <div className="h-72 w-full">
        <ResponsiveContainer>
          <BarChart data={rows}>
            <CartesianGrid strokeDasharray="3 3" stroke="#00000015" />
            <XAxis dataKey="source" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="leads" fill="#000000" name="Leads" />
            <Bar dataKey="converted" fill="#b59410" name="Converted" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (type === 'staff-workload' && 'rows' in data) {
    const rows = data.rows as Array<{ name: string; open: number; completed: number }>;
    return (
      <div className="h-72 w-full">
        <ResponsiveContainer>
          <BarChart data={rows}>
            <CartesianGrid strokeDasharray="3 3" stroke="#00000015" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="open" stackId="a" fill="#8a731e" name="Open" />
            <Bar dataKey="completed" stackId="a" fill="#000000" name="Completed" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (type === 'pnl' && 'summary' in data) {
    const s = (data as Extract<AnyReport, { summary: { revenue: number } }>).summary;
    const rows = [
      { name: 'Revenue', amount: s.revenue },
      { name: 'Expenses', amount: s.expenses },
      { name: 'Salaries', amount: s.salaries },
      { name: 'Net', amount: s.netProfit },
    ];
    return (
      <div className="h-72 w-full">
        <ResponsiveContainer>
          <BarChart data={rows}>
            <CartesianGrid strokeDasharray="3 3" stroke="#00000015" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v) => [formatINR(Number(v)), '']} />
            <Bar dataKey="amount" fill="#b59410" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (type === 'expenses-salaries' && 'expenseRows' in data) {
    const rows = (data as Extract<AnyReport, { expenseRows: Array<{ category: string; amount: number }> }>).expenseRows.map(
      (r) => ({ name: r.category, amount: r.amount }),
    );
    if (!rows.length) return null;
    return (
      <div className="h-72 w-full">
        <ResponsiveContainer>
          <BarChart data={rows}>
            <CartesianGrid strokeDasharray="3 3" stroke="#00000015" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v) => [formatINR(Number(v)), 'Amount']} />
            <Bar dataKey="amount" fill="#4a3f12" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return null;
}

function matchesSearch(row: Record<string, unknown>, search: string): boolean {
  if (!search.trim()) return true;
  const q = search.toLowerCase();
  return Object.values(row).some((v) => String(v ?? '').toLowerCase().includes(q));
}

function ReportTable({ data, type, search }: { data: AnyReport; type: ReportType; search: string }) {
  if (type === 'orders-by-status' && 'rows' in data) {
    const rows = (data.rows as Array<{ status: string; count: number; percent: number }>).filter((r) =>
      matchesSearch(r, search),
    );
    return (
      <table className="min-w-full text-sm">
        <thead className="bg-cream/60 text-left text-xs uppercase tracking-wider text-black/50">
          <tr>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Count</th>
            <th className="px-4 py-3">%</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.status} className="border-t border-black/8">
              <td className="px-4 py-2.5 capitalize">{formatStatusLabel(r.status)}</td>
              <td className="px-4 py-2.5">{r.count}</td>
              <td className="px-4 py-2.5">{r.percent}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  if (type === 'deliveries-trials' && 'rows' in data) {
    const rows = (
      data.rows as Array<{
        orderId: string;
        orderNumber: number;
        title: string;
        status: string;
        expectedTrialAt: string | null;
        expectedDeliveryAt: string | null;
      }>
    ).filter((r) => matchesSearch(r as unknown as Record<string, unknown>, search));
    return (
      <table className="min-w-full text-sm">
        <thead className="bg-cream/60 text-left text-xs uppercase tracking-wider text-black/50">
          <tr>
            <th className="px-4 py-3">Order</th>
            <th className="px-4 py-3">Title</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Trial</th>
            <th className="px-4 py-3">Delivery</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.orderId} className="border-t border-black/8">
              <td className="px-4 py-2.5">
                <Link to={`/admin/orders/${r.orderId}`} className="text-gold hover:underline">
                  #{r.orderNumber}
                </Link>
              </td>
              <td className="px-4 py-2.5">{r.title}</td>
              <td className="px-4 py-2.5 capitalize">{formatStatusLabel(r.status)}</td>
              <td className="px-4 py-2.5">{r.expectedTrialAt?.slice(0, 10) || '—'}</td>
              <td className="px-4 py-2.5">{r.expectedDeliveryAt?.slice(0, 10) || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  if (type === 'revenue-trend' && 'rows' in data) {
    const rows = (data.rows as Array<{ period: string; amount: number; paymentCount: number; percent: number }>).filter(
      (r) => matchesSearch(r, search),
    );
    return (
      <table className="min-w-full text-sm">
        <thead className="bg-cream/60 text-left text-xs uppercase tracking-wider text-black/50">
          <tr>
            <th className="px-4 py-3">Period</th>
            <th className="px-4 py-3">Amount</th>
            <th className="px-4 py-3">Payments</th>
            <th className="px-4 py-3">%</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.period} className="border-t border-black/8">
              <td className="px-4 py-2.5">{r.period}</td>
              <td className="px-4 py-2.5">{formatINR(r.amount)}</td>
              <td className="px-4 py-2.5">{r.paymentCount}</td>
              <td className="px-4 py-2.5">{r.percent}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  if (type === 'revenue-by-product' && 'rows' in data) {
    const rows = (
      data.rows as Array<{
        productCode: string;
        productName: string;
        ordersCount: number;
        grossPayments: number;
        outstanding: number;
        percent: number;
      }>
    ).filter((r) => matchesSearch(r, search));
    return (
      <table className="min-w-full text-sm">
        <thead className="bg-cream/60 text-left text-xs uppercase tracking-wider text-black/50">
          <tr>
            <th className="px-4 py-3">Product</th>
            <th className="px-4 py-3">Orders</th>
            <th className="px-4 py-3">Gross payments</th>
            <th className="px-4 py-3">Outstanding</th>
            <th className="px-4 py-3">%</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.productCode} className="border-t border-black/8">
              <td className="px-4 py-2.5">{r.productName}</td>
              <td className="px-4 py-2.5">{r.ordersCount}</td>
              <td className="px-4 py-2.5">{formatINR(r.grossPayments)}</td>
              <td className="px-4 py-2.5">{formatINR(r.outstanding)}</td>
              <td className="px-4 py-2.5">{r.percent}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  if (type === 'revenue-by-service' && 'rows' in data) {
    const rows = (
      data.rows as Array<{
        serviceId: string;
        serviceName: string;
        ordersCount: number;
        grossPayments: number;
        percent: number;
      }>
    ).filter((r) => matchesSearch(r, search));
    return (
      <table className="min-w-full text-sm">
        <thead className="bg-cream/60 text-left text-xs uppercase tracking-wider text-black/50">
          <tr>
            <th className="px-4 py-3">Service</th>
            <th className="px-4 py-3">Orders</th>
            <th className="px-4 py-3">Gross payments</th>
            <th className="px-4 py-3">%</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.serviceId} className="border-t border-black/8">
              <td className="px-4 py-2.5">{r.serviceName}</td>
              <td className="px-4 py-2.5">{r.ordersCount}</td>
              <td className="px-4 py-2.5">{formatINR(r.grossPayments)}</td>
              <td className="px-4 py-2.5">{r.percent}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  if (type === 'outstanding' && 'rows' in data) {
    const rows = (
      data.rows as Array<{
        orderId: string;
        orderNumber: number;
        title: string;
        status: string;
        customerId: string | null;
        customerName: string;
        totalQuoted: number;
        totalPaid: number;
        balance: number;
      }>
    ).filter((r) => matchesSearch(r as unknown as Record<string, unknown>, search));
    return (
      <table className="min-w-full text-sm">
        <thead className="bg-cream/60 text-left text-xs uppercase tracking-wider text-black/50">
          <tr>
            <th className="px-4 py-3">Order</th>
            <th className="px-4 py-3">Customer</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Quoted</th>
            <th className="px-4 py-3">Paid</th>
            <th className="px-4 py-3">Balance</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.orderId} className="border-t border-black/8">
              <td className="px-4 py-2.5">
                <Link to={`/admin/orders/${r.orderId}`} className="text-gold hover:underline">
                  #{r.orderNumber}
                </Link>
                <span className="block text-xs text-black/45">{r.title}</span>
              </td>
              <td className="px-4 py-2.5">
                {r.customerId ? (
                  <Link to={`/admin/customers/${r.customerId}`} className="text-gold hover:underline">
                    {r.customerName}
                  </Link>
                ) : (
                  r.customerName
                )}
              </td>
              <td className="px-4 py-2.5 capitalize">{formatStatusLabel(r.status)}</td>
              <td className="px-4 py-2.5">{formatINR(r.totalQuoted)}</td>
              <td className="px-4 py-2.5">{formatINR(r.totalPaid)}</td>
              <td className="px-4 py-2.5 font-medium">{formatINR(r.balance)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  if (type === 'expenses-salaries' && 'expenseRows' in data) {
    const d = data as Extract<AnyReport, { expenseRows: unknown[]; salaryRows: unknown[] }>;
    const expenseRows = (
      d.expenseRows as Array<{ category: string; amount: number; count: number; percent: number }>
    ).filter((r) => matchesSearch({ ...r, type: 'expense' }, search));
    const salaryRows = (
      d.salaryRows as Array<{ period: string; amount: number; count: number; percent: number }>
    ).filter((r) => matchesSearch({ ...r, type: 'salary' }, search));
    return (
      <table className="min-w-full text-sm">
        <thead className="bg-cream/60 text-left text-xs uppercase tracking-wider text-black/50">
          <tr>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Label</th>
            <th className="px-4 py-3">Amount</th>
            <th className="px-4 py-3">Count</th>
            <th className="px-4 py-3">%</th>
          </tr>
        </thead>
        <tbody>
          {expenseRows.map((r) => (
            <tr key={`e-${r.category}`} className="border-t border-black/8">
              <td className="px-4 py-2.5">Expense</td>
              <td className="px-4 py-2.5 capitalize">{r.category}</td>
              <td className="px-4 py-2.5">{formatINR(r.amount)}</td>
              <td className="px-4 py-2.5">{r.count}</td>
              <td className="px-4 py-2.5">{r.percent}%</td>
            </tr>
          ))}
          {salaryRows.map((r) => (
            <tr key={`s-${r.period}`} className="border-t border-black/8">
              <td className="px-4 py-2.5">Salary</td>
              <td className="px-4 py-2.5">{r.period}</td>
              <td className="px-4 py-2.5">{formatINR(r.amount)}</td>
              <td className="px-4 py-2.5">{r.count}</td>
              <td className="px-4 py-2.5">{r.percent}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  if (type === 'pnl' && 'summary' in data) {
    const s = (data as Extract<AnyReport, { summary: { revenue: number; netProfit: number } }>).summary;
    const rows = [
      { metric: 'Revenue (payments received)', amount: s.revenue },
      { metric: 'Expenses', amount: s.expenses },
      { metric: 'Salaries', amount: s.salaries },
      { metric: 'Net profit', amount: s.netProfit },
    ].filter((r) => matchesSearch(r, search));
    return (
      <table className="min-w-full text-sm">
        <thead className="bg-cream/60 text-left text-xs uppercase tracking-wider text-black/50">
          <tr>
            <th className="px-4 py-3">Metric</th>
            <th className="px-4 py-3">Amount</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.metric} className="border-t border-black/8">
              <td className="px-4 py-2.5">{r.metric}</td>
              <td className="px-4 py-2.5 font-medium">{formatINR(r.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  if (type === 'leads-conversion' && 'rows' in data) {
    const rows = (
      data.rows as Array<{
        source: string;
        leads: number;
        converted: number;
        conversionRate: number;
        percentOfLeads: number;
      }>
    ).filter((r) => matchesSearch(r, search));
    return (
      <table className="min-w-full text-sm">
        <thead className="bg-cream/60 text-left text-xs uppercase tracking-wider text-black/50">
          <tr>
            <th className="px-4 py-3">Source</th>
            <th className="px-4 py-3">Leads</th>
            <th className="px-4 py-3">Converted</th>
            <th className="px-4 py-3">Conversion %</th>
            <th className="px-4 py-3">% of leads</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.source} className="border-t border-black/8">
              <td className="px-4 py-2.5">{r.source}</td>
              <td className="px-4 py-2.5">{r.leads}</td>
              <td className="px-4 py-2.5">{r.converted}</td>
              <td className="px-4 py-2.5">{r.conversionRate}%</td>
              <td className="px-4 py-2.5">{r.percentOfLeads}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  if (type === 'staff-workload' && 'rows' in data) {
    const rows = (
      data.rows as Array<{ staffId: string; name: string; open: number; completed: number; total: number }>
    ).filter((r) => matchesSearch(r, search));
    return (
      <table className="min-w-full text-sm">
        <thead className="bg-cream/60 text-left text-xs uppercase tracking-wider text-black/50">
          <tr>
            <th className="px-4 py-3">Staff</th>
            <th className="px-4 py-3">Open</th>
            <th className="px-4 py-3">Completed</th>
            <th className="px-4 py-3">Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.staffId || r.name} className="border-t border-black/8">
              <td className="px-4 py-2.5">{r.name}</td>
              <td className="px-4 py-2.5">{r.open}</td>
              <td className="px-4 py-2.5">{r.completed}</td>
              <td className="px-4 py-2.5">{r.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  if (type === 'customer-repeat' && 'rows' in data) {
    const rows = (
      data.rows as Array<{
        customerId: string;
        customerName: string;
        ordersInPeriod: number;
        lifetimeOrders: number;
        segment: string;
      }>
    ).filter((r) => matchesSearch(r, search));
    return (
      <table className="min-w-full text-sm">
        <thead className="bg-cream/60 text-left text-xs uppercase tracking-wider text-black/50">
          <tr>
            <th className="px-4 py-3">Customer</th>
            <th className="px-4 py-3">Orders in period</th>
            <th className="px-4 py-3">Lifetime</th>
            <th className="px-4 py-3">Segment</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.customerId} className="border-t border-black/8">
              <td className="px-4 py-2.5">
                <Link to={`/admin/customers/${r.customerId}`} className="text-gold hover:underline">
                  {r.customerName}
                </Link>
              </td>
              <td className="px-4 py-2.5">{r.ordersInPeriod}</td>
              <td className="px-4 py-2.5">{r.lifetimeOrders}</td>
              <td className="px-4 py-2.5 capitalize">{r.segment}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  return <p className="p-4 text-sm text-black/50">No table for this report.</p>;
}
