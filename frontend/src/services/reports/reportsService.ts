import api from '../api/client';
import type { ApiResponse } from '@/types';

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

export interface ReportDateParams {
  from: string;
  to: string;
  groupBy?: GroupBy;
  asOf?: string;
}

export interface OrdersByStatusReport {
  range: { from: string; to: string };
  definition: string;
  total: number;
  rows: Array<{ status: string; count: number; percent: number }>;
}

export interface DeliveriesTrialsReport {
  range: { from: string; to: string };
  definition: string;
  summary: {
    expectedTrials: number;
    actualTrials: number;
    expectedDeliveries: number;
    actualDeliveries: number;
  };
  rows: Array<{
    orderId: string;
    orderNumber: number;
    title: string;
    status: string;
    expectedTrialAt: string | null;
    actualTrialAt: string | null;
    expectedDeliveryAt: string | null;
    actualDeliveryAt: string | null;
  }>;
}

export interface RevenueTrendReport {
  range: { from: string; to: string };
  groupBy: GroupBy;
  definition: string;
  total: number;
  rows: Array<{ period: string; amount: number; paymentCount: number; percent: number }>;
}

export interface RevenueByProductReport {
  range: { from: string; to: string };
  definition: string;
  total: number;
  rows: Array<{
    productCode: string;
    productName: string;
    ordersCount: number;
    grossPayments: number;
    outstanding: number;
    percent: number;
  }>;
}

export interface RevenueByServiceReport {
  range: { from: string; to: string };
  definition: string;
  total: number;
  rows: Array<{
    serviceId: string;
    serviceName: string;
    ordersCount: number;
    grossPayments: number;
    percent: number;
  }>;
}

export interface OutstandingReport {
  asOf: string;
  definition: string;
  summary: { openOrders: number; totalOutstanding: number; totalAdvances: number };
  rows: Array<{
    orderId: string;
    orderNumber: number;
    title: string;
    status: string;
    customerId: string | null;
    customerName: string;
    totalQuoted: number;
    advance: number;
    totalPaid: number;
    balance: number;
  }>;
}

export interface ExpensesSalariesReport {
  range: { from: string; to: string };
  definition: string;
  summary: { totalExpenses: number; totalSalaries: number; totalOutflow: number };
  expenseRows: Array<{ category: string; amount: number; count: number; percent: number }>;
  salaryRows: Array<{ period: string; amount: number; count: number; percent: number }>;
}

export interface PnlReport {
  range: { from: string; to: string };
  definition: string;
  summary: { revenue: number; expenses: number; salaries: number; netProfit: number };
  payments: unknown[];
  expenses: unknown[];
  salaries: unknown[];
}

export interface LeadsConversionReport {
  range: { from: string; to: string };
  definition: string;
  summary: { totalLeads: number; totalConverted: number; conversionRate: number };
  rows: Array<{
    source: string;
    leads: number;
    converted: number;
    conversionRate: number;
    percentOfLeads: number;
  }>;
}

export interface StaffWorkloadReport {
  range: { from: string; to: string };
  definition: string;
  summary: { staffCount: number; ordersWithStaff: number };
  rows: Array<{ staffId: string; name: string; open: number; completed: number; total: number }>;
}

export interface CustomerRepeatReport {
  range: { from: string; to: string };
  definition: string;
  summary: {
    customersInPeriod: number;
    newCustomers: number;
    returningCustomers: number;
    repeatRate: number;
  };
  rows: Array<{
    customerId: string;
    customerName: string;
    ordersInPeriod: number;
    lifetimeOrders: number;
    segment: string;
  }>;
}

export type AnyReport =
  | OrdersByStatusReport
  | DeliveriesTrialsReport
  | RevenueTrendReport
  | RevenueByProductReport
  | RevenueByServiceReport
  | OutstandingReport
  | ExpensesSalariesReport
  | PnlReport
  | LeadsConversionReport
  | StaffWorkloadReport
  | CustomerRepeatReport;

async function getReport<T>(path: string, params?: Record<string, unknown>): Promise<T> {
  const { data } = await api.get<ApiResponse<T>>(`/admin/reports/${path}`, { params });
  return data.data!;
}

export const reportsApi = {
  getOrdersByStatus: (params: ReportDateParams) =>
    getReport<OrdersByStatusReport>('orders-by-status', params),

  getDeliveriesTrials: (params: ReportDateParams) =>
    getReport<DeliveriesTrialsReport>('deliveries-trials', params),

  getRevenueTrend: (params: ReportDateParams) =>
    getReport<RevenueTrendReport>('revenue-trend', {
      from: params.from,
      to: params.to,
      groupBy: params.groupBy,
    }),

  getRevenueByProduct: (params: ReportDateParams) =>
    getReport<RevenueByProductReport>('revenue-by-product', params),

  getRevenueByService: (params: ReportDateParams) =>
    getReport<RevenueByServiceReport>('revenue-by-service', params),

  getOutstanding: (asOf?: string) => getReport<OutstandingReport>('outstanding', { asOf }),

  getExpensesSalaries: (params: ReportDateParams) =>
    getReport<ExpensesSalariesReport>('expenses-salaries', params),

  getPnl: (params: ReportDateParams) => getReport<PnlReport>('pnl', params),

  getLeadsConversion: (params: ReportDateParams) =>
    getReport<LeadsConversionReport>('leads-conversion', params),

  getStaffWorkload: (params: ReportDateParams) =>
    getReport<StaffWorkloadReport>('staff-workload', params),

  getCustomerRepeat: (params: ReportDateParams) =>
    getReport<CustomerRepeatReport>('customer-repeat', params),

  fetchReport: async (type: ReportType, params: ReportDateParams): Promise<AnyReport> => {
    switch (type) {
      case 'orders-by-status':
        return reportsApi.getOrdersByStatus(params);
      case 'deliveries-trials':
        return reportsApi.getDeliveriesTrials(params);
      case 'revenue-trend':
        return reportsApi.getRevenueTrend(params);
      case 'revenue-by-product':
        return reportsApi.getRevenueByProduct(params);
      case 'revenue-by-service':
        return reportsApi.getRevenueByService(params);
      case 'outstanding':
        return reportsApi.getOutstanding(params.asOf || params.to);
      case 'expenses-salaries':
        return reportsApi.getExpensesSalaries(params);
      case 'pnl':
        return reportsApi.getPnl(params);
      case 'leads-conversion':
        return reportsApi.getLeadsConversion(params);
      case 'staff-workload':
        return reportsApi.getStaffWorkload(params);
      case 'customer-repeat':
        return reportsApi.getCustomerRepeat(params);
      default:
        throw new Error(`Unknown report type: ${type}`);
    }
  },

  downloadCsv: async (type: ReportType, params: ReportDateParams): Promise<void> => {
    const response = await api.get(`/admin/reports/export/${type}`, {
      params,
      responseType: 'blob',
    });
    const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },
};
