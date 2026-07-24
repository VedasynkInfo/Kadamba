import jwt, { type SignOptions } from 'jsonwebtoken';
import mongoose from 'mongoose';
import { env } from '../config/env';
import { sendEmail } from '../config/email';
import { Customer } from '../models/Customer';
import { MeasurementProfile } from '../models/MeasurementProfile';
import { MeasurementTemplate } from '../models/MeasurementTemplate';
import { Order } from '../models/Order';
import { Payment } from '../models/Payment';
import { PortalMessage } from '../models/PortalMessage';
import { ProductType } from '../models/ProductType';
import { User } from '../models/User';
import { ApiError } from '../utils/ApiError';
import { createProfile } from './measurementProfileService';

const REFERENCE_ID_RE = /^KDS-\d{4}-\d{4}$/;
const GENERIC_ACTIVATE_ERROR = 'Unable to verify Reference ID. Check your details and try again.';

interface ActivationPayload {
  purpose: 'portal_activate';
  referenceId: string;
  customerId: string;
  orderId: string;
  email: string;
  phone: string;
}

function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, '');
}

function phonesMatch(a: string, b: string): boolean {
  const na = normalizePhone(a);
  const nb = normalizePhone(b);
  if (!na || !nb) return false;
  return na === nb || na.endsWith(nb) || nb.endsWith(na);
}

function assertPasswordStrength(password: string) {
  if (password.length < 8) {
    throw new ApiError(400, 'Password must be at least 8 characters');
  }
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    throw new ApiError(400, 'Password must include at least one letter and one number');
  }
}

function signActivationToken(payload: ActivationPayload): string {
  const options: SignOptions = { expiresIn: '15m' };
  return jwt.sign(payload, env.jwtSecret, options);
}

function verifyActivationToken(token: string): ActivationPayload {
  try {
    const payload = jwt.verify(token, env.jwtSecret) as ActivationPayload;
    if (payload.purpose !== 'portal_activate') {
      throw new Error('bad purpose');
    }
    return payload;
  } catch {
    throw new ApiError(400, GENERIC_ACTIVATE_ERROR);
  }
}

function signCustomerToken(userId: string, customerId: string): string {
  const options: SignOptions = {
    expiresIn: env.jwtExpiresIn as SignOptions['expiresIn'],
  };
  return jwt.sign(
    { id: userId, role: 'customer', customerId },
    env.jwtSecret,
    options,
  );
}

function sanitizePortalUser(user: {
  _id: unknown;
  name: string;
  email: string;
  role: string;
  customerId?: unknown;
  referenceId?: string;
}) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    role: user.role as 'customer',
    customerId: user.customerId ? String(user.customerId) : undefined,
    referenceId: user.referenceId,
  };
}

function orderStatusNextHint(status: string): string {
  const hints: Record<string, string> = {
    enquiry: 'The boutique will review your request and confirm availability.',
    confirmed: 'Activate your portal with the Reference ID if you have not already. Measurements come next.',
    measurements: 'Share or confirm your measurements so cutting can begin.',
    cutting: 'Fabric is being cut. We will update you when stitching starts.',
    stitching: 'Your garment is on the sewing floor. A trial date will follow.',
    embroidery_maggam: 'Hand embroidery / maggam work is in progress.',
    trial: 'Come in for your trial fitting — bring the Reference ID if asked.',
    finishing: 'Final finishing and packing before delivery.',
    delivery: 'Your order is ready / delivered. Enjoy wearing it!',
    cancelled: 'This order was cancelled. Contact the studio if you have questions.',
    on_hold: 'Work is paused. The boutique will reach out when it resumes.',
  };
  return hints[status] || 'The boutique will update you as work progresses.';
}

