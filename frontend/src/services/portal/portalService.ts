import api from '@/services/api/client';
import type { ApiResponse } from '@/types';
import axios from 'axios';

const PORTAL_TOKEN_KEY = 'kadamba_portal_token';
const PORTAL_USER_KEY = 'kadamba_portal_user';

export { PORTAL_TOKEN_KEY, PORTAL_USER_KEY };

export interface PortalUser {
  id: string;
  name: string;
  email: string;
  role: 'customer';
  customerId?: string;
  referenceId?: string;
}

export interface PortalOrder {
  id: string;
  orderNumber?: number;
  referenceId?: string;
  status: string;
  statusNextHint?: string;
  title: string;
  lineItems: Array<{ name: string; qty: number; notes?: string; productTypeCode?: string }>;
  expectedTrialAt?: string;
  expectedDeliveryAt?: string;
  actualTrialAt?: string;
  actualDeliveryAt?: string;
  notes: Array<{ body: string; createdAt: string }>;
  timeline: Array<{ status: string; note?: string; at: string }>;
  paymentSummary: {
    totalQuoted: number;
    advance: number;
    totalPaid: number;
    balance: number;
  };
  createdAt?: string;
}

export interface PortalDashboard {
  welcomeName: string;
  referenceId?: string;
  activeOrderCount: number;
  totalOrderCount: number;
  nextTrialAt?: string;
  nextDeliveryAt?: string;
  pendingMeasurementActions: number;
  unreadChatCount: number;
  outstandingBalance?: number;
  recentOrders: PortalOrder[];
}

export interface PortalMeasurement {
  id: string;
  productTypeCode: string;
  profileName: string;
  unit: string;
  status: string;
  values: Record<string, unknown>;
  notes?: string;
  measuredAt?: string;
  updatedAt?: string;
}

export interface PortalMessage {
  id: string;
  orderId?: string;
  senderRole: 'customer' | 'admin' | 'staff';
  body: string;
  attachments: string[];
  createdAt: string;
}

export interface PortalTemplateSummary {
  code: string;
  name: string;
  category: string;
  fieldCount: number;
  version: number;
}

export interface PortalFieldDef {
  key: string;
  label: string;
  type: string;
  required: boolean;
  options?: string[];
  helpText?: string;
  group: string;
}

export interface PortalCatalogItem {
  id: string;
  code: string;
  name: string;
  categoryCode?: string;
  categoryName?: string;
  publicDescription?: string;
  indicativePriceRange?: string;
  measurementTemplateCode?: string;
  image?: string;
}

function portalHeaders() {
  // Token is attached by the shared axios interceptor for /portal paths.
  return {};
}

function toError(err: unknown, fallback: string): Error {
  if (axios.isAxiosError(err)) {
    const msg = (err.response?.data as { message?: string } | undefined)?.message;
    return new Error(msg || fallback);
  }
  if (err instanceof Error) return err;
  return new Error(fallback);
}

async function portalGet<T>(url: string) {
  try {
    const { data } = await api.get<ApiResponse<T>>(url, { headers: portalHeaders() });
    if (!data.success) throw new Error(data.message || 'Request failed');
    return data.data as T;
  } catch (err) {
    throw toError(err, 'Request failed');
  }
}

async function portalPost<T>(url: string, body?: unknown) {
  try {
    const { data } = await api.post<ApiResponse<T>>(url, body, { headers: portalHeaders() });
    if (!data.success) throw new Error(data.message || 'Request failed');
    return data.data as T;
  } catch (err) {
    throw toError(err, 'Request failed');
  }
}

export const portalApi = {
  verifyActivate: (payload: { referenceId: string; emailOrMobile: string }) =>
    portalPost<{
      activationToken: string;
      referenceId: string;
      customerName: string;
      maskedEmail?: string;
    }>('/portal/activate/verify', payload),

  setPassword: (payload: {
    activationToken: string;
    password: string;
    confirmPassword: string;
  }) =>
    portalPost<{ user: PortalUser; token: string }>('/portal/activate/set-password', payload),

  login: (payload: { email: string; password: string }) =>
    portalPost<{ user: PortalUser; token: string }>('/portal/login', payload),

  dashboard: () => portalGet<PortalDashboard>('/portal/dashboard'),
  orders: () => portalGet<PortalOrder[]>('/portal/orders'),
  order: (id: string) => portalGet<PortalOrder>(`/portal/orders/${id}`),
  measurements: () => portalGet<PortalMeasurement[]>('/portal/measurements'),
  measurementTemplates: () => portalGet<PortalTemplateSummary[]>('/portal/measurement-templates'),
  measurementTemplate: (code: string) =>
    portalGet<{
      code: string;
      name: string;
      category?: string;
      fieldDefs: PortalFieldDef[];
    }>(`/portal/measurement-templates/${code}`),
  submitMeasurement: (payload: {
    productTypeCode: string;
    profileName?: string;
    unit?: string;
    values: Record<string, unknown>;
    notes?: string;
    orderId?: string;
  }) => portalPost<PortalMeasurement>('/portal/measurements', payload),
  chat: (orderId?: string) =>
    portalGet<PortalMessage[]>(`/portal/chat${orderId ? `?orderId=${orderId}` : ''}`),
  sendChat: (payload: { body: string; orderId?: string; attachments?: string[] }) =>
    portalPost<PortalMessage>('/portal/chat', payload),
  payments: () =>
    portalGet<{
      outstandingBalance: number;
      invoices: Array<{
        orderId: string;
        invoiceNumber?: string;
        orderNumber?: number;
        referenceId?: string;
        title: string;
        status?: string;
        billStatus?: 'unquoted' | 'unpaid' | 'partial' | 'paid';
        invoiceDate?: string;
        paymentSummary: PortalOrder['paymentSummary'];
      }>;
      payments: Array<{
        id: string;
        orderId: string;
        referenceId?: string;
        orderTitle?: string;
        orderNumber?: number;
        amount: number;
        paidAt: string;
        method: string;
        reference?: string;
      }>;
    }>('/portal/payments'),
  invoice: (orderId: string) =>
    portalGet<import('@/components/invoices/InvoiceDocument').InvoiceDocumentData>(
      `/portal/invoices/${orderId}`,
    ),
  catalog: () => portalGet<PortalCatalogItem[]>('/portal/catalog'),
  request: (payload: {
    productTypeCode?: string;
    productName?: string;
    message: string;
    preferredDate: string;
    preferredTime?: string;
    budget: string;
    occasion?: string;
    fabricStatus?: string;
  }) =>
    portalPost<{ id: string; orderId?: string; orderNumber?: number; message: string }>(
      '/portal/requests',
      payload,
    ),
};

export function storePortalSession(user: PortalUser, token: string) {
  localStorage.setItem(PORTAL_TOKEN_KEY, token);
  localStorage.setItem(PORTAL_USER_KEY, JSON.stringify(user));
}

export function clearPortalSession() {
  localStorage.removeItem(PORTAL_TOKEN_KEY);
  localStorage.removeItem(PORTAL_USER_KEY);
}

export function loadPortalUser(): PortalUser | null {
  try {
    const raw = localStorage.getItem(PORTAL_USER_KEY);
    return raw ? (JSON.parse(raw) as PortalUser) : null;
  } catch {
    return null;
  }
}
