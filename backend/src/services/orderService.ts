import mongoose from 'mongoose';
import { Order, IOrder, OrderStatus, OrderPriority, IOrderLineItem, IOrderStaff, IOrderNote } from '../models/Order';
import { Customer } from '../models/Customer';
import { Lead } from '../models/Lead';
import { ApiError } from '../utils/ApiError';
import { buildPaginationMeta, parsePagination } from '../utils/pagination';
import { searchRegex } from '../utils/query';

export interface CreateOrderInput {
  customerId: string;
  leadId?: string;
  title: string;
  status?: OrderStatus;
  priority?: OrderPriority;
  lineItems: IOrderLineItem[];
  expectedTrialAt?: string;
  expectedDeliveryAt?: string;
  tags?: string[];
  paymentSummary?: {
    totalQuoted?: number;
    advance?: number;
    totalPaid?: number;
  };
  notes?: string;
  actorId: string;
}

export interface UpdateOrderInput {
  title?: string;
  priority?: OrderPriority;
  lineItems?: IOrderLineItem[];
  expectedTrialAt?: string;
  expectedDeliveryAt?: string;
  actualTrialAt?: string;
  actualDeliveryAt?: string;
  tags?: string[];
  paymentSummary?: {
    totalQuoted?: number;
    advance?: number;
    totalPaid?: number;
  };
}

export interface OrderDto {
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
  status: OrderStatus;
  priority: OrderPriority;
  title: string;
  lineItems: IOrderLineItem[];
  measurementProfileIds: string[];
  assignedStaff: IOrderStaff[];
  expectedTrialAt?: string;
  expectedDeliveryAt?: string;
  actualTrialAt?: string;
  actualDeliveryAt?: string;
  tags: string[];
  notes: Array<{
    body: string;
    visibility: 'internal' | 'customer';
    createdBy: string;
    createdAt: string;
  }>;
  timeline: Array<{
    status: OrderStatus;
    note?: string;
    actorId: string;
    at: string;
  }>;
  paymentSummary: {
    totalQuoted: number;
    advance: number;
    totalPaid: number;
    balance: number;
  };
  attachments: string[];
  cancelledReason?: string;
  createdAt: string;
  updatedAt: string;
}

function serializeOrder(doc: any): OrderDto {
  const customer = doc.customerId;
  return {
    id: doc._id.toString(),
    orderNumber: doc.orderNumber,
    referenceId: doc.referenceId,
    customerId: {
      id: customer?._id?.toString() || doc.customerId?.toString() || '',
      name: customer?.name || 'Unknown Customer',
      phone: customer?.phone || '',
      email: customer?.email,
      city: customer?.city,
    },
    leadId: doc.leadId?.toString(),
    status: doc.status,
    priority: doc.priority,
    title: doc.title,
    lineItems: doc.lineItems || [],
    measurementProfileIds: doc.measurementProfileIds || [],
    assignedStaff: doc.assignedStaff || [],
    expectedTrialAt: doc.expectedTrialAt?.toISOString()?.slice(0, 10),
    expectedDeliveryAt: doc.expectedDeliveryAt?.toISOString()?.slice(0, 10),
    actualTrialAt: doc.actualTrialAt?.toISOString(),
    actualDeliveryAt: doc.actualDeliveryAt?.toISOString(),
    tags: doc.tags || [],
    notes: (doc.notes || []).map((n: any) => ({
      body: n.body,
      visibility: n.visibility,
      createdBy: n.createdBy,
      createdAt: n.createdAt?.toISOString(),
    })),
    timeline: (doc.timeline || []).map((t: any) => ({
      status: t.status,
      note: t.note,
      actorId: t.actorId,
      at: t.at?.toISOString(),
    })),
    paymentSummary: {
      totalQuoted: doc.paymentSummary?.totalQuoted || 0,
      advance: doc.paymentSummary?.advance || 0,
      totalPaid: doc.paymentSummary?.totalPaid || 0,
      balance: doc.paymentSummary?.balance || 0,
    },
    attachments: doc.attachments || [],
    cancelledReason: doc.cancelledReason,
    createdAt: doc.createdAt?.toISOString(),
    updatedAt: doc.updatedAt?.toISOString(),
  };
}