function customerSafeOrder(doc: Record<string, unknown>) {
  const notes = Array.isArray(doc.notes)
    ? (doc.notes as Array<Record<string, unknown>>)
        .filter((n) => n.visibility === 'customer')
        .map((n) => ({
          body: String(n.body ?? ''),
          createdAt: n.createdAt instanceof Date ? n.createdAt.toISOString() : String(n.createdAt ?? ''),
        }))
    : [];

  const timeline = Array.isArray(doc.timeline)
    ? (doc.timeline as Array<Record<string, unknown>>).map((t) => ({
        status: String(t.status ?? ''),
        note: t.note ? String(t.note) : undefined,
        at: t.at instanceof Date ? t.at.toISOString() : String(t.at ?? ''),
      }))
    : [];

  const paymentSummary = (doc.paymentSummary as Record<string, number>) || {};
  const status = String(doc.status ?? '');

  return {
    id: String(doc._id ?? doc.id ?? ''),
    orderNumber: doc.orderNumber,
    referenceId: doc.referenceId ? String(doc.referenceId) : undefined,
    status,
    statusNextHint: orderStatusNextHint(status),
    title: String(doc.title ?? ''),
    lineItems: doc.lineItems || [],
    expectedTrialAt: doc.expectedTrialAt
      ? new Date(doc.expectedTrialAt as string | Date).toISOString()
      : undefined,
    expectedDeliveryAt: doc.expectedDeliveryAt
      ? new Date(doc.expectedDeliveryAt as string | Date).toISOString()
      : undefined,
    actualTrialAt: doc.actualTrialAt
      ? new Date(doc.actualTrialAt as string | Date).toISOString()
      : undefined,
    actualDeliveryAt: doc.actualDeliveryAt
      ? new Date(doc.actualDeliveryAt as string | Date).toISOString()
      : undefined,
    notes,
    timeline,
    paymentSummary: {
      totalQuoted: paymentSummary.totalQuoted || 0,
      advance: paymentSummary.advance || 0,
      totalPaid: paymentSummary.totalPaid || 0,
      balance: paymentSummary.balance || 0,
    },
    createdAt: doc.createdAt
      ? new Date(doc.createdAt as string | Date).toISOString()
      : undefined,
    updatedAt: doc.updatedAt
      ? new Date(doc.updatedAt as string | Date).toISOString()
      : undefined,
  };
}

/**
 * Strict Reference ID verification — generic errors only (no enumeration).
 */
export async function verifyPortalActivation(input: {
  referenceId: string;
  emailOrMobile: string;
}) {
  const referenceId = input.referenceId.trim().toUpperCase();
  const identity = input.emailOrMobile.trim();

  if (!REFERENCE_ID_RE.test(referenceId) || !identity) {
    throw new ApiError(400, GENERIC_ACTIVATE_ERROR);
  }

  const order = await Order.findOne({ referenceId }).lean();
  if (!order || !['confirmed', 'measurements', 'cutting', 'stitching', 'embroidery_maggam', 'trial', 'finishing', 'delivery'].includes(order.status)) {
    throw new ApiError(400, GENERIC_ACTIVATE_ERROR);
  }

  const customer = await Customer.findById(order.customerId).lean();
  if (!customer) {
    throw new ApiError(400, GENERIC_ACTIVATE_ERROR);
  }

  const identityLower = identity.toLowerCase();
  const emailOk = Boolean(customer.email && customer.email.toLowerCase() === identityLower);
  const phoneOk = phonesMatch(customer.phone, identity) || (customer.whatsapp ? phonesMatch(customer.whatsapp, identity) : false);

  if (!emailOk && !phoneOk) {
    throw new ApiError(400, GENERIC_ACTIVATE_ERROR);
  }

  const existing = await User.findOne({
    $or: [
      { referenceId },
      { customerId: customer._id, role: 'customer' },
    ],
  }).lean();

  if (existing && existing.status === 'active' && existing.activatedAt) {
    throw new ApiError(400, 'This Reference ID is already activated. Please sign in.');
  }

  const activationToken = signActivationToken({
    purpose: 'portal_activate',
    referenceId,
    customerId: String(customer._id),
    orderId: String(order._id),
    email: (customer.email || '').toLowerCase(),
    phone: customer.phone,
  });

  return {
    activationToken,
    referenceId,
    customerName: customer.name,
    maskedEmail: customer.email
      ? customer.email.replace(/(.{2}).+(@.+)/, '$1***$2')
      : undefined,
  };
}

