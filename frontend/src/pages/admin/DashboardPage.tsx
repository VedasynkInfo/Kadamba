import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { AdminHorizonBanner } from './components/AdminHorizonBanner';
import { adminBanners } from './data';
import { dashboardApi, type DashboardSummary } from '@/services/dashboard/dashboardService';
import { useAdminNotifyOptional } from '@/hooks/useAdminNotifySocket';
import { Icon, type GlyphName } from '@/components/icons';
import { Spinner, Button, StatCard, StatusBadge, Table, type Column } from '@/components/ui';
import { cn } from '@/utils/cn';
import { buildAttentionQueue, formatAttentionValue } from './dashboard/attentionQueue';
import { CHART_COLORS, CHART_REVENUE } from '@/theme/palettes';

const QUICK_ACTIONS: { to: string; icon: GlyphName; label: string }[] = [
  { to: '/admin/services', icon: 'services', label: 'Add Service' },
  { to: '/admin/gallery', icon: 'gallery', label: 'Add Gallery' },
  { to: '/admin/portfolio', icon: 'portfolio', label: 'Add Project' },
  { to: '/admin/blogs', icon: 'blogs', label: 'New Post' },
  { to: '/admin/measurements', icon: 'measurements', label: 'New Fitting' },
  { to: '/admin/settings', icon: 'settings', label: 'Settings' },
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
    if (preset === '30days') from.setDate(to.getDate() - 30);
    else if (preset === '6months') from.setMonth(to.getMonth() - 6);
    else if (preset === '12months') from.setMonth(to.getMonth() - 12);
    else if (preset === 'ytd') { from.setMonth(0); from.setDate(1); }
    from.setHours(0, 0, 0, 0);
    to.setHours(23, 59, 59, 999);
    return { from: from.toISOString(), to: to.toISOString() };
  };

  useEffect(() => {
    let active = true;
    const loadSummary = async () => {
      setLoading(true); setError(null);
      try {
        const { from, to } = getRangeDates(datePreset);
        const data = await dashboardApi.getSummary(from, to);
        if (active) setSummary(data);
      } catch {
        if (active) setError('Could not connect to the boutique API. Check your connection or retry.');
      } finally {
        if (active) setLoading(false);
      }
    };
    void loadSummary();
    return () => { active = false; };
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

  const attention = summary ? buildAttentionQueue(summary) : [];

  const columns: Column<any>[] = [
    {
      key: 'name',
      label: 'Client',
      render: (row) => (
        <div>
          <Link to={`/admin/leads/${row.id}`} className="font-semibold text-inherit hover:underline transition block">
            {row.name}
          </Link>
          <span className="text-[10px] opacity-60 block font-mono mt-0.5">{row.phone}</span>
        </div>
      ),
    },
    { key: 'service', label: 'Interest', render: (row) => <span className="text-xs opacity-80">{row.service}</span> },
    { key: 'source', label: 'Source', render: (row) => <span className="text-xs opacity-65">{row.source}</span> },
    { key: 'status', label: 'Status', render: (row) => <StatusBadge value={row.status} kind="lead" /> },
    {
      key: 'createdAt',
      label: 'Date',
      className: 'text-right',
      render: (row) => <span className="text-xs opacity-60">{new Date(row.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>,
    },
  ];

  return (
    <div className="min-h-screen">
      <AdminHorizonBanner
        title={adminBanners.dashboard.title}
        copy={adminBanners.dashboard.copy}
        actionLabel={adminBanners.dashboard.actionLabel}
        actionTo={adminBanners.dashboard.actionTo}
      />

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 md:px-8 space-y-6">
        {/* Top Control Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-inherit">Console Workspace</h2>
            <p className="text-xs opacity-60">Real-time studio pulse & workshop intelligence</p>
          </div>

          <div
            className="flex rounded-lg p-1 border shadow-xs bg-surface-raised border-line"
          >
            {(['30days', '6months', '12months', 'ytd'] as const).map((preset) => {
              const label = preset === '30days' ? '30 Days' : preset === '6months' ? '6 Months' : preset === '12months' ? '12 Months' : 'YTD';
              const active = datePreset === preset;
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setDatePreset(preset)}
                  className={cn(
                    'px-3 py-1 text-xs font-semibold rounded-md transition-all',
                    active
                      ? 'bg-brand text-ink-on-brand shadow font-bold'
                      : 'opacity-70 hover:opacity-100 hover:bg-current/[0.06]'
                  )}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-[350px] flex-col items-center justify-center py-16">
            <Spinner size="lg" label="Syncing atelier metrics..." />
          </div>
        ) : error ? (
          <div
            className="flex min-h-[250px] flex-col items-center justify-center rounded-xl border p-8 text-center bg-surface-raised border-line text-ink-raised"
          >
            <p className="opacity-75 mb-4 text-sm">{error}</p>
            <Button variant="secondary" size="sm" onClick={() => setRetryTrigger((t) => t + 1)}>
              Retry Sync
            </Button>
          </div>
        ) : summary ? (
          <div className="space-y-6">
            {/* KPI Stat Cards */}
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              <StatCard
                label="Open Leads"
                value={summary.metrics.leadsOpen}
                href="/admin/leads/list"
                sub={`${summary.metrics.enquiriesPending} pending review`}
                icon="leads"
                sparkline={summary.series.leadsByMonth.map((point) => point.count)}
              />
              <StatCard
                label="Active Orders"
                value={summary.metrics.ordersActive ?? 0}
                href="/admin/orders"
                sub={`${summary.metrics.deliverablesDue ?? 0} with delivery dates`}
                icon="orders"
              />
              <StatCard
                label="Revenue (MTD)"
                value={`₹${Math.round(summary.metrics.revenueMtd ?? 0).toLocaleString('en-IN')}`}
                href="/admin/finance"
                sub={`Balance ₹${Math.round(summary.metrics.outstandingBalance ?? 0).toLocaleString('en-IN')}`}
                icon="revenue"
                tone="success"
                sparkline={summary.series.revenueByMonth.map((point) => point.amount)}
              />
              <StatCard
                label="Pending Fits"
                value={summary.metrics.pendingMeasurementApprovals ?? 0}
                href="/admin/measurements"
                sub="Measurement approvals"
                icon="measurements"
                tone="warning"
              />
            </div>

            {/* Quick Action Tiles */}
            <div
              className="rounded-xl border p-5 transition-colors shadow-xs bg-surface-raised border-line text-ink-raised"
            >
              <div
                className="flex items-center justify-between border-b pb-3 mb-4 border-line"
              >
                <div>
                  <h3 className="text-sm font-semibold tracking-wide text-inherit">Atelier Quick Actions</h3>
                  <p className="text-[11px] opacity-60">Instant studio publishing & client workflow shortcuts</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {QUICK_ACTIONS.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    className="flex flex-col items-center justify-center p-3 rounded-lg border border-current/10 bg-current/[0.02] text-center transition hover:border-brand hover:bg-current/[0.05] hover:shadow-xs text-inherit"
                  >
                    <span className="mb-1.5 text-brand">
                      <Icon name={item.icon} size={20} />
                    </span>
                    <span className="text-xs font-semibold text-inherit">{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Visual Analytics Bento Grid */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Monthly leads pipeline */}
              <div
                className="rounded-xl border p-5 transition-colors shadow-xs bg-surface-raised border-line text-ink-raised"
              >
                <div className="mb-2">
                  <h3 className="text-sm font-semibold tracking-wide text-inherit">Monthly Leads Pipeline</h3>
                  <p className="text-[11px] opacity-60">Tailoring & bridal enquiries volume</p>
                </div>
                <div className="h-[220px] w-full mt-4">
                  {summary.series.leadsByMonth.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-xs opacity-50">No lead data available</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={summary.series.leadsByMonth} margin={{ left: -25, bottom: -5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" opacity={0.08} />
                        <XAxis dataKey="month" stroke="currentColor" opacity={0.65} fontSize={11} tickLine={false} axisLine={{ stroke: 'currentColor', opacity: 0.2 }} />
                        <YAxis stroke="currentColor" opacity={0.65} fontSize={11} tickLine={false} axisLine={{ stroke: 'currentColor', opacity: 0.2 }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'var(--admin-card)',
                            border: '1px solid var(--admin-border)',
                            borderRadius: '8px',
                            color: 'var(--admin-card-text)',
                            fontSize: '12px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                          }}
                        />
                        <Bar dataKey="count" name="Leads" fill="var(--admin-primary)" radius={[4, 4, 0, 0]} maxBarSize={36} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Lead channel breakdown */}
              <div
                className="rounded-xl border p-5 transition-colors shadow-xs bg-surface-raised border-line text-ink-raised"
              >
                <div className="mb-2">
                  <h3 className="text-sm font-semibold tracking-wide text-inherit">Lead Channel Breakdown</h3>
                  <p className="text-[11px] opacity-60">Referral & direct marketing touchpoints</p>
                </div>
                <div className="h-[220px] w-full mt-4">
                  {summary.series.leadsBySource.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-xs opacity-50">No source data available</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart margin={{ bottom: -5 }}>
                        <Pie data={summary.series.leadsBySource} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="count" nameKey="source">
                          {summary.series.leadsBySource.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} stroke="rgba(0,0,0,0.2)" />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'var(--admin-card)',
                            border: '1px solid var(--admin-border)',
                            borderRadius: '8px',
                            color: 'var(--admin-card-text)',
                            fontSize: '12px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                          }}
                        />
                        <Legend verticalAlign="bottom" iconSize={8} formatter={(value) => <span className="text-xs opacity-80">{value}</span>} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Revenue analytics */}
              <div
                className="rounded-xl border p-5 transition-colors shadow-xs bg-surface-raised border-line text-ink-raised"
              >
                <div className="mb-2">
                  <h3 className="text-sm font-semibold tracking-wide text-inherit">Revenue Analytics</h3>
                  <p className="text-[11px] opacity-60">Boutique income recognized by month</p>
                </div>
                <div className="h-[220px] w-full mt-4">
                  {summary.series.revenueByMonth.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-xs opacity-50">No payment data recorded</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={summary.series.revenueByMonth} margin={{ left: -20, bottom: -5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" opacity={0.08} />
                        <XAxis dataKey="month" stroke="currentColor" opacity={0.65} fontSize={11} tickLine={false} axisLine={{ stroke: 'currentColor', opacity: 0.2 }} />
                        <YAxis stroke="currentColor" opacity={0.65} fontSize={11} tickLine={false} axisLine={{ stroke: 'currentColor', opacity: 0.2 }} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'var(--admin-card)',
                            border: '1px solid var(--admin-border)',
                            borderRadius: '8px',
                            color: 'var(--admin-card-text)',
                            fontSize: '12px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                          }}
                          formatter={(value) => [`₹${Number(value ?? 0).toLocaleString('en-IN')}`, 'Revenue']}
                        />
                        <Bar dataKey="amount" name="Revenue" fill={CHART_REVENUE} radius={[4, 4, 0, 0]} maxBarSize={36} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Atelier production mix */}
              <div
                className="rounded-xl border p-5 transition-colors shadow-xs bg-surface-raised border-line text-ink-raised"
              >
                <div className="mb-2">
                  <h3 className="text-sm font-semibold tracking-wide text-inherit">Workshop Production Mix</h3>
                  <p className="text-[11px] opacity-60">Active orders by stage</p>
                </div>
                <div className="h-[220px] w-full mt-4">
                  {summary.series.ordersByStatus.length === 0 ? (
                    <div className="flex h-full items-center justify-center text-xs opacity-50">No orders in production</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart margin={{ bottom: -5 }}>
                        <Pie data={summary.series.ordersByStatus} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="count" nameKey="status">
                          {summary.series.ordersByStatus.map((_, index) => (
                            <Cell key={`ost-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} stroke="rgba(0,0,0,0.2)" />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'var(--admin-card)',
                            border: '1px solid var(--admin-border)',
                            borderRadius: '8px',
                            color: 'var(--admin-card-text)',
                            fontSize: '12px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                          }}
                        />
                        <Legend verticalAlign="bottom" iconSize={8} formatter={(value) => <span className="text-xs opacity-80">{value}</span>} />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Section: Recent Consultations & the right-hand rail */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold tracking-wide text-inherit">Recent Consultations</h3>
                    <p className="text-[11px] opacity-60">Latest design enquiries from bespoke clientele</p>
                  </div>
                  <Link
                    to="/admin/leads/list"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
                  >
                    All Leads
                    <Icon name="arrowRight" size={14} />
                  </Link>
                </div>
                <Table
                  variant="admin"
                  columns={columns}
                  data={recentLeads}
                  rowKey={(r) => r.id}
                  emptyState={<div className="py-8 text-center text-xs opacity-50">No consultations recorded in this date range.</div>}
                />
              </div>

              <div className="space-y-6">
                <div className="rounded-2xl border p-5 shadow-xs transition-colors bg-surface-raised border-line text-ink-raised">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold tracking-wide text-inherit">
                        Needs attention
                      </h3>
                      <p className="text-[11px] opacity-60">
                        What is waiting on a person, not on a machine
                      </p>
                    </div>
                    {attention.length > 0 ? (
                      <span className="shrink-0 rounded-md bg-rose-500/15 px-2 py-0.5 text-[0.65rem] font-bold uppercase text-rose-400">
                        {attention.length} waiting
                      </span>
                    ) : null}
                  </div>

                  {attention.length === 0 ? (
                    <p className="py-6 text-center text-xs opacity-50">
                      Nothing is waiting. The studio is clear.
                    </p>
                  ) : (
                    <ul className="divide-y divide-current/[0.06]">
                      {attention.map((item) => (
                        <li key={item.id}>
                          <Link
                            to={item.to}
                            className="flex items-center gap-3 py-2.5 transition hover:bg-current/[0.03]"
                          >
                            <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-current/[0.06] text-ink/60">
                              <Icon name={item.icon} size={14} />
                            </span>
                            <span className="flex-1 truncate text-xs font-semibold">
                              {item.label}
                            </span>
                            <span className="text-sm font-bold tabular-nums">
                              {formatAttentionValue(item)}
                            </span>
                            <Icon name="arrowRight" size={14} className="opacity-40" />
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold tracking-wide text-inherit">Production Queue</h3>
                      <p className="text-[11px] opacity-60">Upcoming trials & client handovers</p>
                    </div>
                    <Link
                      to="/admin/orders"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline"
                    >
                      Orders
                      <Icon name="arrowRight" size={14} />
                    </Link>
                  </div>

                  <ul
                    className="divide-y rounded-xl border overflow-hidden shadow-xs bg-surface-raised border-line text-ink-raised"
                  >
                    {(summary.actionOrders || []).length === 0 ? (
                      <li className="px-4 py-8 text-center text-xs opacity-50">No open orders with delivery dates.</li>
                    ) : (
                      (summary.actionOrders || []).map((o) => (
                        <li
                          key={o.id}
                          className="transition hover:bg-current/[0.04] border-line"
                        >
                          <Link to={`/admin/orders/${o.id}`} className="block px-4 py-3 text-inherit">
                            <p className="font-semibold text-inherit text-xs truncate">{o.title}</p>
                            <p className="mt-0.5 text-[10px] opacity-60">
                              #{o.orderNumber} · {o.customerName}
                            </p>
                            {o.expectedDeliveryAt ? (
                              <span className="mt-1.5 inline-block rounded bg-brand/15 px-1.5 py-0.5 text-[10px] font-medium text-brand">
                                Due {new Date(o.expectedDeliveryAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                              </span>
                            ) : null}
                          </Link>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

