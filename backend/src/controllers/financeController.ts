import type { Request, Response } from 'express';
import {
  recordPayment,
  listPayments,
  listInvoices,
  getInvoiceDetail,
  recordExpense,
  updateExpense,
  deleteExpense,
  listExpenses,
  recordSalaryPayment,
  listSalaryPayments,
  getFinanceSummary,
  getRevenueByProduct,
  getProfitLoss,
} from '../services/financeService';
import { asyncHandler } from '../utils/asyncHandler';
import { recordAudit, actorFromRequest } from '../services/auditService';

export const recordPaymentHandler = asyncHandler(async (req: Request, res: Response) => {
  const recordedBy = req.user?.id || 'Studio Admin';
  const payment = (await recordPayment({
    ...req.body,
    recordedBy,
  })) as {
    id?: string;
    amount?: number;
    method?: string;
    orderId?: string;
  };

  await recordAudit(
    {
      action: 'payment.recorded',
      actor: actorFromRequest(req),
      entityType: 'payment',
      entityId: String(payment.id ?? ''),
      summary: `Recorded a payment of ${payment.amount} on order ${payment.orderId ?? '—'}`,
      changes: {
        amount: payment.amount,
        method: payment.method,
        orderId: payment.orderId,
      },
    },
    req,
  );

  res.status(201).json({ success: true, message: 'Payment recorded successfully', data: payment });
});

export const listPaymentsHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await listPayments(req.query);
  res.status(200).json({ success: true, message: 'Payments logs', data });
});

export const listInvoicesHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await listInvoices(req.query);
  res.status(200).json({ success: true, message: 'Invoices', data });
});

export const getInvoiceHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await getInvoiceDetail(req.params.id as string);
  res.status(200).json({ success: true, message: 'Invoice', data });
});

export const recordExpenseHandler = asyncHandler(async (req: Request, res: Response) => {
  const createdBy = req.user?.id || 'Studio Admin';
  const expense = (await recordExpense({
    ...req.body,
    createdBy,
  })) as { id?: string; amount?: number; category?: string; description?: string };

  await recordAudit(
    {
      action: 'expense.created',
      actor: actorFromRequest(req),
      entityType: 'expense',
      entityId: String(expense.id ?? ''),
      summary: `Recorded an expense of ${expense.amount} (${expense.category ?? 'uncategorised'})`,
      changes: { amount: expense.amount, category: expense.category, description: expense.description },
    },
    req,
  );

  res.status(201).json({ success: true, message: 'Expense recorded successfully', data: expense });
});

export const updateExpenseHandler = asyncHandler(async (req: Request, res: Response) => {
  const expense = (await updateExpense(req.params['id'] as string, req.body)) as {
    id?: string;
    amount?: number;
  };

  await recordAudit(
    {
      action: 'expense.updated',
      actor: actorFromRequest(req),
      entityType: 'expense',
      entityId: String(expense.id ?? req.params['id'] ?? ''),
      summary: `Updated expense ${expense.id ?? req.params['id']}`,
      changes: req.body as Record<string, unknown>,
    },
    req,
  );

  res.status(200).json({ success: true, message: 'Expense updated successfully', data: expense });
});

export const deleteExpenseHandler = asyncHandler(async (req: Request, res: Response) => {
  const id = String(req.params['id']);
  const response = await deleteExpense(id);

  await recordAudit(
    {
      action: 'expense.deleted',
      actor: actorFromRequest(req),
      entityType: 'expense',
      entityId: id,
      summary: `Deleted expense ${id}`,
    },
    req,
  );

  res.status(200).json({ success: true, message: 'Expense deleted successfully', data: response });
});

export const listExpensesHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await listExpenses(req.query);
  res.status(200).json({ success: true, message: 'Expenses list', data });
});

export const recordSalaryPaymentHandler = asyncHandler(async (req: Request, res: Response) => {
  const createdBy = req.user?.id || 'Studio Admin';
  const payment = (await recordSalaryPayment({
    ...req.body,
    createdBy,
  })) as { id?: string; staffId?: string; amount?: number; year?: number; month?: number };

  await recordAudit(
    {
      action: 'salary.recorded',
      actor: actorFromRequest(req),
      entityType: 'salary',
      entityId: String(payment.id ?? ''),
      summary: `Recorded salary of ${payment.amount} for ${payment.month}/${payment.year}`,
      changes: { staffId: payment.staffId, amount: payment.amount, year: payment.year, month: payment.month },
    },
    req,
  );

  res.status(201).json({ success: true, message: 'Salary payment recorded successfully', data: payment });
});

export const listSalaryPaymentsHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await listSalaryPayments(req.query);
  res.status(200).json({ success: true, message: 'Salary payments list', data });
});

export const getFinanceSummaryHandler = asyncHandler(async (req: Request, res: Response) => {
  const { from, to } = req.query as { from?: string; to?: string };
  const data = await getFinanceSummary(from, to);
  res.status(200).json({ success: true, message: 'Finance summary', data });
});

export const getRevenueByProductHandler = asyncHandler(async (req: Request, res: Response) => {
  const { from, to } = req.query as { from?: string; to?: string };
  const data = await getRevenueByProduct(from, to);
  res.status(200).json({ success: true, message: 'Revenue by product type', data });
});

export const getProfitLossHandler = asyncHandler(async (req: Request, res: Response) => {
  const { from, to } = req.query as { from?: string; to?: string };
  const data = await getProfitLoss(from, to);
  res.status(200).json({ success: true, message: 'Profit & Loss report', data });
});