/**
 * Generate a unique Reference ID on transition to confirmed.
 */
function generateReferenceId(orderNumber: number): string {
  const year = new Date().getFullYear();
  return `KDS-${year}-${String(orderNumber).padStart(4, '0')}`;
}

/**
 * Create a new custom order.
 */
export async function createOrder(input: CreateOrderInput): Promise<OrderDto> {
  if (!mongoose.isValidObjectId(input.customerId)) {
    throw new ApiError(400, 'Invalid Customer ID');
  }
  const customerExists = await Customer.exists({ _id: input.customerId });
  if (!customerExists) {
    throw new ApiError(404, 'Customer not found');
  }

  // 1. Fetch next sequential order number
  const lastOrder = await Order.findOne().sort({ orderNumber: -1 }).select('orderNumber').lean();
  const orderNumber = (lastOrder?.orderNumber || 0) + 1;

  // 2. Set referenceId if confirmed on creation
  const status = input.status || 'enquiry';
  const referenceId = status === 'confirmed' ? generateReferenceId(orderNumber) : undefined;

  const totalQuoted = input.paymentSummary?.totalQuoted || 0;
  const advance = input.paymentSummary?.advance || 0;
  const totalPaid = input.paymentSummary?.totalPaid || advance; // default totalPaid to advance

  const notesList: IOrderNote[] = [];
  if (input.notes && input.notes.trim()) {
    notesList.push({
      body: input.notes.trim(),
      visibility: 'internal',
      createdBy: input.actorId,
      createdAt: new Date(),
    });
  }

  const order = await Order.create({
    orderNumber,
    referenceId,
    customerId: input.customerId,
    leadId: input.leadId,
    status,
    priority: input.priority || 'normal',
    title: input.title,
    lineItems: input.lineItems,
    expectedTrialAt: input.expectedTrialAt ? new Date(input.expectedTrialAt) : undefined,
    expectedDeliveryAt: input.expectedDeliveryAt ? new Date(input.expectedDeliveryAt) : undefined,
    tags: input.tags || [],
    notes: notesList,
    timeline: [
      {
        status,
        note: 'Order created',
        actorId: input.actorId,
        at: new Date(),
      },
    ],
    paymentSummary: {
      totalQuoted,
      advance,
      totalPaid,
      balance: totalQuoted - totalPaid,
    },
  });

  // Keep Lead ↔ Order in sync when order is created with a leadId
  if (input.leadId && mongoose.isValidObjectId(input.leadId)) {
    try {
      await Lead.findByIdAndUpdate(input.leadId, {
        orderId: order._id,
        orderNumber,
        ...(referenceId ? { referenceId } : {}),
        $push: {
          timeline: {
            type: 'status',
            label: 'Order linked',
            detail: referenceId
              ? `Order #${orderNumber} · ${referenceId}`
              : `Order #${orderNumber} (enquiry)`,
            createdAt: new Date(),
          },
        },
      });
    } catch (err) {
      console.warn('Failed to sync lead after order create', err);
    }
  }

  const populated = await order.populate('customerId');
  return serializeOrder(populated);
}

/**
 * Get order by ID.
 */
export async function getOrderById(id: string): Promise<OrderDto> {
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, 'Invalid Order ID');
  }
  const order = await Order.findById(id).populate('customerId');
  if (!order) {
    throw new ApiError(404, 'Order not found');
  }
  return serializeOrder(order);
}

/**
 * List orders with search, filters and pagination.
 */