export async function setPortalPassword(input: {
  activationToken: string;
  password: string;
  confirmPassword: string;
}) {
  if (input.password !== input.confirmPassword) {
    throw new ApiError(400, 'Passwords do not match');
  }
  assertPasswordStrength(input.password);

  const payload = verifyActivationToken(input.activationToken);
  const customer = await Customer.findById(payload.customerId);
  if (!customer) {
    throw new ApiError(400, GENERIC_ACTIVATE_ERROR);
  }

  const email = (customer.email || payload.email || '').toLowerCase();
  if (!email) {
    throw new ApiError(400, 'Customer email is required to activate the portal. Contact the boutique.');
  }

  let user = await User.findOne({
    $or: [
      { referenceId: payload.referenceId },
      { customerId: customer._id, role: 'customer' },
      { email, role: 'customer' },
    ],
  }).select('+password');

  if (user && user.activatedAt && user.status === 'active') {
    throw new ApiError(400, 'This Reference ID is already activated. Please sign in.');
  }

  if (!user) {
    // Email may already belong to a non-customer user — block collision.
    const emailTaken = await User.findOne({ email });
    if (emailTaken && emailTaken.role !== 'customer') {
      throw new ApiError(400, 'Unable to activate with this email. Contact the boutique.');
    }
    user = emailTaken?.role === 'customer' ? emailTaken : null;
  }

  if (!user) {
    user = new User({
      name: customer.name,
      email,
      password: input.password,
      role: 'customer',
      phone: customer.phone,
      customerId: customer._id,
      referenceId: payload.referenceId,
      status: 'active',
      activatedAt: new Date(),
      lastLoginAt: new Date(),
    });
  } else {
    user.name = customer.name;
    user.email = email;
    user.password = input.password;
    user.role = 'customer';
    user.phone = customer.phone;
    user.customerId = customer._id as mongoose.Types.ObjectId;
    user.referenceId = payload.referenceId;
    user.status = 'active';
    user.activatedAt = new Date();
    user.lastLoginAt = new Date();
  }

  await user.save();

  customer.portalUserId = String(user._id);
  customer.portalStatus = 'active';
  if (!customer.email) customer.email = email;
  await customer.save();

  const token = signCustomerToken(String(user._id), String(customer._id));
  return { user: sanitizePortalUser(user), token };
}

export async function loginPortal(input: { email: string; password: string }) {
  const user = await User.findOne({ email: input.email.toLowerCase(), role: 'customer' }).select('+password');
  if (!user || !(await user.comparePassword(input.password))) {
    throw new ApiError(401, 'Invalid email or password');
  }
  if (user.status === 'disabled') {
    throw new ApiError(403, 'Account is locked. Contact the boutique.');
  }
  if (!user.customerId) {
    throw new ApiError(403, 'Portal account is incomplete. Contact the boutique.');
  }

  user.lastLoginAt = new Date();
  await user.save();

  const token = signCustomerToken(String(user._id), String(user.customerId));
  return { user: sanitizePortalUser(user), token };
}

