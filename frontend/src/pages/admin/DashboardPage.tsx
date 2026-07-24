import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
import { AdminHorizonBanner } from './components/AdminHorizonBanner';
import { adminBanners } from './data';
import { dashboardApi, type DashboardSummary } from '@/services/dashboard/dashboardService';
import { useAdminNotifyOptional } from '@/hooks/useAdminNotifySocket';
import { Spinner, Button } from '@/components/ui';
import { cn } from '@/utils/cn';

// Premium custom colors matching the Kadamba boutique brand (luxury black, gold, cream)
const COLORS = [
  '#000000', // Luxury Black
  '#b59410', // Rich Gold
  '#8a731e', // Medium Bronze
  '#4a3f12', // Dark Olive Gold
  '#c5a228', // Soft Gold
];

export default function AdminDashboardPage() {
  const [datePreset, setDatePreset] = useState<'30days' | '6months' | '12months' | 'ytd'>('12months');
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryTrigger, setRetryTrigger] = useState(0);
  const notify = useAdminNotifyOptional();

  const getRangeDates = (preset: typeof datePreset) => {
    const to = new Date();
    const from = new Date();
    if (preset === '30days') {
      from.setDate(to.getDate() - 30);
    } else if (preset === '6months') {
      from.setMonth(to.getMonth() - 6);
    } else if (preset === '12months') {
      from.setMonth(to.getMonth() - 12);
    } else if (preset === 'ytd') {
      from.setMonth(0);
      from.setDate(1);
    }
    from.setHours(0, 0, 0, 0);
    to.setHours(23, 59, 59, 999);
    return { from: from.toISOString(), to: to.toISOString() };
  };

  useEffect(() => {
    let active = true;
    const loadSummary = async () => {
      setLoading(true);
      setError(null);
      try {
        const { from, to } = getRangeDates(datePreset);
        const data = await dashboardApi.getSummary(from, to);
        if (active) {
          setSummary(data);
        }
      } catch (err: any) {
        console.error('Failed to fetch dashboard summary', err);
        if (active) {
          setError('Could not connect to the boutique API. Check your connection or retry.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadSummary();
    return () => {
      active = false;
    };
  }, [datePreset, retryTrigger]);

  useEffect(() => {
    if (!notify) return;
    return notify.onSoftRefresh((kinds) => {
      if (kinds.includes('dashboard') || kinds.includes('leads') || kinds.includes('orders')) {
        setRetryTrigger((t) => t + 1);
      }
    });
  }, [notify]);

  const recentLeads = summary?.recentLeads || [];

  return (
    <>
      <AdminHorizonBanner
        density="desk"
        title={adminBanners.dashboard.title}
        copy={adminBanners.dashboard.copy}
        actionLabel={adminBanners.dashboard.actionLabel}
        actionTo={adminBanners.dashboard.actionTo}
      />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:px-10">
        {/* Date Preset Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-black/10 pb-6 mb-8">
          <div>
            <h2 className="font-heading text-xl text-black">Console workspace</h2>
            <p className="text-xs text-black/55 mt-0.5">Real-time statistics & business pulse</p>
          </div>
          <div className="flex bg-cream border border-black/15 rounded-md p-1">
            {(['30days', '6months', '12months', 'ytd'] as const).map((preset) => {
              const label =
                preset === '30days'
                  ? 'Last 30 Days'
                  : preset === '6months'
                    ? '6 Months'
                    : preset === '12months'
                      ? '12 Months'
                      : 'Year to Date';
              return (
                <button
                  key={preset}
                  onClick={() => setDatePreset(preset)}
                  className={cn(
                    'px-3 py-1.5 text-xs font-medium rounded transition',
                    datePreset === preset
                      ? 'bg-black text-cream shadow-sm'
                      : 'text-black/60 hover:text-black hover:bg-black/[0.04]',
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-[400px] flex-col items-center justify-center py-20">
            <Spinner size="lg" label="Syncing metrics..." />
          </div>
        ) : error ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center rounded-lg border border-black/10 bg-cream/50 p-8 text-center">
            <p className="text-black/75 mb-4">{error}</p>
            <Button variant="secondary" onClick={() => setRetryTrigger((t) => t + 1)}>
              Retry sync
            </Button>
          </div>
        ) : summary ? (
          <div className="space-y-12 animate-fade-in-up">
            {/* Primary Metrics Row */}
            <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
              <div className="border-t border-black/15 pt-4">
                <Link to="/admin/leads/list" className="group block transition hover:opacity-85">
                  <p className="font-heading text-4xl text-black sm:text-5xl">
                    {summary.metrics.leadsOpen}
                  </p>
                  <p className="mt-2 text-xs uppercase tracking-[0.2em] font-semibold text-black/55 group-hover:text-black">
                    Open leads →
                  </p>
                  <p className="mt-2 text-xs text-black/45">
                    {summary.metrics.enquiriesPending} pending review
                  </p>
                </Link>
              </div>

              <div className="border-t border-black/15 pt-4">
                <Link to="/admin/orders" className="group block transition hover:opacity-85">
                  <p className="font-heading text-4xl text-black sm:text-5xl">
                    {summary.metrics.ordersActive ?? 0}
                  </p>
                  <p className="mt-2 text-xs uppercase tracking-[0.2em] font-semibold text-black/55 group-hover:text-black">
                    Active orders →
                  </p>
                  <p className="mt-2 text-xs text-black/45">
                    {summary.metrics.deliverablesDue ?? 0} with delivery dates
                  </p>
                </Link>
              </div>

              <div className="border-t border-black/15 pt-4">
                <Link to="/admin/finance" className="group block transition hover:opacity-85">
                  <p className="font-heading text-4xl text-black sm:text-5xl">
                    ₹{Math.round(summary.metrics.revenueMtd ?? 0).toLocaleString('en-IN')}
                  </p>
                  <p className="mt-2 text-xs uppercase tracking-[0.2em] font-semibold text-black/55 group-hover:text-black">
                    Revenue (MTD) →
                  </p>
                  <p className="mt-2 text-xs text-black/45">
                    Outstanding ₹
                    {Math.round(summary.metrics.outstandingBalance ?? 0).toLocaleString('en-IN')}
                  </p>
                </Link>
              </div>

              <div className="border-t border-black/15 pt-4">
                <Link to="/admin/measurements" className="group block transition hover:opacity-85">
                  <p className="font-heading text-4xl text-black sm:text-5xl">
                    {summary.metrics.pendingMeasurementApprovals ?? 0}
                  </p>
                  <p className="mt-2 text-xs uppercase tracking-[0.2em] font-semibold text-black/55 group-hover:text-black">
                    Pending fits →
                  </p>
                  <p className="mt-2 text-xs text-black/45">Measurement approvals waiting</p>
                </Link>
              </div>
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
              {/* Chart 1: Monthly Leads Trend */}
              <div className="rounded-lg border border-black/10 bg-cream p-6">
                <div className="mb-4">
                  <h3 className="font-heading text-lg text-black">Monthly leads pipeline</h3>
                  <p className="text-xs text-black/55 mt-0.5">Volume of tailoring enquiries received</p>
                </div>
                <div className="h-[250px] w-full mt-6">
                  {summary.series.leadsByMonth.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-sm text-black/45">
                      No lead data available for this range
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={summary.series.leadsByMonth} margin={{ left: -20, bottom: -10 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.06)" />
                        <XAxis
                          dataKey="month"
                          stroke="rgba(0,0,0,0.45)"
                          fontSize={11}
                          tickLine={false}
                          axisLine={{ stroke: 'rgba(0,0,0,0.1)' }}
                        />
                        <YAxis
                          stroke="rgba(0,0,0,0.45)"
                          fontSize={11}
                          tickLine={false}
                          axisLine={{ stroke: 'rgba(0,0,0,0.1)' }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#000000',
                            border: 'none',
                            borderRadius: '4px',
                            color: '#fffdd0',
                            fontSize: '12px',
                          }}
                        />
                        <Bar dataKey="count" name="Leads" fill="#b59410" radius={[2, 2, 0, 0]} maxBarSize={45} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Chart 2: Lead Sources mix */}
              <div className="rounded-lg border border-black/10 bg-cream p-6">
                <div className="mb-4">
                  <h3 className="font-heading text-lg text-black">Lead channel breakdown</h3>
                  <p className="text-xs text-black/55 mt-0.5">Customer referral & marketing sources</p>
                </div>
                <div className="h-[250px] w-full mt-6">
                  {summary.series.leadsBySource.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-sm text-black/45">
                      No source data available for this range
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart margin={{ bottom: -10 }}>
                        <Pie
                          data={summary.series.leadsBySource}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={3}
                          dataKey="count"
                          nameKey="source"
                        >
                          {summary.series.leadsBySource.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#000000',
                            border: 'none',
                            borderRadius: '4px',
                            color: '#fffdd0',
                            fontSize: '12px',
                          }}
                        />
                        <Legend
                          verticalAlign="bottom"
                          iconSize={10}
                          formatter={(value) => <span className="text-xs text-black/75">{value}</span>}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Chart 3: Revenue Trend */}
              <div className="rounded-lg border border-black/10 bg-cream p-6">
                <div className="mb-4">
                  <h3 className="font-heading text-lg text-black">Revenue analytics</h3>
                  <p className="text-xs text-black/55 mt-0.5">Boutique income by month</p>
                </div>
                <div className="h-[250px] w-full mt-6">
                  {summary.series.revenueByMonth.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-sm text-black/45">
                      No payment data for this range
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={summary.series.revenueByMonth} margin={{ left: -20, bottom: -10 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.06)" />
                        <XAxis
                          dataKey="month"
                          stroke="rgba(0,0,0,0.45)"
                          fontSize={11}
                          tickLine={false}
                          axisLine={{ stroke: 'rgba(0,0,0,0.1)' }}
                        />
                        <YAxis
                          stroke="rgba(0,0,0,0.45)"
                          fontSize={11}
                          tickLine={false}
                          axisLine={{ stroke: 'rgba(0,0,0,0.1)' }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#000000',
                            border: 'none',
                            borderRadius: '4px',
                            color: '#fffdd0',
                            fontSize: '12px',
                          }}
                          formatter={(value) => [`₹${Number(value ?? 0).toLocaleString('en-IN')}`, 'Revenue']}
                        />
                        <Bar dataKey="amount" name="Revenue" fill="#000000" radius={[2, 2, 0, 0]} maxBarSize={45} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Chart 4: Order Status mix */}
              <div className="rounded-lg border border-black/10 bg-cream p-6">
                <div className="mb-4">
                  <h3 className="font-heading text-lg text-black">Atelier production mix</h3>
                  <p className="text-xs text-black/55 mt-0.5">Garment orders by workshop phase</p>
                </div>
                <div className="h-[250px] w-full mt-6">
                  {summary.series.ordersByStatus.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-sm text-black/45">
                      No orders yet
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart margin={{ bottom: -10 }}>
                        <Pie
                          data={summary.series.ordersByStatus}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={3}
                          dataKey="count"
                          nameKey="status"
                        >
                          {summary.series.ordersByStatus.map((_, index) => (
                            <Cell key={`ost-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#000000',
                            border: 'none',
                            borderRadius: '4px',
                            color: '#fffdd0',
                            fontSize: '12px',
                          }}
                        />
                        <Legend
                          verticalAlign="bottom"
                          iconSize={10}
                          formatter={(value) => <span className="text-xs text-black/75">{value}</span>}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions Panel */}
            <div className="rounded-lg border border-black/10 bg-cream p-6">
              <div className="border-b border-black/5 pb-4 mb-6">
                <h3 className="font-heading text-lg text-black">Atelier actions</h3>
                <p className="text-xs text-black/55 mt-0.5">Instantly publish portfolio projects, edit services, or record client fittings</p>
              </div>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                <Link
                  to="/admin/services"
                  className="flex flex-col items-center justify-center p-4 rounded border border-black/10 bg-cream text-center transition hover:border-gold hover:shadow-sm"
                >
                  <span className="text-xl mb-2">✂️</span>
                  <span className="text-xs font-medium text-black">Add Service</span>
                </Link>
                <Link
                  to="/admin/gallery"
                  className="flex flex-col items-center justify-center p-4 rounded border border-black/10 bg-cream text-center transition hover:border-gold hover:shadow-sm"
                >
                  <span className="text-xl mb-2">📸</span>
                  <span className="text-xs font-medium text-black">Add Gallery</span>
                </Link>
                <Link
                  to="/admin/portfolio"
                  className="flex flex-col items-center justify-center p-4 rounded border border-black/10 bg-cream text-center transition hover:border-gold hover:shadow-sm"
                >
                  <span className="text-xl mb-2">✨</span>
                  <span className="text-xs font-medium text-black">Add Project</span>
                </Link>
                <Link
                  to="/admin/blogs"
                  className="flex flex-col items-center justify-center p-4 rounded border border-black/10 bg-cream text-center transition hover:border-gold hover:shadow-sm"
                >
                  <span className="text-xl mb-2">✍️</span>
                  <span className="text-xs font-medium text-black">Blog Post</span>
                </Link>
                <Link
                  to="/admin/measurements"
                  className="flex flex-col items-center justify-center p-4 rounded border border-black/10 bg-cream text-center transition hover:border-gold hover:shadow-sm"
                >
                  <span className="text-xl mb-2">📏</span>
                  <span className="text-xs font-medium text-black">New Fitting</span>
                </Link>
                <Link
                  to="/admin/settings"
                  className="flex flex-col items-center justify-center p-4 rounded border border-black/10 bg-cream text-center transition hover:border-gold hover:shadow-sm"
                >
                  <span className="text-xl mb-2">⚙️</span>
                  <span className="text-xs font-medium text-black">Settings</span>
                </Link>
              </div>
            </div>

            {/* Bottom Row: Recent Leads & Orders Stub */}
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
              {/* Recent Leads (Left/Middle column, takes 2/3 space) */}
              <div className="lg:col-span-2">
                <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
                  <div>
                    <h3 className="font-heading text-lg text-black">Recent consultations</h3>
                    <p className="text-xs text-black/55 mt-0.5">Most recent design consultation enquiries</p>
                  </div>
                  <Link to="/admin/leads/list" className="text-xs font-semibold hover:underline text-black">
                    View all leads →
                  </Link>
                </div>
                
                <div className="border border-black/10 rounded-md overflow-hidden bg-cream">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-black/10 bg-black/5 text-[0.65rem] uppercase tracking-wider text-black/60">
                          <th className="px-4 py-3 font-semibold">Client</th>
                          <th className="px-4 py-3 font-semibold">Interest</th>
                          <th className="px-4 py-3 font-semibold">Source</th>
                          <th className="px-4 py-3 font-semibold">Status</th>
                          <th className="px-4 py-3 font-semibold text-right">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black/5">
                        {recentLeads.map((lead) => (
                          <tr key={lead.id} className="hover:bg-black/[0.01] transition-colors">
                            <td className="px-4 py-3.5">
                              <Link to={`/admin/leads/${lead.id}`} className="font-medium text-black hover:underline block">
                                {lead.name}
                              </Link>
                              <span className="text-[10px] text-black/45 block mt-0.5">{lead.phone}</span>
                            </td>
                            <td className="px-4 py-3.5 text-xs text-black/75">
                              {lead.service}
                            </td>
                            <td className="px-4 py-3.5 text-xs text-black/70">
                              {lead.source}
                            </td>
                            <td className="px-4 py-3.5">
                              <span
                                className={cn(
                                  'inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium border',
                                  lead.status === 'New'
                                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                                    : lead.status === 'Completed'
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                      : lead.status === 'Rejected'
                                        ? 'bg-rose-50 text-rose-800 border-rose-200'
                                        : 'bg-blue-50 text-blue-800 border-blue-200',
                                )}
                              >
                                {lead.status}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-right text-xs text-black/45">
                              {new Date(lead.createdAt).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                              })}
                            </td>
                          </tr>
                        ))}
                        {recentLeads.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-4 py-8 text-center text-xs text-black/45">
                              No consultations recorded in this date range.
                            </td>
                          </tr>
                        ) : null}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Production queue */}
              <div>
                <div className="mb-6 flex items-end justify-between gap-2">
                  <div>
                    <h3 className="font-heading text-lg text-black">Production queue</h3>
                    <p className="text-xs text-black/55 mt-0.5">Upcoming trials & deliveries</p>
                  </div>
                  <Link to="/admin/orders" className="text-xs font-semibold hover:underline text-black">
                    Orders →
                  </Link>
                </div>

                <ul className="divide-y divide-black/5 border border-black/10 rounded-lg overflow-hidden bg-cream">
                  {(summary.actionOrders || []).length === 0 ? (
                    <li className="px-4 py-10 text-center text-xs text-black/45">
                      No open orders with delivery dates.
                    </li>
                  ) : (
                    (summary.actionOrders || []).map((o) => (
                      <li key={o.id}>
                        <Link
                          to={`/admin/orders/${o.id}`}
                          className="block px-4 py-3.5 transition hover:bg-black/[0.02]"
                        >
                          <p className="font-medium text-black text-sm">{o.title}</p>
                          <p className="mt-0.5 text-[10px] text-black/45">
                            #{o.orderNumber} · {o.customerName} · {o.status}
                          </p>
                          {o.expectedDeliveryAt ? (
                            <p className="mt-1 text-xs text-black/60">
                              Due{' '}
                              {new Date(o.expectedDeliveryAt).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                              })}
                            </p>
                          ) : null}
                        </Link>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}
