import mongoose from 'mongoose';
import { Payment, IPayment, PaymentMethod } from '../models/Payment';
import { Expense, IExpense, ExpenseCategory } from '../models/Expense';
import { SalaryPayment, ISalaryPayment } from '../models/SalaryPayment';
import { Order } from '../models/Order';
import { Staff } from '../models/Staff';
import { ApiError } from '../utils/ApiError';
import { toDto } from '../utils/serialize';
import { parsePagination, buildPaginationMeta } from '../utils/pagination';
import {
  computeBillStatus,
  formatInvoiceNumber,
  getInvoiceDetail,
} from './invoiceService';

export { getInvoiceDetail } from './invoiceService';

export interface RecordPaymentInput {
  orderId: string;
  amount: number;
  method: PaymentMethod;
  paidAt?: string | Date;
  reference?: string;
  notes?: string;
  recordedBy: string;
  bypassBalanceCheck?: boolean;
}

export interface CreateExpenseInput {
  title: string;
  category: ExpenseCategory;
  amount: number;
  spentAt: string | Date;
  notes?: string;
  attachmentUrl?: string;
  createdBy: string;
}

export interface RecordSalaryInput {
  staffId: string;
  year: number;
  month: number;
  amount: number;
  paidAt: string | Date;
  notes?: string;
  createdBy: string;
}

export async function recordPayment(input: RecordPaymentInput) {
  const order = await Order.findById(input.orderId);
  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  // Calculate current total paid from database to avoid caching issues
  const existingPayments = await Payment.find({ orderId: order._id });
  const currentPaidSum = existingPayments.reduce((sum, p) => sum + p.amount, 0);

  const remaining = order.paymentSummary.totalQuoted - currentPaidSum;
  if (input.amount > remaining && !input.bypassBalanceCheck) {
    throw new ApiError(400, 'Payment exceeds remaining balance', {
      remaining,
      message: `Payment amount ₹${input.amount} exceeds the remaining balance ₹${remaining}. Please confirm override if intended.`,
    });
  }

  const payment = new Payment({
    ...input,
    paidAt: input.paidAt ? new Date(input.paidAt) : new Date(),
  });
  await payment.save();

  // Update Order payment summary
  const allPayments = await Payment.find({ orderId: order._id });
  const totalPaid = allPayments.reduce((sum, p) => sum + p.amount, 0);
  order.paymentSummary.totalPaid = totalPaid;
  order.paymentSummary.balance = Math.max(0, order.paymentSummary.totalQuoted - totalPaid);
  
  if (order.paymentSummary.advance === 0 && allPayments.length > 0) {
    // Pick the earliest payment as advance
    const sorted = [...allPayments].sort((a, b) => a.paidAt.getTime() - b.paidAt.getTime());
    order.paymentSummary.advance = sorted[0].amount;
  }
  
  await order.save();

  const dto = toDto(payment);

  try {
    const { notifyPaymentRecorded } = await import('./notificationService');
    const customer = await import('../models/Customer').then((m) =>
      m.Customer.findById(order.customerId).lean(),
    );
    void notifyPaymentRecorded({
      paymentId: String((dto as { id?: string }).id || ''),
      orderId: String(order._id),
      orderNumber: order.orderNumber,
      customerId: String(order.customerId),
      customerName: customer?.name,
      customerEmail: customer?.email,
      amount: input.amount,
      balance: order.paymentSummary.balance,
      method: input.method,
    }).catch((err) => console.warn('notifyPaymentRecorded failed', err));
  } catch {
    // Notifications optional
  }

  return dto;
}