export async function getPortalDashboard(customerId: string) {
  const customer = await Customer.findById(customerId).lean();
  if (!customer) throw new ApiError(404, 'Customer not found');

  const user = await User.findOne({ customerId, role: 'customer' }).lean();

  const orders = await Order.find({ customerId })
    .sort({ updatedAt: -1 })
    .limit(20)
    .lean();

  const activeOrders = orders.filter(
    (o) => !['cancelled', 'delivery'].includes(o.status),
  );

  const pendingMeasurements = await MeasurementProfile.countDocuments({
    customerId: String(customerId),
    status: 'pending_approval',
  });

  const unreadChat = await PortalMessage.countDocuments({
    customerId,
    senderRole: { $in: ['admin', 'staff'] },
    readAt: { $exists: false },
  });

  const nextTrial = orders
    .map((o) => o.expectedTrialAt)
    .filter(Boolean)
    .sort((a, b) => new Date(a as Date).getTime() - new Date(b as Date).getTime())[0];

  const nextDelivery = orders
    .map((o) => o.expectedDeliveryAt)
    .filter(Boolean)
    .sort((a, b) => new Date(a as Date).getTime() - new Date(b as Date).getTime())[0];

  const outstandingBalance = orders.reduce(
    (sum, o) => sum + (o.paymentSummary?.balance || 0),
    0,
  );

  return {
    welcomeName: customer.name,
    referenceId: user?.referenceId || orders.find((o) => o.referenceId)?.referenceId,
    activeOrderCount: activeOrders.length,
    totalOrderCount: orders.length,
    nextTrialAt: nextTrial ? new Date(nextTrial).toISOString() : undefined,
    nextDeliveryAt: nextDelivery ? new Date(nextDelivery).toISOString() : undefined,
    pendingMeasurementActions: pendingMeasurements,
    unreadChatCount: unreadChat,
    outstandingBalance,
    recentOrders: orders.slice(0, 5).map((o) => customerSafeOrder(o as unknown as Record<string, unknown>)),
  };
}

export async function listPortalOrders(customerId: string) {
  const orders = await Order.find({ customerId }).sort({ createdAt: -1 }).lean();
  return orders.map((o) => customerSafeOrder(o as unknown as Record<string, unknown>));
}

export async function getPortalOrder(customerId: string, orderId: string) {
  if (!mongoose.isValidObjectId(orderId)) {
    throw new ApiError(400, 'Invalid order id');
  }
  const order = await Order.findOne({ _id: orderId, customerId }).lean();
  if (!order) throw new ApiError(404, 'Order not found');
  return customerSafeOrder(order as unknown as Record<string, unknown>);
}

export async function getPortalMeasurementTemplate(code: string) {
  const template = await MeasurementTemplate.findOne({ code: code.toUpperCase(), active: true }).lean();
  if (!template) throw new ApiError(404, 'Measurement template not found');
  return {
    code: template.code,
    name: template.name,
    category: template.category,
    fieldDefs: template.fieldDefs,
    version: template.version,
  };
}

export async function listPortalMeasurementTemplates() {
  const templates = await MeasurementTemplate.find({ active: true })
    .sort({ category: 1, name: 1 })
    .select('code name category fieldDefs version')
    .lean();

  return templates.map((t) => ({
    code: t.code,
    name: t.name,
    category: t.category,
    fieldCount: (t.fieldDefs || []).length,
    version: t.version,
  }));
}

export async function listPortalMeasurements(customerId: string) {
  const profiles = await MeasurementProfile.find({
    customerId: String(customerId),
    status: { $in: ['active', 'pending_approval', 'draft'] },
  })
    .sort({ updatedAt: -1 })
    .lean();

  return profiles.map((p) => ({
    id: String(p._id),
    productTypeCode: p.productTypeCode,
    profileName: p.profileName,
    unit: p.unit,
    status: p.status,
    values: p.values,
    notes: p.notes,
    measuredAt: p.measuredAt?.toISOString?.() ?? p.measuredAt,
    updatedAt: p.updatedAt?.toISOString?.() ?? p.updatedAt,
  }));
}

export async function submitPortalMeasurement(
  customerId: string,
  input: {
    productTypeCode: string;
    profileName?: string;
    unit?: string;
    values: Record<string, unknown>;
    notes?: string;
    orderId?: string;
  },
  actorId: string,
) {
  const template = await MeasurementTemplate.findOne({
    code: input.productTypeCode,
    active: true,
  }).lean();
  if (!template) {
    throw new ApiError(404, 'Measurement template not found');
  }

  for (const field of template.fieldDefs || []) {
    if (field.required) {
      const val = input.values?.[field.key];
      if (val === undefined || val === null || val === '') {
        throw new ApiError(400, `Missing required measurement: ${field.label}`);
      }
    }
  }

  const profile = await createProfile(
    {
      customerId: String(customerId),
      productTypeCode: input.productTypeCode,
      profileName: input.profileName || `${template.name} request`,
      unit: input.unit || 'in',
      status: 'pending_approval',
      values: input.values,
      notes: input.notes,
      orderId: input.orderId,
    },
    actorId,
  );

  try {
    const customer = await Customer.findById(customerId).lean();
    const { notifyMeasurementPending } = await import('./notificationService');
    void notifyMeasurementPending({
      profileId: String(profile.id),
      customerId: String(customerId),
      customerName: customer?.name,
      productTypeCode: input.productTypeCode,
      profileName: profile.profileName,
    }).catch((err) => console.warn('notifyMeasurementPending failed', err));
  } catch {
    // Notifications optional
  }

  return profile;
}