export async function listOrders(query: Record<string, unknown>) {
  const { page, limit, skip } = parsePagination(query);
  const filter: Record<string, any> = {};

  // Status filter (supports multi-select or single)
  if (typeof query.status === 'string' && query.status && query.status !== 'All') {
    filter.status = query.status;
  } else if (Array.isArray(query.status)) {
    filter.status = { $in: query.status };
  }

  // Priority filter
  if (typeof query.priority === 'string' && query.priority) {
    filter.priority = query.priority;
  }

  // Date range filter on delivery date
  if (typeof query.deliveryFrom === 'string' && query.deliveryFrom) {
    filter.expectedDeliveryAt = { ...filter.expectedDeliveryAt, $gte: new Date(query.deliveryFrom) };
  }
  if (typeof query.deliveryTo === 'string' && query.deliveryTo) {
    filter.expectedDeliveryAt = { ...filter.expectedDeliveryAt, $lte: new Date(query.deliveryTo) };
  }

  // Client-side search (referenceId, title, customer name/phone/email)
  const q = typeof query.q === 'string' ? query.q.trim() : '';
  if (q) {
    const regex = new RegExp(q, 'i');
    
    // Find matching customers first to search in orders
    const matchingCustomers = await Customer.find({
      $or: [{ name: regex }, { phone: regex }, { email: regex }],
    }).select('_id').lean();
    const customerIds = matchingCustomers.map((c) => c._id);

    filter.$or = [
      { referenceId: regex },
      { title: regex },
      { customerId: { $in: customerIds } },
    ];
  }

  const [docs, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('customerId'),
    Order.countDocuments(filter),
  ]);

  return {
    items: docs.map((d) => serializeOrder(d)),
    pagination: buildPaginationMeta(page, limit, total),
  };
}

/**
 * Update general fields on order.
 */
export async function updateOrder(id: string, input: UpdateOrderInput): Promise<OrderDto> {
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, 'Invalid Order ID');
  }

  const order = await Order.findById(id);
  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  if (input.title !== undefined) order.title = input.title;
  if (input.priority !== undefined) order.priority = input.priority;
  if (input.lineItems !== undefined) order.lineItems = input.lineItems;
  
  if (input.expectedTrialAt !== undefined) {
    order.expectedTrialAt = input.expectedTrialAt ? new Date(input.expectedTrialAt) : undefined;
  }
  if (input.expectedDeliveryAt !== undefined) {
    order.expectedDeliveryAt = input.expectedDeliveryAt ? new Date(input.expectedDeliveryAt) : undefined;
  }
  if (input.actualTrialAt !== undefined) {
    order.actualTrialAt = input.actualTrialAt ? new Date(input.actualTrialAt) : undefined;
  }
  if (input.actualDeliveryAt !== undefined) {
    order.actualDeliveryAt = input.actualDeliveryAt ? new Date(input.actualDeliveryAt) : undefined;
  }
  if (input.tags !== undefined) order.tags = input.tags;

  if (input.paymentSummary !== undefined) {
    const totalQuoted = input.paymentSummary.totalQuoted !== undefined
      ? input.paymentSummary.totalQuoted
      : order.paymentSummary.totalQuoted;
    
    const advance = input.paymentSummary.advance !== undefined
      ? input.paymentSummary.advance
      : order.paymentSummary.advance;

    const totalPaid = input.paymentSummary.totalPaid !== undefined
      ? input.paymentSummary.totalPaid
      : order.paymentSummary.totalPaid;

    order.paymentSummary = {
      totalQuoted,
      advance,
      totalPaid,
      balance: totalQuoted - totalPaid,
    };
  }

  await order.save();
  const populated = await order.populate('customerId');
  return serializeOrder(populated);
}

/**
 * Transition order status.
 */
