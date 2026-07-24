import mongoose from 'mongoose';
import { Order } from '../models/Order';
import { Payment } from '../models/Payment';
import { Customer } from '../models/Customer';
import { ApiError } from '../utils/ApiError';
import { getSettings } from './settingsService';

export type BillStatus = 'unquoted' | 'unpaid' | 'partial' | 'paid';

export function computeBillStatus(quoted: number, paid: number): BillStatus {
  if (quoted <= 0) return paid > 0 ? 'partial' : 'unquoted';
  if (paid <= 0) return 'unpaid';
  if (paid >= quoted) return 'paid';
  return 'partial';
}

export function formatInvoiceNumber(orderNumber: number, issuedAt: Date): string {
  const year = issuedAt.getFullYear();
  return `INV-${year}-${String(orderNumber).padStart(4, '0')}`;
}

export interface InvoiceDetail {
  invoiceNumber: string;
  invoiceDate: string;
  billStatus: BillStatus;
  studio: {
    name: string;
    location: string;
    phone: string;
    email: string;
    addressLines: string[];
  };
  customer: {
    id: string;
    name: string;
    phone: string;
    email?: string;
    addressLines?: string[];
  };
  order: {
    id: string;
    orderNumber: number;
    referenceId?: string;
    title: string;
    status: string;
    createdAt: string;
  };
  lineItems: Array<{
    name: string;
    qty: number;
    notes?: string;
    productTypeCode?: string;
  }>;
  paymentSummary: {
    totalQuoted: number;
    advance: number;
    totalPaid: number;
    balance: number;
  };
  payments: Array<{
    id: string;
    amount: number;
    paidAt: string;
    method: string;
    reference?: string;
  }>;
  notes?: string;
}

/**
 * Full invoice document for an order — shared by admin and customer portal.
 */
export async function getInvoiceDetail(
  orderId: string,
  options?: { customerId?: string },
): Promise<InvoiceDetail> {
  if (!mongoose.isValidObjectId(orderId)) {
    throw new ApiError(400, 'Invalid order id');
  }

  const filter: Record<string, unknown> = { _id: orderId };
  if (options?.customerId) {
    filter.customerId = options.customerId;
  }

  const order = await Order.findOne(filter).lean();
  if (!order) {
    throw new ApiError(404, 'Invoice not found');
  }

  const [customer, payments, settings] = await Promise.all([
    Customer.findById(order.customerId).lean(),
    Payment.find({ orderId: order._id }).sort({ paidAt: 1 }).lean(),
    getSettings().catch(() => null),
  ]);

  const ps = order.paymentSummary || { totalQuoted: 0, advance: 0, totalPaid: 0, balance: 0 };
  const quoted = ps.totalQuoted || 0;
  const paid =
    payments.length > 0
      ? payments.reduce((s, p) => s + (p.amount || 0), 0)
      : ps.totalPaid || 0;
  const balance = Math.max(0, quoted - paid);
  const issuedAt = order.createdAt ? new Date(order.createdAt) : new Date();

  const addressLines: string[] = [];
  if (customer?.address) {
    const a = customer.address;
    if (a.line1) addressLines.push(a.line1);
    if (a.line2) addressLines.push(a.line2);
    const localityCity = [a.locality, a.city].filter(Boolean).join(', ');
    if (localityCity) addressLines.push(localityCity);
    if (a.state || a.pincode) {
      addressLines.push([a.state, a.pincode].filter(Boolean).join(' — '));
    }
  }

  const studioName =
    (typeof settings?.studioName === 'string' && settings.studioName) ||
    "Kadamba's Designer Studio";
  const studioLocation =
    (typeof settings?.location === 'string' && settings.location) || 'Kurnool';
  const studioPhone =
    (typeof settings?.phoneDisplay === 'string' && settings.phoneDisplay) || '';
  const studioEmail = (typeof settings?.email === 'string' && settings.email) || '';
  const studioAddress = Array.isArray(settings?.addressLines)
    ? (settings!.addressLines as string[])
    : [];

  const customerNotes = (order.notes || [])
    .filter((n) => n.visibility === 'customer')
    .map((n) => n.body)
    .join('\n');

  return {
    invoiceNumber: formatInvoiceNumber(order.orderNumber, issuedAt),
    invoiceDate: issuedAt.toISOString(),
    billStatus: computeBillStatus(quoted, paid),
    studio: {
      name: studioName,
      location: studioLocation,
      phone: studioPhone,
      email: studioEmail,
      addressLines: studioAddress,
    },
    customer: {
      id: String(order.customerId),
      name: customer?.name || 'Customer',
      phone: customer?.phone || '',
      email: customer?.email,
      addressLines: addressLines.length ? addressLines : undefined,
    },
    order: {
      id: String(order._id),
      orderNumber: order.orderNumber,
      referenceId: order.referenceId,
      title: order.title,
      status: order.status,
      createdAt: issuedAt.toISOString(),
    },
    lineItems: (order.lineItems || []).map((li) => ({
      name: li.name,
      qty: li.qty || 1,
      notes: li.notes,
      productTypeCode: li.productTypeCode,
    })),
    paymentSummary: {
      totalQuoted: quoted,
      advance: ps.advance || 0,
      totalPaid: paid,
      balance,
    },
    payments: payments.map((p) => ({
      id: String(p._id),
      amount: p.amount,
      paidAt: p.paidAt?.toISOString?.() ?? String(p.paidAt),
      method: p.method,
      reference: p.reference,
    })),
    notes: customerNotes || undefined,
  };
}