export async function listPortalChat(customerId: string, orderId?: string) {
  const filter: Record<string, unknown> = { customerId };
  if (orderId) {
    if (!mongoose.isValidObjectId(orderId)) throw new ApiError(400, 'Invalid order id');
    filter.orderId = orderId;
  }

  const messages = await PortalMessage.find(filter).sort({ createdAt: 1 }).lean();

  // Mark admin/staff messages as read when customer fetches
  await PortalMessage.updateMany(
    {
      customerId,
      senderRole: { $in: ['admin', 'staff'] },
      readAt: { $exists: false },
      ...(orderId ? { orderId } : {}),
    },
    { $set: { readAt: new Date() } },
  );

  return messages.map((m) => ({
    id: String(m._id),
    orderId: m.orderId ? String(m.orderId) : undefined,
    senderRole: m.senderRole,
    body: m.body,
    attachments: m.attachments || [],
    readAt: m.readAt?.toISOString?.(),
    createdAt: m.createdAt?.toISOString?.() ?? m.createdAt,
  }));
}

export async function postPortalChat(
  customerId: string,
  input: { body: string; orderId?: string; attachments?: string[] },
  senderId: string,
) {
  const body = input.body?.trim();
  if (!body || body.length < 1) {
    throw new ApiError(400, 'Message body is required');
  }

  if (input.orderId) {
    if (!mongoose.isValidObjectId(input.orderId)) throw new ApiError(400, 'Invalid order id');
    const owns = await Order.exists({ _id: input.orderId, customerId });
    if (!owns) throw new ApiError(404, 'Order not found');
  }

  const msg = await PortalMessage.create({
    customerId,
    orderId: input.orderId,
    senderRole: 'customer',
    senderId,
    body,
    attachments: input.attachments || [],
  });

  const dto = {
    id: String(msg._id),
    orderId: msg.orderId ? String(msg.orderId) : undefined,
    senderRole: msg.senderRole,
    body: msg.body,
    attachments: msg.attachments,
    createdAt: msg.createdAt.toISOString(),
  };

  try {
    const { emitPortalChatMessage } = await import('../realtime/portalSocket');
    emitPortalChatMessage(String(customerId), dto);
  } catch {
    // Socket may be unavailable in tests
  }

  return dto;
}

export async function listPortalPayments(customerId: string) {
  const orders = await Order.find({ customerId })
    .select('_id orderNumber referenceId title paymentSummary status createdAt lineItems')
    .sort({ createdAt: -1 })
    .lean();
  const orderIds = orders.map((o) => o._id);
  const orderMap = new Map(orders.map((o) => [String(o._id), o]));

  const payments = await Payment.find({ orderId: { $in: orderIds } })
    .sort({ paidAt: -1 })
    .lean();

  const { computeBillStatus, formatInvoiceNumber } = await import('./invoiceService');

  const outstanding = orders.reduce((sum, o) => sum + (o.paymentSummary?.balance || 0), 0);

  return {
    outstandingBalance: outstanding,
    invoices: orders.map((o) => {
      const ps = o.paymentSummary || { totalQuoted: 0, advance: 0, totalPaid: 0, balance: 0 };
      const quoted = ps.totalQuoted || 0;
      const paid = ps.totalPaid || 0;
      const issuedAt = o.createdAt ? new Date(o.createdAt) : new Date();
      return {
        orderId: String(o._id),
        invoiceNumber: formatInvoiceNumber(o.orderNumber, issuedAt),
        orderNumber: o.orderNumber,
        referenceId: o.referenceId,
        title: o.title,
        status: o.status,
        billStatus: computeBillStatus(quoted, paid),
        invoiceDate: issuedAt.toISOString(),
        paymentSummary: {
          totalQuoted: quoted,
          advance: ps.advance || 0,
          totalPaid: paid,
          balance: ps.balance ?? Math.max(0, quoted - paid),
        },
      };
    }),
    payments: payments.map((p) => {
      const order = orderMap.get(String(p.orderId));
      return {
        id: String(p._id),
        orderId: String(p.orderId),
        referenceId: order?.referenceId,
        orderTitle: order?.title,
        orderNumber: order?.orderNumber,
        amount: p.amount,
        paidAt: p.paidAt?.toISOString?.() ?? p.paidAt,
        method: p.method,
        reference: p.reference,
      };
    }),
  };
}

