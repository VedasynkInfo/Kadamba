import api from '../api/client';
import type { ApiResponse, PaginatedData } from '@/types';

export interface OrderLineItem {
  productTypeCode?: string;
  serviceId?: string;
  name: string;
  notes?: string;
  qty: number;
}

export interface OrderStaff {
  staffId?: string;
  name: string;
  role: 'cutter' | 'stitcher' | 'maggam' | 'finishing' | 'designer';
}

export interface OrderNote {
  body: string;
  visibility: 'internal' | 'customer';
  createdBy: string;
  createdAt: string;
}

export interface OrderTimeline {
  status: string;
  note?: string;
  actorId: string;
  at: string;
}

export interface OrderPaymentSummary {
  totalQuoted: number;
  advance: number;
  totalPaid: number;
  balance: number;
}

export interface Order {
  id: string;
  orderNumber: number;
  referenceId?: string;
  customerId: {
    id: string;
    name: string;
    phone: string;
    email?: string;
    city?: string;
  };
  leadId?: string;
  status: string;
  priority: string;
  title: string;
  lineItems: OrderLineItem[];
  measurementProfileIds: string[];
  assignedStaff: OrderStaff[];
  expectedTrialAt?: string;
  expectedDeliveryAt?: string;
  actualTrialAt?: string;
  actualDeliveryAt?: string;
  tags: string[];
  notes: OrderNote[];
  timeline: OrderTimeline[];
  paymentSummary: OrderPaymentSummary;
  attachments: string[];
  cancelledReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerProfile {
  id: string;
  name: string;
  phone: string;
  email?: string;
  city?: string;
  notes?: string;
  createdAt: string;
}

export const ordersApi = {
  list: async (params?: Record<string, any>): Promise<PaginatedData<Order>> => {
    const { data } = await api.get<ApiResponse<PaginatedData<Order>>>('/admin/orders', { params });
    return data.data!;
  },

  get: async (id: string): Promise<Order> => {
    const { data } = await api.get<ApiResponse<Order>>(`/admin/orders/${id}`);
    return data.data!;
  },

  create: async (payload: {
    customerId: string;
    leadId?: string;
    title: string;
    status?: string;
    priority?: string;
    lineItems: OrderLineItem[];
    expectedTrialAt?: string;
    expectedDeliveryAt?: string;
    tags?: string[];
    paymentSummary?: {
      totalQuoted?: number;
      advance?: number;
    };
    notes?: string;
  }): Promise<Order> => {
    const { data } = await api.post<ApiResponse<Order>>('/admin/orders', payload);
    return data.data!;
  },

  update: async (id: string, payload: {
    title?: string;
    priority?: string;
    lineItems?: OrderLineItem[];
    expectedTrialAt?: string;
    expectedDeliveryAt?: string;
    actualTrialAt?: string;
    actualDeliveryAt?: string;
    tags?: string[];
    paymentSummary?: {
      totalQuoted?: number;
      totalPaid?: number;
    };
  }): Promise<Order> => {
    const { data } = await api.patch<ApiResponse<Order>>(`/admin/orders/${id}`, payload);
    return data.data!;
  },

  transitionStatus: async (id: string, status: string, note?: string): Promise<Order> => {
    const { data } = await api.post<ApiResponse<Order>>(`/admin/orders/${id}/status`, { status, note });
    return data.data!;
  },

  assignStaff: async (id: string, assignedStaff: OrderStaff[]): Promise<Order> => {
    const { data } = await api.post<ApiResponse<Order>>(`/admin/orders/${id}/assign`, { assignedStaff });
    return data.data!;
  },

  linkMeasurements: async (id: string, measurementProfileIds: string[]): Promise<Order> => {
    const { data } = await api.post<ApiResponse<Order>>(`/admin/orders/${id}/link-measurements`, { measurementProfileIds });
    return data.data!;
  },

  addNote: async (id: string, body: string, visibility: 'internal' | 'customer' = 'internal'): Promise<Order> => {
    const { data } = await api.post<ApiResponse<Order>>(`/admin/orders/${id}/notes`, { body, visibility });
    return data.data!;
  },

  convertFromLead: async (leadId: string): Promise<Order> => {
    const { data } = await api.post<ApiResponse<Order>>(`/admin/orders/from-lead/${leadId}`);
    return data.data!;
  },
};

export const customersApi = {
  list: async (params?: { q?: string; page?: number; limit?: number }): Promise<PaginatedData<CustomerProfile>> => {
    const { data } = await api.get<ApiResponse<PaginatedData<CustomerProfile>>>('/admin/customers', { params });
    return data.data!;
  },

  create: async (payload: {
    name: string;
    phone?: string;
    email?: string;
    city?: string;
    notes?: string;
  }): Promise<CustomerProfile> => {
    const { data } = await api.post<ApiResponse<CustomerProfile>>('/admin/customers', payload);
    return data.data!;
  },
};
