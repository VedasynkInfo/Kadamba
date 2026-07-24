import api from '../api/client';
import type { ApiResponse } from '@/types';
import type { Lead } from '@/pages/leads/data';

export interface DashboardSummary {
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
    pendingMeasurementApprovals?: number;
  };
  series: {
    leadsByMonth: Array<{ month: string; count: number }>;
    revenueByMonth: Array<{ month: string; amount: number }>;
    ordersByStatus: Array<{ status: string; count: number }>;
    leadsBySource: Array<{ source: string; count: number }>;
    visitors: Array<{ date: string; count: number }> | null;
  };
  recentLeads: Lead[];
  actionOrders: Array<{
    id: string;
    orderNumber: number;
    title: string;
    status: string;
    customerName: string;
    expectedDeliveryAt?: string;
  }>;
}

export interface AdminBadges {
  leads: number;
  measurements: number;
  chat: number;
}

export const dashboardApi = {
  getSummary: async (from?: string, to?: string): Promise<DashboardSummary> => {
    const { data } = await api.get<ApiResponse<DashboardSummary>>('/admin/dashboard/summary', {
      params: { from, to },
    });
    return data.data!;
  },

  getBadges: async (): Promise<AdminBadges> => {
    const { data } = await api.get<ApiResponse<AdminBadges>>('/admin/dashboard/badges');
    return data.data!;
  },
};
