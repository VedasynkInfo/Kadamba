import mongoose from 'mongoose';
import { ApiError } from '../utils/ApiError';
import { Order } from '../models/Order';
import { Payment } from '../models/Payment';
import { Expense } from '../models/Expense';
import { SalaryPayment } from '../models/SalaryPayment';
import { Lead } from '../models/Lead';
import { Customer } from '../models/Customer';
import { getProfitLoss, getRevenueByProduct } from './financeService';

export const REPORT_TYPES = [
  'orders-by-status',
  'deliveries-trials',
  'revenue-trend',
  'revenue-by-product',
  'revenue-by-service',
  'outstanding',
  'expenses-salaries',
  'pnl',
  'leads-conversion',
  'staff-workload',
  'customer-repeat',
] as const;

export type ReportType = (typeof REPORT_TYPES)[number];

export type GroupBy = 'day' | 'week' | 'month';

const MAX_SPAN_MS = 36 * 30 * 24 * 60 * 60 * 1000; // ~36 months
const CONFIRMED_PLUS = [
  'confirmed',
  'measurements',
  'cutting',
  'stitching',
  'embroidery_maggam',
  'trial',
  'finishing',
  'delivery',
] as const;

function pct(part: number, total: number): number {
  if (!total) return 0;
  return Math.round((part / total) * 1000) / 10;
}

/** Parse and validate a required date range (max ~36 months). */
export function parseDateRange(from?: string, to?: string): { fromDate: Date; toDate: Date } {
  if (!from || !to) {
    throw new ApiError(400, 'from and to date parameters are required');
  }
  const fromDate = new Date(from);
  const toDate = new Date(to);
  if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
    throw new ApiError(400, 'from and to must be valid ISO8601 dates');
  }
  if (fromDate > toDate) {
    throw new ApiError(400, 'from must be before or equal to to');
  }
  if (toDate.getTime() - fromDate.getTime() > MAX_SPAN_MS) {
    throw new ApiError(400, 'Date range cannot exceed 36 months');
  }
  return { fromDate, toDate };
}

function rangeMeta(fromDate: Date, toDate: Date) {
  return { from: fromDate.toISOString(), to: toDate.toISOString() };
}