export async function transitionOrderStatus(
  id: string,
  newStatus: OrderStatus,
  actorId: string,
  note?: string,
): Promise<OrderDto> {
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, 'Invalid Order ID');
  }

  const order = await Order.findById(id);
  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  if (order.status === newStatus) {
    return serializeOrder(await order.populate('customerId'));
  }

  // Confirming order generates immutable Reference ID
  if (newStatus === 'confirmed' && !order.referenceId) {
    order.referenceId = generateReferenceId(order.orderNumber);
  }

  // Cancelled order logic
  if (newStatus === 'cancelled') {
    order.cancelledReason = note || 'No cancellation reason provided';
  }

  order.status = newStatus;
  order.timeline.push({
    status: newStatus,
    note: note || `Status transitioned to ${newStatus}`,
    actorId,
    at: new Date(),
  });

  await order.save();

  // Keep linked lead in sync (status + reference ID for admin/user visibility)
  if (order.leadId) {
    try {
      const lead = await Lead.findById(order.leadId);
      if (lead) {
        if (order.referenceId && lead.referenceId !== order.referenceId) {
          lead.referenceId = order.referenceId;
        }
        if (newStatus === 'confirmed' && lead.status !== 'Completed') {
          lead.status = 'Qualified';
          lead.timeline.push({
            type: 'status',
            label: 'Order confirmed',
            detail: order.referenceId
              ? `Reference ID ${order.referenceId} issued`
              : 'Workshop order confirmed',
            createdAt: new Date(),
          });
        }
        if (newStatus === 'delivery') {
          lead.status = 'Completed';
          lead.timeline.push({
            type: 'status',
            label: 'Order delivered',
            detail: order.referenceId || `Order #${order.orderNumber}`,
            createdAt: new Date(),
          });
        }
        if (newStatus === 'cancelled') {
          lead.timeline.push({
            type: 'status',
            label: 'Order cancelled',
            detail: note || order.cancelledReason,
            createdAt: new Date(),
          });
        }
        await lead.save();
      }
    } catch (err) {
      console.warn('Lead sync after order status failed', err);
    }
  }

  const populated = await order.populate('customerId');
  const dto = serializeOrder(populated);

  try {
    const { notifyOrderStatusChanged } = await import('./notificationService');
    notifyOrderStatusChanged({
      orderId: dto.id,
      orderNumber: dto.orderNumber,
      customerId: String(order.customerId),
      status: dto.status,
      referenceId: dto.referenceId,
      title: dto.title,
    });
  } catch {
    // Notifications optional
  }

  return dto;
}

/**
 * Assign staff roles to the order.
 */
export async function assignStaff(id: string, staffList: IOrderStaff[]): Promise<OrderDto> {
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, 'Invalid Order ID');
  }

  const order = await Order.findById(id);
  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  order.assignedStaff = staffList;
  await order.save();
  
  const populated = await order.populate('customerId');
  return serializeOrder(populated);
}

/**
 * Link measurement profile ids to the order.
 */
export async function linkMeasurementProfiles(id: string, profileIds: string[]): Promise<OrderDto> {
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, 'Invalid Order ID');
  }

  const order = await Order.findById(id);
  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  order.measurementProfileIds = profileIds;
  await order.save();
  
  const populated = await order.populate('customerId');
  return serializeOrder(populated);
}

/**
 * Add note to order.
 */
export async function addOrderNote(
  id: string,
  body: string,
  visibility: 'internal' | 'customer',
  createdBy: string,
): Promise<OrderDto> {
  if (!mongoose.isValidObjectId(id)) {
    throw new ApiError(400, 'Invalid Order ID');
  }
  const trimmed = body.trim();
  if (!trimmed) {
    throw new ApiError(400, 'Note body cannot be empty');
  }

  const order = await Order.findById(id);
  if (!order) {
    throw new ApiError(404, 'Order not found');
  }

  order.notes.push({
    body: trimmed,
    visibility,
    createdBy,
    createdAt: new Date(),
  });

  await order.save();
  const populated = await order.populate('customerId');
  return serializeOrder(populated);
}

/**
 * Create an enquiry-stage workshop order for a lead and keep Lead ↔ Order fields in sync.
 * Used when a public/portal request is raised and when admin converts a legacy lead.
 */