export async function getPortalInvoice(customerId: string, orderId: string) {
  const { getInvoiceDetail } = await import('./invoiceService');
  return getInvoiceDetail(orderId, { customerId });
}

export async function listPortalCatalog() {
  const types = await ProductType.find({ active: true })
    .populate('categoryId', 'name code')
    .sort({ name: 1 })
    .lean();

  return types.map((t) => {
    const cat = t.categoryId as unknown as { name?: string; code?: string } | null;
    return {
      id: String(t._id),
      code: t.code,
      name: t.name,
      categoryCode: cat?.code,
      categoryName: cat?.name,
      publicDescription: t.publicDescription || t.description,
      indicativePriceRange: t.indicativePriceRange,
      measurementTemplateCode: t.measurementTemplateId,
      image: t.image,
    };
  });
}

export async function createPortalRequest(
  customerId: string,
  input: {
    productTypeCode?: string;
    productName?: string;
    message: string;
    preferredDate?: string;
    preferredTime?: string;
    budget?: string;
    occasion?: string;
    fabricStatus?: string;
  },
) {
  const customer = await Customer.findById(customerId);
  if (!customer) throw new ApiError(404, 'Customer not found');

  const message = input.message?.trim();
  if (!message || message.length < 10) {
    throw new ApiError(400, 'Please describe your request (at least 10 characters)');
  }

  if (!input.preferredDate) {
    throw new ApiError(400, 'Preferred date is required');
  }
  if (!input.budget?.trim()) {
    throw new ApiError(400, 'Budget range is required');
  }

  const preferredDate = new Date(input.preferredDate);
  if (Number.isNaN(preferredDate.getTime())) {
    throw new ApiError(400, 'Invalid preferred date');
  }

  const { Lead } = await import('../models/Lead');
  const productLabel = input.productName || input.productTypeCode || 'Portal request';

  const lead = await Lead.create({
    name: customer.name,
    phone: customer.phone,
    email: customer.email || `portal-${customerId}@kadamba.local`,
    city: customer.address?.city || 'Kurnool',
    locality: customer.address?.locality,
    service: productLabel,
    garmentType: input.productTypeCode,
    occasion: input.occasion?.trim() || 'Portal request',
    budget: input.budget.trim(),
    preferredDate,
    preferredTime: input.preferredTime?.trim() || undefined,
    message,
    fabricStatus: input.fabricStatus?.trim() || undefined,
    inspirationImages: [],
    status: 'New',
    source: 'Request Service',
    assignee: 'Unassigned',
    notes: [],
    timeline: [
      {
        type: 'created',
        label: 'Lead created from customer portal',
        detail: `Customer ${customer.name} requested ${productLabel}`,
        createdAt: new Date(),
      },
    ],
  });

  customer.leadIds = [...(customer.leadIds || []), lead._id as mongoose.Types.ObjectId];
  await customer.save();

  // Auto-create enquiry order — syncs to admin Orders + portal Orders immediately
  const { createEnquiryOrderForLead } = await import('./orderService');
  const order = await createEnquiryOrderForLead({
    lead,
    customerId,
    actorId: `portal:${customerId}`,
    title: `${productLabel} — ${customer.name}`,
    sourceNote: `Customer portal request.\nOccasion: ${input.occasion || '—'}\nBudget: ${input.budget}\nMessage: ${message}`,
  });

  try {
    const { notifyRequestReceived } = await import('./notificationService');
    void notifyRequestReceived({
      leadId: String(lead._id),
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      service: productLabel,
      occasion: input.occasion,
      orderId: order.id,
      orderNumber: order.orderNumber,
      source: 'Portal',
    }).catch((err) => console.warn('notifyRequestReceived failed', err));
  } catch {
    // Notifications optional
  }

  return {
    id: String(lead._id),
    orderId: order.id,
    orderNumber: order.orderNumber,
    message: `Request submitted as Order #${order.orderNumber}. The boutique will follow up shortly.`,
  };
}