export async function getOrdersByStatus(from: string, to: string) {
  const { fromDate, toDate } = parseDateRange(from, to);
  const rows = await Order.aggregate<{ _id: string; count: number }>([
    { $match: { createdAt: { $gte: fromDate, $lte: toDate } } },
    { $group: { _id: '$status', count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
  const total = rows.reduce((s, r) => s + r.count, 0);
  return {
    range: rangeMeta(fromDate, toDate),
    definition: 'Orders created in the selected range, grouped by current status.',
    total,
    rows: rows.map((r) => ({
      status: r._id,
      count: r.count,
      percent: pct(r.count, total),
    })),
  };
}

export async function getDeliveriesTrials(from: string, to: string) {
  const { fromDate, toDate } = parseDateRange(from, to);
  const inRange = (field: string) => ({
    [field]: { $gte: fromDate, $lte: toDate },
  });

  const [expectedTrials, actualTrials, expectedDeliveries, actualDeliveries] = await Promise.all([
    Order.countDocuments(inRange('expectedTrialAt')),
    Order.countDocuments(inRange('actualTrialAt')),
    Order.countDocuments(inRange('expectedDeliveryAt')),
    Order.countDocuments(inRange('actualDeliveryAt')),
  ]);

  const sample = await Order.find({
    $or: [
      inRange('expectedTrialAt'),
      inRange('actualTrialAt'),
      inRange('expectedDeliveryAt'),
      inRange('actualDeliveryAt'),
    ],
  })
    .select('orderNumber title status expectedTrialAt actualTrialAt expectedDeliveryAt actualDeliveryAt customerId')
    .sort({ expectedDeliveryAt: 1 })
    .limit(100)
    .lean();

  return {
    range: rangeMeta(fromDate, toDate),
    definition: 'Trial and delivery dates (expected or actual) falling in the selected range.',
    summary: {
      expectedTrials,
      actualTrials,
      expectedDeliveries,
      actualDeliveries,
    },
    rows: sample.map((o) => ({
      orderId: String(o._id),
      orderNumber: o.orderNumber,
      title: o.title,
      status: o.status,
      expectedTrialAt: o.expectedTrialAt?.toISOString() ?? null,
      actualTrialAt: o.actualTrialAt?.toISOString() ?? null,
      expectedDeliveryAt: o.expectedDeliveryAt?.toISOString() ?? null,
      actualDeliveryAt: o.actualDeliveryAt?.toISOString() ?? null,
    })),
  };
}

function dateFormatForGroupBy(groupBy: GroupBy): string {
  if (groupBy === 'day') return '%Y-%m-%d';
  if (groupBy === 'week') return '%G-W%V';
  return '%Y-%m';
}

export async function getRevenueTrend(from: string, to: string, groupBy: GroupBy = 'month') {
  const { fromDate, toDate } = parseDateRange(from, to);
  const format = dateFormatForGroupBy(groupBy);

  const rows = await Payment.aggregate<{ _id: string; amount: number; count: number }>([
    { $match: { paidAt: { $gte: fromDate, $lte: toDate } } },
    {
      $group: {
        _id: { $dateToString: { format, date: '$paidAt' } },
        amount: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const total = rows.reduce((s, r) => s + r.amount, 0);

  return {
    range: rangeMeta(fromDate, toDate),
    groupBy,
    definition: 'Revenue = sum of customer payments received in range.',
    total,
    rows: rows.map((r) => ({
      period: r._id,
      amount: r.amount,
      paymentCount: r.count,
      percent: pct(r.amount, total),
    })),
  };
}

export async function getRevenueByProductReport(from: string, to: string) {
  const { fromDate, toDate } = parseDateRange(from, to);
  const productRows = await getRevenueByProduct(from, to);

  // Enrich with distinct order counts per product code in range
  const payments = await Payment.find({ paidAt: { $gte: fromDate, $lte: toDate } })
    .populate({ path: 'orderId', select: 'lineItems' })
    .lean();

  const orderSets: Record<string, Set<string>> = {};
  for (const pay of payments) {
    const order = pay.orderId as { _id?: unknown; lineItems?: Array<{ productTypeCode?: string; name?: string }> } | null;
    if (!order || !order.lineItems?.length) {
      const key = 'Unclassified';
      if (!orderSets[key]) orderSets[key] = new Set();
      if (order && (order as { _id?: unknown })._id) {
        orderSets[key].add(String((order as { _id: unknown })._id));
      }
      continue;
    }
    const primary = order.lineItems[0];
    const key = primary.productTypeCode || primary.name || 'Unclassified';
    if (!orderSets[key]) orderSets[key] = new Set();
    orderSets[key].add(String((order as { _id: unknown })._id));
  }

  const total = productRows.reduce((s, r) => s + r.value, 0);

  // Outstanding on open orders attributed by primary line item
  const openOrders = await Order.find({ status: { $nin: ['delivery', 'cancelled'] } })
    .select('lineItems paymentSummary')
    .lean();
  const outstandingByKey: Record<string, number> = {};
  for (const o of openOrders) {
    const primary = o.lineItems?.[0];
    const key = primary?.productTypeCode || primary?.name || 'Unclassified';
    outstandingByKey[key] = (outstandingByKey[key] || 0) + (o.paymentSummary?.balance || 0);
  }

  return {
    range: rangeMeta(fromDate, toDate),
    definition: 'Revenue = payments received, attributed to primary product type on the order.',
    total,
    rows: productRows.map((r) => ({
      productCode: r.name,
      productName: r.name,
      ordersCount: orderSets[r.name]?.size || 0,
      grossPayments: r.value,
      outstanding: outstandingByKey[r.name] || 0,
      percent: pct(r.value, total),
    })),
  };
}

export async function getRevenueByServiceReport(from: string, to: string) {
  const { fromDate, toDate } = parseDateRange(from, to);
  const payments = await Payment.find({ paidAt: { $gte: fromDate, $lte: toDate } })
    .populate({ path: 'orderId', select: 'lineItems' })
    .lean();

  const breakdown: Record<string, { amount: number; orders: Set<string>; name: string }> = {};

  for (const pay of payments) {
    const order = pay.orderId as {
      _id?: unknown;
      lineItems?: Array<{ serviceId?: string; name?: string }>;
    } | null;
    if (!order || !order.lineItems?.length) {
      const key = 'Unclassified';
      if (!breakdown[key]) breakdown[key] = { amount: 0, orders: new Set(), name: key };
      breakdown[key].amount += pay.amount;
      continue;
    }
    const primary = order.lineItems[0];
    const key = primary.serviceId || primary.name || 'Unclassified';
    if (!breakdown[key]) {
      breakdown[key] = { amount: 0, orders: new Set(), name: primary.name || key };
    }
    breakdown[key].amount += pay.amount;
    if (order._id) breakdown[key].orders.add(String(order._id));
  }

  const total = Object.values(breakdown).reduce((s, r) => s + r.amount, 0);
  const rows = Object.entries(breakdown)
    .map(([serviceId, v]) => ({
      serviceId,
      serviceName: v.name,
      ordersCount: v.orders.size,
      grossPayments: v.amount,
      percent: pct(v.amount, total),
    }))
    .sort((a, b) => b.grossPayments - a.grossPayments);

  return {
    range: rangeMeta(fromDate, toDate),
    definition: 'Revenue = payments received, attributed to primary service on the order.',
    total,
    rows,
  };
}

export async function getOutstandingReport(asOf?: string) {
  const asOfDate = asOf ? new Date(asOf) : new Date();
  if (Number.isNaN(asOfDate.getTime())) {
    throw new ApiError(400, 'asOf must be a valid ISO8601 date');
  }

  const openOrders = await Order.find({
    status: { $nin: ['delivery', 'cancelled'] },
    createdAt: { $lte: asOfDate },
  })
    .populate('customerId', 'name phone')
    .select('orderNumber title status paymentSummary customerId createdAt')
    .sort({ 'paymentSummary.balance': -1 })
    .lean();

  const rows = openOrders.map((o) => {
    const customer = o.customerId as { _id?: unknown; name?: string; phone?: string } | null;
    return {
      orderId: String(o._id),
      orderNumber: o.orderNumber,
      title: o.title,
      status: o.status,
      customerId: customer?._id ? String(customer._id) : null,
      customerName: customer?.name || '—',
      totalQuoted: o.paymentSummary?.totalQuoted || 0,
      advance: o.paymentSummary?.advance || 0,
      totalPaid: o.paymentSummary?.totalPaid || 0,
      balance: o.paymentSummary?.balance || 0,
    };
  });

  const totalOutstanding = rows.reduce((s, r) => s + r.balance, 0);
  const totalAdvances = rows.reduce((s, r) => s + r.advance, 0);

  return {
    asOf: asOfDate.toISOString(),
    definition: 'Outstanding = quoted total − paid on open orders (status not delivery or cancelled).',
    summary: {
      openOrders: rows.length,
      totalOutstanding,
      totalAdvances,
    },
    rows,
  };
}

export async function getExpensesSalariesReport(from: string, to: string) {
  const { fromDate, toDate } = parseDateRange(from, to);

  const [expensesByCategory, salariesMonthly, expensesSum, salariesSum] = await Promise.all([
    Expense.aggregate<{ _id: string; amount: number; count: number }>([
      { $match: { spentAt: { $gte: fromDate, $lte: toDate } } },
      { $group: { _id: '$category', amount: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { amount: -1 } },
    ]),
    SalaryPayment.aggregate<{ _id: string; amount: number; count: number }>([
      { $match: { paidAt: { $gte: fromDate, $lte: toDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m', date: '$paidAt' } },
          amount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Expense.aggregate([{ $match: { spentAt: { $gte: fromDate, $lte: toDate } } }, { $group: { _id: null, sum: { $sum: '$amount' } } }]),
    SalaryPayment.aggregate([{ $match: { paidAt: { $gte: fromDate, $lte: toDate } } }, { $group: { _id: null, sum: { $sum: '$amount' } } }]),
  ]);

  const totalExpenses = expensesSum[0]?.sum || 0;
  const totalSalaries = salariesSum[0]?.sum || 0;

  return {
    range: rangeMeta(fromDate, toDate),
    definition: 'Studio expenses and staff salary payments recorded in range.',
    summary: {
      totalExpenses,
      totalSalaries,
      totalOutflow: totalExpenses + totalSalaries,
    },
    expenseRows: expensesByCategory.map((r) => ({
      category: r._id,
      amount: r.amount,
      count: r.count,
      percent: pct(r.amount, totalExpenses),
    })),
    salaryRows: salariesMonthly.map((r) => ({
      period: r._id,
      amount: r.amount,
      count: r.count,
      percent: pct(r.amount, totalSalaries),
    })),
  };
}

export async function getPnlReport(from: string, to: string) {
  parseDateRange(from, to);
  const pnl = await getProfitLoss(from, to);
  return {
    ...pnl,
    definition: 'P&L = payments received − expenses − salaries (same as Finance module).',
  };
}

export async function getLeadsConversionReport(from: string, to: string) {
  const { fromDate, toDate } = parseDateRange(from, to);

  const leads = await Lead.find({ createdAt: { $gte: fromDate, $lte: toDate } })
    .select('_id source status')
    .lean();

  const leadIds = leads.map((l) => l._id);
  const convertedOrders = await Order.find({
    leadId: { $in: leadIds },
    status: { $in: [...CONFIRMED_PLUS] },
  })
    .select('leadId')
    .lean();

  const convertedLeadIds = new Set(convertedOrders.map((o) => String(o.leadId)));

  const bySource: Record<string, { leads: number; converted: number }> = {};
  for (const lead of leads) {
    const source = lead.source || 'Unknown';
    if (!bySource[source]) bySource[source] = { leads: 0, converted: 0 };
    bySource[source].leads += 1;
    if (convertedLeadIds.has(String(lead._id))) {
      bySource[source].converted += 1;
    }
  }

  const totalLeads = leads.length;
  const totalConverted = convertedLeadIds.size;

  const rows = Object.entries(bySource)
    .map(([source, v]) => ({
      source,
      leads: v.leads,
      converted: v.converted,
      conversionRate: pct(v.converted, v.leads),
      percentOfLeads: pct(v.leads, totalLeads),
    }))
    .sort((a, b) => b.leads - a.leads);

  return {
    range: rangeMeta(fromDate, toDate),
    definition: 'Conversion = leads created in range that have a linked order at confirmed or later.',
    summary: {
      totalLeads,
      totalConverted,
      conversionRate: pct(totalConverted, totalLeads),
    },
    rows,
  };
}

export async function getStaffWorkloadReport(from: string, to: string) {
  const { fromDate, toDate } = parseDateRange(from, to);

  const orders = await Order.find({
    createdAt: { $gte: fromDate, $lte: toDate },
    'assignedStaff.0': { $exists: true },
  })
    .select('status assignedStaff actualDeliveryAt orderNumber title')
    .lean();

  type Bucket = {
    staffId: string;
    name: string;
    open: number;
    completed: number;
    total: number;
  };
  const map: Record<string, Bucket> = {};

  for (const order of orders) {
    const completed = order.status === 'delivery' || Boolean(order.actualDeliveryAt);
    for (const staff of order.assignedStaff || []) {
      const key = staff.staffId || staff.name;
      if (!map[key]) {
        map[key] = { staffId: staff.staffId || '', name: staff.name, open: 0, completed: 0, total: 0 };
      }
      map[key].total += 1;
      if (completed) map[key].completed += 1;
      else map[key].open += 1;
    }
  }

  const rows = Object.values(map).sort((a, b) => b.total - a.total);

  return {
    range: rangeMeta(fromDate, toDate),
    definition: 'Orders created in range grouped by assigned staff (open vs completed/delivered).',
    summary: {
      staffCount: rows.length,
      ordersWithStaff: orders.length,
    },
    rows,
  };
}

export async function getCustomerRepeatReport(from: string, to: string) {
  const { fromDate, toDate } = parseDateRange(from, to);

  const ordersInRange = await Order.find({
    createdAt: { $gte: fromDate, $lte: toDate },
    status: { $ne: 'cancelled' },
  })
    .select('customerId createdAt')
    .lean();

  const customerIdsInRange = [...new Set(ordersInRange.map((o) => String(o.customerId)))];
  const objectIds = customerIdsInRange
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
    .map((id) => new mongoose.Types.ObjectId(id));

  const lifetimeByCustomer = await Order.aggregate<{ _id: unknown; count: number }>([
    { $match: { customerId: { $in: objectIds }, status: { $ne: 'cancelled' } } },
    { $group: { _id: '$customerId', count: { $sum: 1 } } },
  ]);

  const customers = await Customer.find({ _id: { $in: objectIds } })
    .select('name phone')
    .lean();

  const nameById = new Map(customers.map((c) => [String(c._id), c.name]));
  const countById = new Map(lifetimeByCustomer.map((c) => [String(c._id), c.count]));

  let newCustomers = 0;
  let returningCustomers = 0;

  const rows = customerIdsInRange.map((id) => {
    const lifetimeOrders = countById.get(id) || 1;
    const isReturning = lifetimeOrders >= 2;
    if (isReturning) returningCustomers += 1;
    else newCustomers += 1;
    const ordersInPeriod = ordersInRange.filter((o) => String(o.customerId) === id).length;
    return {
      customerId: id,
      customerName: nameById.get(id) || '—',
      ordersInPeriod,
      lifetimeOrders,
      segment: isReturning ? 'returning' : 'new',
    };
  });

  const total = customerIdsInRange.length;

  return {
    range: rangeMeta(fromDate, toDate),
    definition: 'Returning = customers with 2+ lifetime non-cancelled orders who ordered in range.',
    summary: {
      customersInPeriod: total,
      newCustomers,
      returningCustomers,
      repeatRate: pct(returningCustomers, total),
    },
    rows: rows.sort((a, b) => b.lifetimeOrders - a.lifetimeOrders),
  };
}

/** Dispatch a report by type and return structured data. */
export async function runReport(
  type: ReportType,
  params: { from?: string; to?: string; asOf?: string; groupBy?: GroupBy },
) {
  switch (type) {
    case 'orders-by-status':
      return getOrdersByStatus(params.from!, params.to!);
    case 'deliveries-trials':
      return getDeliveriesTrials(params.from!, params.to!);
    case 'revenue-trend':
      return getRevenueTrend(params.from!, params.to!, params.groupBy || 'month');
    case 'revenue-by-product':
      return getRevenueByProductReport(params.from!, params.to!);
    case 'revenue-by-service':
      return getRevenueByServiceReport(params.from!, params.to!);
    case 'outstanding':
      return getOutstandingReport(params.asOf);
    case 'expenses-salaries':
      return getExpensesSalariesReport(params.from!, params.to!);
    case 'pnl':
      return getPnlReport(params.from!, params.to!);
    case 'leads-conversion':
      return getLeadsConversionReport(params.from!, params.to!);
    case 'staff-workload':
      return getStaffWorkloadReport(params.from!, params.to!);
    case 'customer-repeat':
      return getCustomerRepeatReport(params.from!, params.to!);
    default:
      throw new ApiError(400, `Unknown report type: ${type}`);
  }
}

function csvEscape(value: unknown): string {
  const s = value == null ? '' : String(value);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function rowsToCsv(headers: string[], rows: Record<string, unknown>[]): string {
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map((h) => csvEscape(row[h])).join(','));
  }
  return lines.join('\n');
}

/** Build CSV string for a report type. */
export async function exportReportCsv(
  type: ReportType,
  params: { from?: string; to?: string; asOf?: string; groupBy?: GroupBy },
): Promise<{ filename: string; csv: string }> {
  const data = await runReport(type, params);

  let headers: string[] = [];
  let tableRows: Record<string, unknown>[] = [];

  switch (type) {
    case 'orders-by-status':
      headers = ['status', 'count', 'percent'];
      tableRows = (data as Awaited<ReturnType<typeof getOrdersByStatus>>).rows;
      break;
    case 'deliveries-trials':
      headers = [
        'orderNumber',
        'title',
        'status',
        'expectedTrialAt',
        'actualTrialAt',
        'expectedDeliveryAt',
        'actualDeliveryAt',
      ];
      tableRows = (data as Awaited<ReturnType<typeof getDeliveriesTrials>>).rows;
      break;
    case 'revenue-trend':
      headers = ['period', 'amount', 'paymentCount', 'percent'];
      tableRows = (data as Awaited<ReturnType<typeof getRevenueTrend>>).rows;
      break;
    case 'revenue-by-product':
      headers = ['productCode', 'productName', 'ordersCount', 'grossPayments', 'outstanding', 'percent'];
      tableRows = (data as Awaited<ReturnType<typeof getRevenueByProductReport>>).rows;
      break;
    case 'revenue-by-service':
      headers = ['serviceId', 'serviceName', 'ordersCount', 'grossPayments', 'percent'];
      tableRows = (data as Awaited<ReturnType<typeof getRevenueByServiceReport>>).rows;
      break;
    case 'outstanding':
      headers = [
        'orderNumber',
        'title',
        'status',
        'customerName',
        'totalQuoted',
        'advance',
        'totalPaid',
        'balance',
      ];
      tableRows = (data as Awaited<ReturnType<typeof getOutstandingReport>>).rows;
      break;
    case 'expenses-salaries': {
      const d = data as Awaited<ReturnType<typeof getExpensesSalariesReport>>;
      headers = ['type', 'label', 'amount', 'count', 'percent'];
      tableRows = [
        ...d.expenseRows.map((r) => ({
          type: 'expense',
          label: r.category,
          amount: r.amount,
          count: r.count,
          percent: r.percent,
        })),
        ...d.salaryRows.map((r) => ({
          type: 'salary',
          label: r.period,
          amount: r.amount,
          count: r.count,
          percent: r.percent,
        })),
      ];
      break;
    }
    case 'pnl': {
      const d = data as Awaited<ReturnType<typeof getPnlReport>>;
      headers = ['metric', 'amount'];
      tableRows = [
        { metric: 'revenue', amount: d.summary.revenue },
        { metric: 'expenses', amount: d.summary.expenses },
        { metric: 'salaries', amount: d.summary.salaries },
        { metric: 'netProfit', amount: d.summary.netProfit },
      ];
      break;
    }
    case 'leads-conversion':
      headers = ['source', 'leads', 'converted', 'conversionRate', 'percentOfLeads'];
      tableRows = (data as Awaited<ReturnType<typeof getLeadsConversionReport>>).rows;
      break;
    case 'staff-workload':
      headers = ['staffId', 'name', 'open', 'completed', 'total'];
      tableRows = (data as Awaited<ReturnType<typeof getStaffWorkloadReport>>).rows;
      break;
    case 'customer-repeat':
      headers = ['customerId', 'customerName', 'ordersInPeriod', 'lifetimeOrders', 'segment'];
      tableRows = (data as Awaited<ReturnType<typeof getCustomerRepeatReport>>).rows;
      break;
    default:
      throw new ApiError(400, `Unknown report type: ${type}`);
  }

  return {
    filename: `${type}-${new Date().toISOString().slice(0, 10)}.csv`,
    csv: rowsToCsv(headers, tableRows),
  };
}
