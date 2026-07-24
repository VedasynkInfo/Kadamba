import type { Request, Response } from 'express';
import { Customer } from '../models/Customer';
import { Order } from '../models/Order';
import { MeasurementProfile } from '../models/MeasurementProfile';
import { asyncHandler } from '../utils/asyncHandler';
import { parsePagination, buildPaginationMeta } from '../utils/pagination';

export const listCustomersHandler = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, skip } = parsePagination(req.query);
  const filter: Record<string, any> = { archivedAt: { $exists: false } };

  // Query search
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';
  if (q) {
    const regex = new RegExp(q, 'i');
    filter.$or = [
      { name: regex },
      { phone: regex },
      { email: regex },
      { 'address.locality': regex },
      { tags: regex },
    ];
  }

  // Filter params
  const { locality, tag, portalStatus, source, hasOpenOrders } = req.query;

  if (typeof locality === 'string' && locality.trim()) {
    filter['address.locality'] = new RegExp(locality.trim(), 'i');
  }

  if (typeof tag === 'string' && tag.trim()) {
    filter.tags = tag.trim();
  }

  if (typeof portalStatus === 'string' && portalStatus.trim()) {
    filter.portalStatus = portalStatus.trim();
  }

  if (typeof source === 'string' && source.trim()) {
    filter.source = source.trim();
  }

  if (typeof hasOpenOrders === 'string' && hasOpenOrders.trim()) {
    const activeCustomerIds = await Order.distinct('customerId', {
      status: { $nin: ['delivery', 'cancelled'] },
    });
    if (hasOpenOrders === 'true') {
      filter._id = { $in: activeCustomerIds };
    } else {
      filter._id = { $nin: activeCustomerIds };
    }
  }

  const [docs, total] = await Promise.all([
    Customer.find(filter).sort({ name: 1 }).skip(skip).limit(limit).lean(),
    Customer.countDocuments(filter),
  ]);

  const customerIds = docs.map((d) => d._id);

  // Group aggregates for order counts and last order dates
  const orderStats = await Order.aggregate([
    { $match: { customerId: { $in: customerIds } } },
    {
      $group: {
        _id: '$customerId',
        orderCount: { $sum: 1 },
        lastOrderDate: { $max: '$createdAt' },
      },
    },
  ]);

  const statsMap = new Map(
    orderStats.map((stat) => [stat._id.toString(), { count: stat.orderCount, lastDate: stat.lastOrderDate }])
  );

  const items = docs.map((doc) => {
    const stats = statsMap.get(doc._id.toString()) || { count: 0, lastDate: undefined };
    return {
      id: doc._id.toString(),
      name: doc.name,
      phone: doc.phone,
      email: doc.email,
      whatsapp: doc.whatsapp,
      address: doc.address,
      source: doc.source,
      tags: doc.tags || [],
      notes: doc.notes,
      portalStatus: doc.portalStatus,
      preferredUnit: doc.preferredUnit,
      orderCount: stats.count,
      lastOrderDate: stats.lastDate?.toISOString(),
      createdAt: doc.createdAt?.toISOString(),
    };
  });

  res.status(200).json({
    success: true,
    message: 'Customers listed successfully',
    data: {
      items,
      pagination: buildPaginationMeta(page, limit, total),
    },
  });
});

export const getCustomerHandler = asyncHandler(async (req: Request, res: Response) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer || customer.archivedAt) {
    res.status(404).json({ success: false, message: 'Customer record not found' });
    return;
  }

  // Aggregate summaries
  const [orderCount, activeOrderCount, measurementCount, orders] = await Promise.all([
    Order.countDocuments({ customerId: String(customer._id) }),
    Order.countDocuments({ customerId: String(customer._id), status: { $nin: ['delivery', 'cancelled'] } }),
    MeasurementProfile.countDocuments({ customerId: String(customer._id) }),
    Order.find({ customerId: customer._id }).lean(),
    Order.find({ customerId: customer._id }).lean(),
  ]);

  const totalSpent = orders.reduce((sum, o) => sum + (o.paymentSummary?.totalPaid || 0), 0);

  res.status(200).json({
    success: true,
    data: {
      id: customer._id.toString(),
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      whatsapp: customer.whatsapp,
      address: customer.address,
      source: customer.source,
      tags: customer.tags || [],
      notes: customer.notes,
      crmNotes: customer.crmNotes || [],
      portalStatus: customer.portalStatus,
      preferredUnit: customer.preferredUnit,
      portalUserId: customer.portalUserId,
      createdAt: customer.createdAt.toISOString(),
      updatedAt: customer.updatedAt.toISOString(),
      summary: {
        orderCount,
        activeOrderCount,
        measurementCount,
        totalSpent,
      },
    },
  });
});

