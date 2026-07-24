import api from '../api/client';
import type { ApiResponse, PaginatedData } from '@/types';

export interface PaymentRecord {
  id: string;
  orderId: any;
  amount: number;
  paidAt: string;
  method: 'cash' | 'upi' | 'bank' | 'card' | 'other';
  reference?: string;
  notes?: string;
  recordedBy: string;
  order?: {
    id: string;
    orderNumber?: number;
    referenceId?: string;
    title?: string;
    paymentSummary?: {
      totalQuoted: number;
      advance: number;
      totalPaid: number;
      balance: number;
    };
    customer?: {
      id: string;
      name: string;
      phone: string;
      email?: string;
    };
  };
}

export interface InvoiceRecord {
  id: string;
  invoiceNumber?: string;
  orderNumber: number;
  referenceId?: string;
  title: string;
  status: string;
  billStatus: 'unquoted' | 'unpaid' | 'partial' | 'paid';
  customer: {
    id: string;
    name: string;
    phone: string;
    email?: string;
  };
  paymentSummary: {
    totalQuoted: number;
    advance: number;
    totalPaid: number;
    balance: number;
  };
  createdAt: string;
  updatedAt: string;
}

export type InvoiceDetail = import('@/components/invoices/InvoiceDocument').InvoiceDocumentData;

export interface InvoiceListResult {
  items: InvoiceRecord[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages?: number;
  };
  summary: {
    unpaid: number;
    partial: number;
    paid: number;
    unquoted: number;
    totalQuoted: number;
    totalPaid: number;
    totalBalance: number;
  };
}

export interface ExpenseRecord {
  id: string;
  title: string;
  category: 'fabric' | 'embroidery materials' | 'rent' | 'utilities' | 'marketing' | 'misc';
  amount: number;
  spentAt: string;
  notes?: string;
  attachmentUrl?: string;
  createdBy: string;
}

export interface SalaryRecord {
  id: string;
  staffId: any; // Staff details populated in backend
  year: number;
  month: number;
  amount: number;
  paidAt: string;
  notes?: string;
  createdBy: string;
}

export interface FinanceSummary {
  totalRevenue: number;
  totalExpenses: number;
  totalSalaries: number;
  pendingBalance: number;
  revenueMtd: number;
  netProfit: number;
  series: Array<{
    month: string;
    revenue: number;
    expenses: number;
    profit: number;
  }>;
}

export interface RevenueByProduct {
  name: string;
  value: number;
}

export interface ProfitLossReport {
  range: {
    from: string;
    to: string;
  };
  summary: {
    revenue: number;
    expenses: number;
    salaries: number;
    netProfit: number;
  };
  payments: Array<{
    id: string;
    amount: number;
    paidAt: string;
    method: string;
    reference?: string;
    order: {
      id: string;
      orderNumber: number;
      title: string;
    };
  }>;
  expenses: Array<{
    id: string;
    title: string;
    category: string;
    amount: number;
    spentAt: string;
  }>;
  salaries: Array<{
    id: string;
    staffName: string;
    amount: number;
    period: string;
    paidAt: string;
  }>;
}

export const financeApi = {
  getSummary: async (params?: { from?: string; to?: string }): Promise<FinanceSummary> => {
    const { data } = await api.get<ApiResponse<FinanceSummary>>('/admin/finance/summary', { params });
    return data.data!;
  },

  getRevenueByProduct: async (params?: { from?: string; to?: string }): Promise<RevenueByProduct[]> => {
    const { data } = await api.get<ApiResponse<RevenueByProduct[]>>('/admin/finance/revenue-by-product', { params });
    return data.data!;
  },

  getProfitLoss: async (params?: { from?: string; to?: string }): Promise<ProfitLossReport> => {
    const { data } = await api.get<ApiResponse<ProfitLossReport>>('/admin/finance/profit-loss', { params });
    return data.data!;
  },

  listPayments: async (params?: Record<string, any>): Promise<PaginatedData<PaymentRecord>> => {
    const { data } = await api.get<ApiResponse<PaginatedData<PaymentRecord>>>('/admin/finance/payments', { params });
    return data.data!;
  },

  listInvoices: async (params?: Record<string, any>): Promise<InvoiceListResult> => {
    const { data } = await api.get<ApiResponse<InvoiceListResult>>('/admin/finance/invoices', { params });
    return data.data!;
  },

  getInvoice: async (orderId: string): Promise<InvoiceDetail> => {
    const { data } = await api.get<ApiResponse<InvoiceDetail>>(`/admin/finance/invoices/${orderId}`);
    return data.data!;
  },

  recordPayment: async (payload: {
    orderId: string;
    amount: number;
    method: string;
    reference?: string;
    notes?: string;
    paidAt?: string;
    bypassBalanceCheck?: boolean;
  }): Promise<PaymentRecord> => {
    const { data } = await api.post<ApiResponse<PaymentRecord>>('/admin/finance/payments', payload);
    return data.data!;
  },

  listExpenses: async (params?: Record<string, any>): Promise<PaginatedData<ExpenseRecord>> => {
    const { data } = await api.get<ApiResponse<PaginatedData<ExpenseRecord>>>('/admin/finance/expenses', { params });
    return data.data!;
  },

  recordExpense: async (payload: Partial<ExpenseRecord>): Promise<ExpenseRecord> => {
    const { data } = await api.post<ApiResponse<ExpenseRecord>>('/admin/finance/expenses', payload);
    return data.data!;
  },

  updateExpense: async (id: string, payload: Partial<ExpenseRecord>): Promise<ExpenseRecord> => {
    const { data } = await api.put<ApiResponse<ExpenseRecord>>(`/admin/finance/expenses/${id}`, payload);
    return data.data!;
  },

  deleteExpense: async (id: string): Promise<boolean> => {
    await api.delete(`/admin/finance/expenses/${id}`);
    return true;
  },

  listSalaries: async (params?: Record<string, any>): Promise<PaginatedData<SalaryRecord>> => {
    const { data } = await api.get<ApiResponse<PaginatedData<SalaryRecord>>>('/admin/finance/salaries', { params });
    return data.data!;
  },

  recordSalary: async (payload: {
    staffId: string;
    year: number;
    month: number;
    amount: number;
    paidAt: string;
    notes?: string;
  }): Promise<SalaryRecord> => {
    const { data } = await api.post<ApiResponse<SalaryRecord>>('/admin/finance/salaries', payload);
    return data.data!;
  },
};
