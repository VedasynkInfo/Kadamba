import type { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import {
  REPORT_TYPES,
  type ReportType,
  type GroupBy,
  getOrdersByStatus,
  getDeliveriesTrials,
  getRevenueTrend,
  getRevenueByProductReport,
  getRevenueByServiceReport,
  getOutstandingReport,
  getExpensesSalariesReport,
  getPnlReport,
  getLeadsConversionReport,
  getStaffWorkloadReport,
  getCustomerRepeatReport,
  exportReportCsv,
} from '../services/reportService';

function parseGroupBy(value?: string): GroupBy {
  if (value === 'day' || value === 'week' || value === 'month') return value;
  return 'month';
}

export const getOrdersByStatusHandler = asyncHandler(async (req: Request, res: Response) => {
  const { from, to } = req.query as { from: string; to: string };
  const data = await getOrdersByStatus(from, to);
  res.status(200).json({ success: true, message: 'Orders by status report', data });
});

export const getDeliveriesTrialsHandler = asyncHandler(async (req: Request, res: Response) => {
  const { from, to } = req.query as { from: string; to: string };
  const data = await getDeliveriesTrials(from, to);
  res.status(200).json({ success: true, message: 'Deliveries & trials report', data });
});

export const getRevenueTrendHandler = asyncHandler(async (req: Request, res: Response) => {
  const { from, to, groupBy } = req.query as { from: string; to: string; groupBy?: string };
  const data = await getRevenueTrend(from, to, parseGroupBy(groupBy));
  res.status(200).json({ success: true, message: 'Revenue trend report', data });
});

export const getRevenueByProductHandler = asyncHandler(async (req: Request, res: Response) => {
  const { from, to } = req.query as { from: string; to: string };
  const data = await getRevenueByProductReport(from, to);
  res.status(200).json({ success: true, message: 'Revenue by product report', data });
});

export const getRevenueByServiceHandler = asyncHandler(async (req: Request, res: Response) => {
  const { from, to } = req.query as { from: string; to: string };
  const data = await getRevenueByServiceReport(from, to);
  res.status(200).json({ success: true, message: 'Revenue by service report', data });
});

export const getOutstandingHandler = asyncHandler(async (req: Request, res: Response) => {
  const { asOf } = req.query as { asOf?: string };
  const data = await getOutstandingReport(asOf);
  res.status(200).json({ success: true, message: 'Outstanding balances report', data });
});

export const getExpensesSalariesHandler = asyncHandler(async (req: Request, res: Response) => {
  const { from, to } = req.query as { from: string; to: string };
  const data = await getExpensesSalariesReport(from, to);
  res.status(200).json({ success: true, message: 'Expenses & salaries report', data });
});

export const getPnlHandler = asyncHandler(async (req: Request, res: Response) => {
  const { from, to } = req.query as { from: string; to: string };
  const data = await getPnlReport(from, to);
  res.status(200).json({ success: true, message: 'Profit & Loss report', data });
});

export const getLeadsConversionHandler = asyncHandler(async (req: Request, res: Response) => {
  const { from, to } = req.query as { from: string; to: string };
  const data = await getLeadsConversionReport(from, to);
  res.status(200).json({ success: true, message: 'Leads conversion report', data });
});

export const getStaffWorkloadHandler = asyncHandler(async (req: Request, res: Response) => {
  const { from, to } = req.query as { from: string; to: string };
  const data = await getStaffWorkloadReport(from, to);
  res.status(200).json({ success: true, message: 'Staff workload report', data });
});

export const getCustomerRepeatHandler = asyncHandler(async (req: Request, res: Response) => {
  const { from, to } = req.query as { from: string; to: string };
  const data = await getCustomerRepeatReport(from, to);
  res.status(200).json({ success: true, message: 'Customer repeat report', data });
});

export const exportReportHandler = asyncHandler(async (req: Request, res: Response) => {
  const type = req.params.type as ReportType;
  if (!REPORT_TYPES.includes(type)) {
    throw new ApiError(400, `Unknown report type: ${type}`);
  }
  const { from, to, asOf, groupBy } = req.query as {
    from?: string;
    to?: string;
    asOf?: string;
    groupBy?: string;
  };
  const { filename, csv } = await exportReportCsv(type, {
    from,
    to,
    asOf,
    groupBy: parseGroupBy(groupBy),
  });
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.status(200).send(csv);
});