/** Admin: reply in portal chat */
export async function adminReplyPortalChat(input: {
  customerId: string;
  orderId?: string;
  body: string;
  attachments?: string[];
  senderId: string;
  senderRole?: 'admin' | 'staff';
}) {
  if (!mongoose.isValidObjectId(input.customerId)) {
    throw new ApiError(400, 'Invalid customer id');
  }
  const exists = await Customer.exists({ _id: input.customerId });
  if (!exists) throw new ApiError(404, 'Customer not found');

  const body = input.body?.trim();
  if (!body) throw new ApiError(400, 'Message body is required');

  const msg = await PortalMessage.create({
    customerId: input.customerId,
    orderId: input.orderId,
    senderRole: input.senderRole || 'admin',
    senderId: input.senderId,
    body,
    attachments: input.attachments || [],
  });

  const dto = {
    id: String(msg._id),
    customerId: String(msg.customerId),
    orderId: msg.orderId ? String(msg.orderId) : undefined,
    senderRole: msg.senderRole,
    body: msg.body,
    attachments: msg.attachments,
    createdAt: msg.createdAt.toISOString(),
  };

  try {
    const { emitPortalChatMessage } = await import('../realtime/portalSocket');
    emitPortalChatMessage(String(msg.customerId), {
      id: dto.id,
      orderId: dto.orderId,
      senderRole: dto.senderRole,
      body: dto.body,
      attachments: dto.attachments,
      createdAt: dto.createdAt,
    });
  } catch {
    // Socket may be unavailable in tests
  }

  return dto;
}

export async function adminListPortalChat(customerId: string, orderId?: string) {
  if (!mongoose.isValidObjectId(customerId)) {
    throw new ApiError(400, 'Invalid customer id');
  }
  const filter: Record<string, unknown> = { customerId };
  if (orderId) filter.orderId = orderId;

  const messages = await PortalMessage.find(filter).sort({ createdAt: 1 }).lean();
  return messages.map((m) => ({
    id: String(m._id),
    orderId: m.orderId ? String(m.orderId) : undefined,
    senderRole: m.senderRole,
    senderId: m.senderId,
    body: m.body,
    attachments: m.attachments || [],
    readAt: m.readAt?.toISOString?.(),
    createdAt: m.createdAt?.toISOString?.() ?? m.createdAt,
  }));
}

export async function approveMeasurementProfile(id: string) {
  if (!mongoose.isValidObjectId(id)) throw new ApiError(400, 'Invalid profile id');
  const profile = await MeasurementProfile.findById(id);
  if (!profile) throw new ApiError(404, 'Measurement profile not found');

  const customer = await Customer.findById(profile.customerId);
  const customerName = customer?.name?.trim();

  // Save approved profile under the customer's name for admin clarity
  if (customerName) {
    const baseName = profile.profileName
      .replace(new RegExp(`^${customerName}\\s*[—-]\\s*`, 'i'), '')
      .replace(/\s*\(update\)\s*$/i, '')
      .trim();
    profile.profileName = `${customerName} — ${baseName || profile.productTypeCode}`;
  }

  profile.status = 'active';
  await profile.save();

  const result = {
    id: String(profile._id),
    status: profile.status,
    profileName: profile.profileName,
    customerName: customerName || undefined,
    customerId: String(profile.customerId),
  };

  try {
    const { notifyMeasurementApproved } = await import('./notificationService');
    void notifyMeasurementApproved({
      profileId: result.id,
      customerId: result.customerId,
      customerName: customerName,
      customerEmail: customer?.email,
      productTypeCode: profile.productTypeCode,
      profileName: profile.profileName,
    }).catch((err) => console.warn('notifyMeasurementApproved failed', err));
  } catch {
    // Notifications optional
  }

  return result;
}