export const createCustomerHandler = asyncHandler(async (req: Request, res: Response) => {
  const { name, phone, email, whatsapp, address, source, tags, notes, force } = req.body as {
    name: string;
    phone: string;
    email?: string;
    whatsapp?: string;
    address?: Record<string, any>;
    source?: string;
    tags?: string[];
    notes?: string;
    force?: boolean;
  };

  const normalizedPhone = phone.trim();

  // Soft Uniqueness Check
  if (!force) {
    const existing = await Customer.findOne({ phone: normalizedPhone, archivedAt: { $exists: false } });
    if (existing) {
      res.status(409).json({
        success: false,
        message: 'A customer with this phone number already exists',
        duplicateFound: true,
        data: {
          id: existing._id.toString(),
          name: existing.name,
          phone: existing.phone,
        },
      });
      return;
    }
  }

  const customer = await Customer.create({
    name: name.trim(),
    phone: normalizedPhone,
    email: email ? email.trim() : undefined,
    whatsapp: whatsapp ? whatsapp.trim() : undefined,
    address,
    source,
    tags,
    notes,
  });

  res.status(201).json({
    success: true,
    message: 'Customer created successfully',
    data: {
      id: customer._id.toString(),
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      whatsapp: customer.whatsapp,
      address: customer.address,
      source: customer.source,
      tags: customer.tags,
      notes: customer.notes,
      createdAt: customer.createdAt.toISOString(),
    },
  });
});

export const updateCustomerHandler = asyncHandler(async (req: Request, res: Response) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer || customer.archivedAt) {
    res.status(404).json({ success: false, message: 'Customer record not found' });
    return;
  }

  const { name, phone, email, whatsapp, address, source, tags, notes, portalStatus, preferredUnit, archive } = req.body;

  if (archive) {
    // Soft Delete check
    const activeOrders = await Order.countDocuments({
      customerId: String(customer._id),
      status: { $nin: ['delivery', 'cancelled'] },
    });

    if (activeOrders > 0) {
      res.status(400).json({
        success: false,
        message: 'Cannot archive a customer record with active, pending tailoring orders.',
      });
      return;
    }

    customer.archivedAt = new Date();
    await customer.save();
    res.status(200).json({ success: true, message: 'Customer record archived successfully' });
    return;
  }

  if (name !== undefined) customer.name = name.trim();
  if (phone !== undefined) customer.phone = phone.trim();
  if (email !== undefined) customer.email = email ? email.trim() : undefined;
  if (whatsapp !== undefined) customer.whatsapp = whatsapp ? whatsapp.trim() : undefined;
  if (address !== undefined) customer.address = address;
  if (source !== undefined) customer.source = source;
  if (tags !== undefined) customer.tags = tags;
  if (notes !== undefined) customer.notes = notes;
  if (portalStatus !== undefined) customer.portalStatus = portalStatus;
  if (preferredUnit !== undefined) customer.preferredUnit = preferredUnit;

  await customer.save();

  res.status(200).json({
    success: true,
    message: 'Customer updated successfully',
    data: {
      id: customer._id.toString(),
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      whatsapp: customer.whatsapp,
      address: customer.address,
      tags: customer.tags,
      notes: customer.notes,
      portalStatus: customer.portalStatus,
      preferredUnit: customer.preferredUnit,
      updatedAt: customer.updatedAt.toISOString(),
    },
  });
});

export const addCustomerNoteHandler = asyncHandler(async (req: Request, res: Response) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer || customer.archivedAt) {
    res.status(404).json({ success: false, message: 'Customer record not found' });
    return;
  }

  const { body, pinned } = req.body as { body: string; pinned?: boolean };

  if (!body || !body.trim()) {
    res.status(400).json({ success: false, message: 'Note body is required' });
    return;
  }

  const note = {
    body: body.trim(),
    pinned: !!pinned,
    createdBy: (req as any).user?.name || 'Admin',
    createdAt: new Date(),
  };

  customer.crmNotes = customer.crmNotes || [];
  customer.crmNotes.push(note);
  await customer.save();

  res.status(201).json({
    success: true,
    message: 'CRM note added successfully',
    data: customer.crmNotes,
  });
});

export const getCustomerOrdersHandler = asyncHandler(async (req: Request, res: Response) => {
  const orders = await Order.find({ customerId: req.params.id }).sort({ createdAt: -1 });
  res.status(200).json({
    success: true,
    data: orders,
  });
});

export const getCustomerMeasurementsHandler = asyncHandler(async (req: Request, res: Response) => {
  const measurements = await MeasurementProfile.find({ customerId: req.params.id }).sort({ updatedAt: -1 });
  res.status(200).json({
    success: true,
    data: measurements,
  });
});
