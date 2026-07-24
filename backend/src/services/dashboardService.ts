import { Lead } from '../models/Lead';
import { MeasurementProfile } from '../models/MeasurementProfile';
import { Order } from '../models/Order';
import { Payment } from '../models/Payment';
import { serializeLead, type LeadDto } from './leadService';

export interface DashboardSummaryDto {
  range: {
    from: string;
    to: string;
  };
  metrics: {
    leadsOpen: number;
    enquiriesPending: number;
    ordersActive: number | null;
    deliverablesDue: number | null;
    revenueMtd: number | null;
    outstandingBalance: number | null;
    pendingMeasurementApprovals: number;
  };
  series: {
    leadsByMonth: Array<{ month: string; count: number }>;
    revenueByMonth: Array<{ month: string; amount: number }>;
    ordersByStatus: Array<{ status: string; count: number }>;
    leadsBySource: Array<{ source: string; count: number }>;
    visitors: Array<{ date: string; count: number }> | null;
  };
  recentLeads: LeadDto[];
  actionOrders: any[];
}

/**
 * Fetch aggregated dashboard metrics and trends, using live database stats for all modules.
 */
export async function getDashboardSummary(from?: string, to?: string): Promise<DashboardSummaryDto> {
  const toDate = to ? new Date(to) : new Date();
  let fromDate: Date;
  
  if (from) {
    fromDate = new Date(from);
  } else {
    // Default to last 12 months
    fromDate = new Date();
    fromDate.setFullYear(toDate.getFullYear() - 1);
  }

  // Ensure valid date ranges
  if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
    throw new Error('Invalid date parameters');
  }

  // 1. Calculate active/open metrics for Leads
  const [leadsOpen, enquiriesPending] = await Promise.all([
    Lead.countDocuments({
      createdAt: { $gte: fromDate, $lte: toDate },
      status: { $nin: ['Completed', 'Rejected'] },
    }),
    Lead.countDocuments({
      createdAt: { $gte: fromDate, $lte: toDate },
      status: { $in: ['New', 'Contacted'] },
    }),
  ]);

  // 2. Fetch Recent Leads (latest 5 within range, sorted by createdAt desc)
  const recentDocs = await Lead.find({
    createdAt: { $gte: fromDate, $lte: toDate },
  })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  const recentLeads = recentDocs.map((doc) => serializeLead(doc));

  // 3. Aggregate Monthly Lead Trends
  const monthlyAgg = await Lead.aggregate([
    {
      $match: {
        createdAt: { $gte: fromDate, $lte: toDate },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
        count: { $sum: 1 },
      },
    },
    {
      $sort: { _id: 1 },
    },
  ]);

  const leadsByMonth = monthlyAgg.map((item) => ({
    month: item._id as string,
    count: item.count as number,
  }));

  // 4. Aggregate Lead Sources Mix
  const sourceAgg = await Lead.aggregate([
    {
      $match: {
        createdAt: { $gte: fromDate, $lte: toDate },
      },
    },
    {
      $group: {
        _id: '$source',
        count: { $sum: 1 },
      },
    },
    {
      $sort: { count: -1 },
    },
  ]);

  const leadsBySource = sourceAgg.map((item) => ({
    source: (item._id || 'Unknown') as string,
    count: item.count as number,
  }));

  // 5. Connect Orders and Finance Modules
  const [ordersActive, deliverablesDue] = await Promise.all([
    Order.countDocuments({ status: { $nin: ['delivery', 'cancelled'] } }),
    Order.countDocuments({
      status: { $nin: ['delivery', 'cancelled'] },
      expectedDeliveryAt: { $exists: true, $ne: null },
    }),
  ]);

  // Outstanding Balance
  const activeOrders = await Order.find({ status: { $nin: ['delivery', 'cancelled'] } });
  const outstandingBalance = activeOrders.reduce((sum, o) => sum + (o.paymentSummary?.balance || 0), 0);

  // Revenue Month-To-Date (MTD)
  const mtdStart = new Date();
  mtdStart.setDate(1);
  mtdStart.setHours(0, 0, 0, 0);
  const mtdEnd = new Date();
  const mtdSumAgg = await Payment.aggregate([
    { $match: { paidAt: { $gte: mtdStart, $lte: mtdEnd } } },
    { $group: { _id: null, sum: { $sum: '$amount' } } },
  ]);
  const revenueMtd = mtdSumAgg[0]?.sum || 0;

  // Revenue By Month Series
  const revenueAgg = await Payment.aggregate([
    {
      $match: {
        paidAt: { $gte: fromDate, $lte: toDate },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m', date: '$paidAt' } },
        amount: { $sum: '$amount' },
      },
    },
    {
      $sort: { _id: 1 },
    },
  ]);

  const revenueByMonth = revenueAgg.map((item) => ({
    month: item._id as string,
    amount: item.amount as number,
  }));

  // Orders By Status Series
  const ordersStatusAgg = await Order.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
      },
    },
  ]);

  const ordersByStatus = ordersStatusAgg.map((item) => ({
    status: item._id as string,
    count: item.count as number,
  }));

  // Recent Action Orders (latest 5 open orders sorted by delivery urgency)
  const actionOrdersDocs = await Order.find({ status: { $nin: ['delivery', 'cancelled'] } })
    .sort({ expectedDeliveryAt: 1 })
    .limit(5)
    .populate('customerId', 'name phone')
    .lean();

  const actionOrders = actionOrdersDocs.map((o) => ({
    id: o._id.toString(),
    orderNumber: o.orderNumber,
    title: o.title,
    status: o.status,
    customerName: (o.customerId as any)?.name || 'Unknown',
    expectedDeliveryAt: o.expectedDeliveryAt ? o.expectedDeliveryAt.toISOString() : undefined,
  }));

  const pendingMeasurementApprovals = await MeasurementProfile.countDocuments({
    status: 'pending_approval',
  });

  return {
    range: {
      from: fromDate.toISOString(),
      to: toDate.toISOString(),
    },
    metrics: {
      leadsOpen,
      enquiriesPending,
      ordersActive,
      deliverablesDue,
      revenueMtd,
      outstandingBalance,
      pendingMeasurementApprovals,
    },
    series: {
      leadsByMonth,
      revenueByMonth,
      ordersByStatus,
      leadsBySource,
      visitors: null,
    },
    recentLeads,
    actionOrders,
  };
}