export async function createEnquiryOrderForLead(input: {
  lead: InstanceType<typeof Lead>;
  customerId: string | mongoose.Types.ObjectId;
  actorId: string;
  title?: string;
  sourceNote?: string;
}): Promise<OrderDto> {
  const { lead, actorId } = input;

  if (lead.orderId) {
    const existing = await Order.findById(lead.orderId).populate('customerId');
    if (existing) return serializeOrder(existing);
  }

  const totalQuoted = parseFloat(String(lead.budget || '').replace(/\D/g, '')) || 0;
  const expectedDeliveryAt = lead.preferredDate ? new Date(lead.preferredDate) : undefined;
  let expectedTrialAt: Date | undefined;
  if (expectedDeliveryAt) {
    expectedTrialAt = new Date(expectedDeliveryAt);
    expectedTrialAt.setDate(expectedTrialAt.getDate() - 7);
  }

  const lastOrder = await Order.findOne().sort({ orderNumber: -1 }).select('orderNumber').lean();
  const orderNumber = (lastOrder?.orderNumber || 0) + 1;

  const customer = await Customer.findById(input.customerId);
  const customerName = customer?.name || lead.name;

  const order = await Order.create({
    orderNumber,
    customerId: input.customerId,
    leadId: lead._id,
    status: 'enquiry',
    priority: 'normal',
    title: input.title || `${lead.service} — ${customerName}`,
    lineItems: [
      {
        name: lead.service,
        productTypeCode: lead.garmentType || undefined,
        qty: 1,
        notes: `Occasion: ${lead.occasion}. Budget range: ${lead.budget}`,
      },
    ],
    expectedTrialAt,
    expectedDeliveryAt,
    notes: [
      {
        body:
          input.sourceNote ||
          `Created from request. Occasion: ${lead.occasion}\nBudget: ${lead.budget}\nMessage: ${lead.message}`,
        visibility: 'internal' as const,
        createdBy: actorId,
        createdAt: new Date(),
      },
    ],
    timeline: [
      {
        status: 'enquiry' as const,
        note: 'Enquiry order created from request',
        actorId,
        at: new Date(),
      },
    ],
    paymentSummary: {
      totalQuoted,
      advance: 0,
      totalPaid: 0,
      balance: totalQuoted,
    },
  });

  lead.orderId = order._id as mongoose.Types.ObjectId;
  lead.orderNumber = orderNumber;
  if (lead.status === 'New') {
    lead.status = 'Contacted';
  }
  lead.timeline.push({
    type: 'status',
    label: 'Enquiry order created',
    detail: `Order #${orderNumber} — visible in Orders desk`,
    createdAt: new Date(),
  });
  await lead.save();

  const populated = await order.populate('customerId');
  return serializeOrder(populated);
}

/**
 * Convert lead to order (idempotent — returns existing linked order if present).
 */
export async function convertLeadToOrder(leadId: string, actorId: string): Promise<OrderDto> {
  if (!mongoose.isValidObjectId(leadId)) {
    throw new ApiError(400, 'Invalid Lead ID');
  }

  const lead = await Lead.findById(leadId);
  if (!lead) {
    throw new ApiError(404, 'Lead not found');
  }

  if (lead.orderId) {
    const existing = await Order.findById(lead.orderId).populate('customerId');
    if (existing) {
      if (lead.status === 'New' || lead.status === 'Contacted') {
        lead.status = 'Qualified';
        await lead.save();
      }
      return serializeOrder(existing);
    }
  }

  let customer = await Customer.findOne({
    $or: [
      { phone: lead.phone },
      ...(lead.email ? [{ email: lead.email }] : []),
    ],
  });

  if (!customer) {
    customer = await Customer.create({
      name: lead.name,
      phone: lead.phone,
      email: lead.email || undefined,
      address: { city: lead.city || undefined },
      notes: `Created from request service lead. Message: ${lead.message}`,
      leadIds: [lead._id],
    });
  }

  const order = await createEnquiryOrderForLead({
    lead,
    customerId: customer._id as mongoose.Types.ObjectId,
    actorId,
    title: `Bridal consultation — ${customer.name}`,
    sourceNote: `Converted from request consultation lead. Initial request details:\nOccasion: ${lead.occasion}\nBudget: ${lead.budget}\nMessage: ${lead.message}`,
  });

  lead.status = 'Qualified';
  lead.timeline.push({
    type: 'status',
    label: 'Converted to Order',
    detail: `Order #${order.orderNumber} linked`,
    createdAt: new Date(),
  });
  await lead.save();

  return order;
}
