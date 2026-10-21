import { memo } from 'react';
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
import { CHART_COLORS, CHART_REVENUE } from '@/theme/palettes';
import type { DashboardSummary } from '@/services/dashboard/dashboardService';

const TOOLTIP_STYLE = {
  backgroundColor: 'var(--admin-card)',
  border: '1px solid var(--admin-border)',
  borderRadius: '8px',
  color: 'var(--admin-card-text)',
  fontSize: '12px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
} as const;

/**
 * The four analytics panels, isolated from the rest of the dashboard.
 *
 * Recharts re-renders are expensive and the dashboard re-renders for reasons
 * that have nothing to do with these series — a live notification arriving, a
 * queue row expanding. `series` is a stable object on `summary`, so memoising
 * this subtree means a badge update no longer repaints four charts.
 */
export const DashboardCharts = memo(function DashboardCharts({
  series,
}: {
  series: DashboardSummary['series'];
}) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="rounded-xl border p-5 transition-colors shadow-xs bg-surface-raised border-line text-ink-raised">
        <div className="mb-2">
          <h3 className="text-sm font-semibold tracking-wide text-inherit">Monthly Leads Pipeline</h3>
          <p className="text-[11px] opacity-70">Tailoring & bridal enquiries volume</p>
        </div>
        <div className="h-[220px] w-full mt-4">
          {series.leadsByMonth.length === 0 ? (
            <div className="flex h-full items-center justify-center text-xs opacity-70">
              No lead data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={series.leadsByMonth} margin={{ left: -25, bottom: -5 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="currentColor"
                  opacity={0.08}
                />
                <XAxis
                  dataKey="month"
                  stroke="currentColor"
                  opacity={0.65}
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: 'currentColor', opacity: 0.2 }}
                />
                <YAxis
                  stroke="currentColor"
                  opacity={0.65}
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: 'currentColor', opacity: 0.2 }}
                />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Bar
                  dataKey="count"
                  name="Leads"
                  fill="var(--admin-primary)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={36}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="rounded-xl border p-5 transition-colors shadow-xs bg-surface-raised border-line text-ink-raised">
        <div className="mb-2">
          <h3 className="text-sm font-semibold tracking-wide text-inherit">
            Lead Channel Breakdown
          </h3>
          <p className="text-[11px] opacity-70">Referral & direct marketing touchpoints</p>
        </div>
        <div className="h-[220px] w-full mt-4">
          {series.leadsBySource.length === 0 ? (
            <div className="flex h-full items-center justify-center text-xs opacity-70">
              No source data available
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ bottom: -5 }}>
                <Pie
                  data={series.leadsBySource}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="count"
                  nameKey="source"
                >
                  {series.leadsBySource.map((_, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                      stroke="rgba(0,0,0,0.2)"
                    />
                  ))}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend
                  verticalAlign="bottom"
                  iconSize={8}
                  formatter={(value) => <span className="text-xs opacity-80">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="rounded-xl border p-5 transition-colors shadow-xs bg-surface-raised border-line text-ink-raised">
        <div className="mb-2">
          <h3 className="text-sm font-semibold tracking-wide text-inherit">Revenue Analytics</h3>
          <p className="text-[11px] opacity-70">Boutique income recognized by month</p>
        </div>
        <div className="h-[220px] w-full mt-4">
          {series.revenueByMonth.length === 0 ? (
            <div className="flex h-full items-center justify-center text-xs opacity-70">
              No payment data recorded
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={series.revenueByMonth} margin={{ left: -20, bottom: -5 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="currentColor"
                  opacity={0.08}
                />
                <XAxis
                  dataKey="month"
                  stroke="currentColor"
                  opacity={0.65}
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: 'currentColor', opacity: 0.2 }}
                />
                <YAxis
                  stroke="currentColor"
                  opacity={0.65}
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: 'currentColor', opacity: 0.2 }}
                />
                <Tooltip
                  contentStyle={TOOLTIP_STYLE}
                  formatter={(value) => [
                    `₹${Number(value ?? 0).toLocaleString('en-IN')}`,
                    'Revenue',
                  ]}
                />
                <Bar
                  dataKey="amount"
                  name="Revenue"
                  fill={CHART_REVENUE}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={36}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="rounded-xl border p-5 transition-colors shadow-xs bg-surface-raised border-line text-ink-raised">
        <div className="mb-2">
          <h3 className="text-sm font-semibold tracking-wide text-inherit">
            Workshop Production Mix
          </h3>
          <p className="text-[11px] opacity-70">Active orders by stage</p>
        </div>
        <div className="h-[220px] w-full mt-4">
          {series.ordersByStatus.length === 0 ? (
            <div className="flex h-full items-center justify-center text-xs opacity-70">
              No orders in production
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ bottom: -5 }}>
                <Pie
                  data={series.ordersByStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="count"
                  nameKey="status"
                >
                  {series.ordersByStatus.map((_, index) => (
                    <Cell
                      key={`ost-${index}`}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                      stroke="rgba(0,0,0,0.2)"
                    />
                  ))}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend
                  verticalAlign="bottom"
                  iconSize={8}
                  formatter={(value) => <span className="text-xs opacity-80">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
});
