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

export const recordPaymentHandler = asyncHandler(async (req: Request, res: Response) => {
  const recordedBy = req.user?.id || 'Studio Admin';
  const payment = await recordPayment({
    ...req.body,
    recordedBy,
  });
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
  const expense = await recordExpense({
    ...req.body,
    createdBy,
  });
  res.status(201).json({ success: true, message: 'Expense recorded successfully', data: expense });
});

export const updateExpenseHandler = asyncHandler(async (req: Request, res: Response) => {
  const expense = await updateExpense(req.params['id'] as string, req.body);
  res.status(200).json({ success: true, message: 'Expense updated successfully', data: expense });
});

export const deleteExpenseHandler = asyncHandler(async (req: Request, res: Response) => {
  const response = await deleteExpense(req.params['id'] as string);
  res.status(200).json({ success: true, message: 'Expense deleted successfully', data: response });
});

export const listExpensesHandler = asyncHandler(async (req: Request, res: Response) => {
  const data = await listExpenses(req.query);
  res.status(200).json({ success: true, message: 'Expenses list', data });
});

export const recordSalaryPaymentHandler = asyncHandler(async (req: Request, res: Response) => {
  const createdBy = req.user?.id || 'Studio Admin';
  const payment = await recordSalaryPayment({
    ...req.body,
    createdBy,
  });
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