export async function listPayments(query: Record<string, any>) {
  const { page, limit } = parsePagination(query);
  const filter: Record<string, any> = {};

  if (query.orderId) {
    filter.orderId = query.orderId;
  }

  if (query.from || query.to) {
    filter.paidAt = {};
    if (query.from) filter.paidAt.$gte = new Date(query.from);
    if (query.to) filter.paidAt.$lte = new Date(query.to);
  }

  // Month filter: year + month (1-12) — defaults handled by callers
  if (query.year && query.month) {
    const year = Number(query.year);
    const month = Number(query.month);
    if (year >= 2000 && month >= 1 && month <= 12) {
      const from = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
      const to = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
      filter.paidAt = { $gte: from, $lte: to };
    }
  }

  const [items, total] = await Promise.all([
    Payment.find(filter)
      .populate({
        path: 'orderId',
        select: 'orderNumber referenceId title paymentSummary customerId',
        populate: { path: 'customerId', select: 'name phone email' },
      })
      .sort({ paidAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Payment.countDocuments(filter),
  ]);

  return {
    items: items.map((doc) => {
      const dto = toDto(doc) as Record<string, unknown>;
      const order = doc.orderId as unknown as {
        _id?: mongoose.Types.ObjectId;
        orderNumber?: number;
        referenceId?: string;
        title?: string;
        paymentSummary?: Record<string, number>;
        customerId?: { _id?: mongoose.Types.ObjectId; name?: string; phone?: string; email?: string };
      } | null;

      if (order && typeof order === 'object' && order._id) {
        dto.order = {
          id: String(order._id),
          orderNumber: order.orderNumber,
          referenceId: order.referenceId,
          title: order.title,
          paymentSummary: order.paymentSummary,
          customer: order.customerId
            ? {
                id: String(order.customerId._id ?? ''),
                name: order.customerId.name || '—',
                phone: order.customerId.phone || '',
                email: order.customerId.email,
              }
            : undefined,
        };
      }
      return dto;
    }),
    pagination: buildPaginationMeta(page, limit, total),
  };
}

/**
 * Invoice-style view of every order with billing status (unpaid / partial / paid / unquoted).
 */
export async function listInvoices(query: Record<string, any>) {
  const { page, limit } = parsePagination(query);
  const filter: Record<string, any> = {};

  if (query.status && query.status !== 'All') {
    filter.status = query.status;
  }

  if (query.from || query.to) {
    filter.createdAt = {};
    if (query.from) filter.createdAt.$gte = new Date(query.from);
    if (query.to) filter.createdAt.$lte = new Date(query.to);
  }

  const paymentStatus = typeof query.paymentStatus === 'string' ? query.paymentStatus : 'All';

  const [orders, totalAll] = await Promise.all([
    Order.find(filter)
      .populate('customerId', 'name phone email')
      .sort({ createdAt: -1 })
      .lean(),
    Order.countDocuments(filter),
  ]);

  const invoices = orders.map((o) => {
    const ps = o.paymentSummary || { totalQuoted: 0, advance: 0, totalPaid: 0, balance: 0 };
    const quoted = ps.totalQuoted || 0;
    const paid = ps.totalPaid || 0;
    const billStatus = computeBillStatus(quoted, paid);
    const issuedAt = o.createdAt ? new Date(o.createdAt) : new Date();

    const customer = o.customerId as unknown as {
      _id?: mongoose.Types.ObjectId;
      name?: string;
      phone?: string;
      email?: string;
    } | null;

    return {
      id: String(o._id),
      invoiceNumber: formatInvoiceNumber(o.orderNumber, issuedAt),
      orderNumber: o.orderNumber,
      referenceId: o.referenceId,
      title: o.title,
      status: o.status,
      billStatus,
      customer: customer
        ? {
            id: String(customer._id ?? ''),
            name: customer.name || '—',
            phone: customer.phone || '',
            email: customer.email,
          }
        : { id: '', name: '—', phone: '' },
      paymentSummary: {
        totalQuoted: quoted,
        advance: ps.advance || 0,
        totalPaid: paid,
        balance: ps.balance ?? Math.max(0, quoted - paid),
      },
      createdAt: o.createdAt,
      updatedAt: o.updatedAt,
    };
  });

  const filtered =
    paymentStatus === 'All'
      ? invoices
      : invoices.filter((inv) => inv.billStatus === paymentStatus);

  const total = paymentStatus === 'All' ? totalAll : filtered.length;
  const skip = (page - 1) * limit;
  const items = filtered.slice(skip, skip + limit);

  return {
    items,
    pagination: buildPaginationMeta(page, limit, total),
    summary: {
      unpaid: invoices.filter((i) => i.billStatus === 'unpaid').length,
      partial: invoices.filter((i) => i.billStatus === 'partial').length,
      paid: invoices.filter((i) => i.billStatus === 'paid').length,
      unquoted: invoices.filter((i) => i.billStatus === 'unquoted').length,
      totalQuoted: invoices.reduce((s, i) => s + i.paymentSummary.totalQuoted, 0),
      totalPaid: invoices.reduce((s, i) => s + i.paymentSummary.totalPaid, 0),
      totalBalance: invoices.reduce((s, i) => s + i.paymentSummary.balance, 0),
    },
  };
}

export async function recordExpense(input: CreateExpenseInput) {
  const expense = new Expense({
    ...input,
    spentAt: new Date(input.spentAt),
  });
  await expense.save();
  return toDto(expense);
}

export async function updateExpense(id: string, input: Partial<CreateExpenseInput>) {
  const expense = await Expense.findById(id);
  if (!expense) {
    throw new ApiError(404, 'Expense not found');
  }

  const updates = { ...input } as any;
  if (input.spentAt) {
    updates.spentAt = new Date(input.spentAt);
  }

  Object.assign(expense, updates);
  await expense.save();
  return toDto(expense);
}

export async function deleteExpense(id: string) {
  const result = await Expense.findByIdAndDelete(id);
  if (!result) {
    throw new ApiError(404, 'Expense not found');
  }
  return { success: true };
}

export async function listExpenses(query: Record<string, any>) {
  const { page, limit } = parsePagination(query);
  const filter: Record<string, any> = {};

  if (query.category) {
    filter.category = query.category;
  }

  if (query.from || query.to) {
    filter.spentAt = {};
    if (query.from) filter.spentAt.$gte = new Date(query.from);
    if (query.to) filter.spentAt.$lte = new Date(query.to);
  }

  if (query.q) {
    filter.title = new RegExp(String(query.q).replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'i');
  }

  const [items, total] = await Promise.all([
    Expense.find(filter)
      .sort({ spentAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Expense.countDocuments(filter),
  ]);

  return {
    items: items.map((doc) => toDto(doc)),
    pagination: buildPaginationMeta(page, limit, total),
  };
}

export async function recordSalaryPayment(input: RecordSalaryInput) {
  const staff = await Staff.findById(input.staffId);
  if (!staff) {
    throw new ApiError(404, 'Staff member not found');
  }

  const payment = new SalaryPayment({
    ...input,
    paidAt: new Date(input.paidAt),
  });
  await payment.save();
  return toDto(payment);
}

export async function listSalaryPayments(query: Record<string, any>) {
  const { page, limit } = parsePagination(query);
  const filter: Record<string, any> = {};

  if (query.staffId) {
    filter.staffId = query.staffId;
  }
  if (query.year) {
    filter.year = Number(query.year);
  }
  if (query.month) {
    filter.month = Number(query.month);
  }

  const [items, total] = await Promise.all([
    SalaryPayment.find(filter)
      .populate('staffId', 'fullName phone specializations locality')
      .sort({ paidAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    SalaryPayment.countDocuments(filter),
  ]);

  return {
    items: items.map((doc) => toDto(doc)),
    pagination: buildPaginationMeta(page, limit, total),
  };
}

export async function getFinanceSummary(from?: string, to?: string) {
  const toDate = to ? new Date(to) : new Date();
  let fromDate = from ? new Date(from) : new Date();
  if (!from) {
    fromDate.setMonth(toDate.getMonth() - 11); // default to 12 months
    fromDate.setDate(1);
  }

  const filterPayments: Record<string, any> = { paidAt: { $gte: fromDate, $lte: toDate } };
  const filterExpenses: Record<string, any> = { spentAt: { $gte: fromDate, $lte: toDate } };
  const filterSalaries: Record<string, any> = { paidAt: { $gte: fromDate, $lte: toDate } };

  // Totals calculations
  const [paymentsSum, expensesSum, salariesSum] = await Promise.all([
    Payment.aggregate([{ $match: filterPayments }, { $group: { _id: null, sum: { $sum: '$amount' } } }]),
    Expense.aggregate([{ $match: filterExpenses }, { $group: { _id: null, sum: { $sum: '$amount' } } }]),
    SalaryPayment.aggregate([{ $match: filterSalaries }, { $group: { _id: null, sum: { $sum: '$amount' } } }]),
  ]);

  const totalRevenue = paymentsSum[0]?.sum || 0;
  const totalExpenses = expensesSum[0]?.sum || 0;
  const totalSalaries = salariesSum[0]?.sum || 0;

  // Pending balance
  const activeOrders = await Order.find({ status: { $nin: ['delivery', 'cancelled'] } });
  const pendingBalance = activeOrders.reduce((sum, o) => sum + (o.paymentSummary.balance || 0), 0);

  // Revenue MTD (Month to Date)
  const mtdStart = new Date();
  mtdStart.setDate(1);
  mtdStart.setHours(0, 0, 0, 0);
  const mtdEnd = new Date();
  const mtdSumAgg = await Payment.aggregate([
    { $match: { paidAt: { $gte: mtdStart, $lte: mtdEnd } } },
    { $group: { _id: null, sum: { $sum: '$amount' } } },
  ]);
  const revenueMtd = mtdSumAgg[0]?.sum || 0;

  // Monthly breakdown trends
  const [paymentsMonthly, expensesMonthly, salariesMonthly] = await Promise.all([
    Payment.aggregate([
      { $match: filterPayments },
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$paidAt' } }, sum: { $sum: '$amount' } } },
      { $sort: { _id: 1 } },
    ]),
    Expense.aggregate([
      { $match: filterExpenses },
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$spentAt' } }, sum: { $sum: '$amount' } } },
      { $sort: { _id: 1 } },
    ]),
    SalaryPayment.aggregate([
      { $match: filterSalaries },
      { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$paidAt' } }, sum: { $sum: '$amount' } } },
      { $sort: { _id: 1 } },
    ]),
  ]);

  // Combine monthly trends
  const monthsSet = new Set<string>();
  paymentsMonthly.forEach((item) => monthsSet.add(item._id));
  expensesMonthly.forEach((item) => monthsSet.add(item._id));
  salariesMonthly.forEach((item) => monthsSet.add(item._id));

  const sortedMonths = Array.from(monthsSet).sort();
  const series = sortedMonths.map((m) => {
    const rev = paymentsMonthly.find((p) => p._id === m)?.sum || 0;
    const exp = expensesMonthly.find((e) => e._id === m)?.sum || 0;
    const sal = salariesMonthly.find((s) => s._id === m)?.sum || 0;
    return {
      month: m,
      revenue: rev,
      expenses: exp + sal,
      profit: rev - (exp + sal),
    };
  });

  return {
    totalRevenue,
    totalExpenses,
    totalSalaries,
    pendingBalance,
    revenueMtd,
    netProfit: totalRevenue - (totalExpenses + totalSalaries),
    series,
  };
}

export async function getRevenueByProduct(from?: string, to?: string) {
  const toDate = to ? new Date(to) : new Date();
  const fromDate = from ? new Date(from) : new Date(toDate.getFullYear(), toDate.getMonth() - 5, 1);

  // Group payments by order, then match orders by productType or lineItems
  const payments = await Payment.find({ paidAt: { $gte: fromDate, $lte: toDate } })
    .populate({
      path: 'orderId',
      select: 'lineItems',
    });

  const breakdown: Record<string, number> = {};

  for (const pay of payments) {
    const order = pay.orderId as any;
    if (!order || !order.lineItems || order.lineItems.length === 0) {
      breakdown['Unclassified'] = (breakdown['Unclassified'] || 0) + pay.amount;
      continue;
    }

    // Split payment amount among line items proportionally (or just attribute to first line item for simplicity)
    const primaryItem = order.lineItems[0];
    const name = primaryItem.productTypeCode || primaryItem.name || 'Unclassified';
    breakdown[name] = (breakdown[name] || 0) + pay.amount;
  }

  return Object.entries(breakdown).map(([name, value]) => ({ name, value }));
}

export async function getProfitLoss(from?: string, to?: string) {
  const toDate = to ? new Date(to) : new Date();
  const fromDate = from ? new Date(from) : new Date(toDate.getFullYear(), toDate.getMonth(), 1); // default to current month

  const filterPayments = { paidAt: { $gte: fromDate, $lte: toDate } };
  const filterExpenses = { spentAt: { $gte: fromDate, $lte: toDate } };
  const filterSalaries = { paidAt: { $gte: fromDate, $lte: toDate } };

  const [payments, expenses, salaries] = await Promise.all([
    Payment.find(filterPayments).populate('orderId', 'orderNumber title'),
    Expense.find(filterExpenses),
    SalaryPayment.find(filterSalaries).populate('staffId', 'fullName'),
  ]);

  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const totalSalaries = salaries.reduce((sum, s) => sum + s.amount, 0);

  return {
    range: {
      from: fromDate.toISOString(),
      to: toDate.toISOString(),
    },
    summary: {
      revenue: totalRevenue,
      expenses: totalExpenses,
      salaries: totalSalaries,
      netProfit: totalRevenue - (totalExpenses + totalSalaries),
    },
    payments: payments.map((p) => ({
      id: p._id,
      amount: p.amount,
      paidAt: p.paidAt.toISOString(),
      method: p.method,
      reference: p.reference,
      order: p.orderId,
    })),
    expenses: expenses.map((e) => ({
      id: e._id,
      title: e.title,
      category: e.category,
      amount: e.amount,
      spentAt: e.spentAt.toISOString(),
    })),
    salaries: salaries.map((s) => ({
      id: s._id,
      staffName: (s.staffId as any)?.fullName || 'Deleted Staff',
      amount: s.amount,
      period: `${s.month}/${s.year}`,
      paidAt: s.paidAt.toISOString(),
    })),
  };
}