/**
 * After order confirmation: invite customer to portal + email Reference ID.
 * Hardened: always logs Reference ID; email when SMTP configured.
 */
export async function notifyOrderConfirmed(orderId: string) {
  const order = await Order.findById(orderId);
  if (!order || !order.referenceId) return;

  const customer = await Customer.findById(order.customerId);
  if (!customer) return;

  if (customer.portalStatus !== 'active') {
    customer.portalStatus = 'invited';
    await customer.save();
  }

  const activateUrl = `${env.frontendUrl}/portal/activate?ref=${encodeURIComponent(order.referenceId)}`;
  const adminTo = env.email.to || env.email.user;

  console.info('[notify:order-confirmed]', {
    orderId: String(order._id),
    orderNumber: order.orderNumber,
    referenceId: order.referenceId,
    customer: customer.name,
    phone: customer.phone,
    email: customer.email,
    activateUrl,
  });

  const customerText = [
    `Dear ${customer.name},`,
    '',
    `Your order "${order.title}" is confirmed at Kadamba's Designer Studio, Kurnool.`,
    `Reference ID: ${order.referenceId}`,
    '',
    `Keep this Reference ID safe — you need it to activate your customer portal.`,
    `Activate portal: ${activateUrl}`,
    '',
    `In the portal you can track orders, share measurements, and chat with the boutique.`,
    '',
    `— Kadamba's Designer Studio, Kurnool`,
  ].join('\n');

  if (customer.email && !customer.email.includes('@kadamba.local')) {
    await sendEmail({
      to: customer.email,
      subject: `Order confirmed — Reference ${order.referenceId} · Kadamba's Designer Studio`,
      text: customerText,
      html: `
        <p>Dear ${escapeHtml(customer.name)},</p>
        <p>Your order <strong>${escapeHtml(order.title)}</strong> is confirmed at <strong>Kadamba's Designer Studio</strong>, Kurnool.</p>
        <p style="font-size:1.15em">Reference ID: <strong style="letter-spacing:0.08em">${escapeHtml(order.referenceId)}</strong></p>
        <p>Keep this Reference ID safe — you need it to activate your customer portal.</p>
        <p><a href="${activateUrl}" style="display:inline-block;padding:10px 16px;background:#111;color:#fff;text-decoration:none;border-radius:4px">Activate your customer portal</a></p>
        <p style="font-size:0.9em;color:#555">Or open: ${escapeHtml(activateUrl)}</p>
        <p>In the portal you can track orders, share measurements, and chat with the boutique.</p>
        <p>— Kadamba's Designer Studio, Kurnool</p>
      `,
    });
  }

  if (adminTo && !String(adminTo).startsWith('your_')) {
    await sendEmail({
      to: adminTo,
      subject: `Order confirmed — ${order.referenceId}`,
      text: `Order ${order.orderNumber} confirmed. Reference ${order.referenceId}. Customer: ${customer.name} (${customer.phone}). Activate: ${activateUrl}`,
      html: `<p>Order <strong>#${order.orderNumber}</strong> confirmed.</p>
        <p>Reference: <strong>${escapeHtml(order.referenceId)}</strong></p>
        <p>Customer: ${escapeHtml(customer.name)} · ${escapeHtml(customer.phone)}</p>
        <p>Portal activate: <a href="${activateUrl}">${escapeHtml(activateUrl)}</a></p>`,
    });
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
