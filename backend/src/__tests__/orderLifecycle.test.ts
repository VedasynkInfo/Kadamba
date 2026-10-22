import request from 'supertest';
import { describe, expect, it, beforeEach } from 'vitest';
import { createApp } from '../app';
import { Customer } from '../models/Customer';
import { Lead } from '../models/Lead';
import { MeasurementProfile } from '../models/MeasurementProfile';
import { Order } from '../models/Order';
import { registerAdminAndGetToken } from './helpers/auth';

const app = createApp();

async function seedCustomer() {
  return Customer.create({
    name: 'Meera Kumari',
    phone: '9000000001',
    email: 'meera@example.com',
  });
}

describe('order lifecycle', () => {
  beforeEach(async () => {
    await Order.deleteMany({});
    await Lead.deleteMany({});
    await Customer.deleteMany({});
    await MeasurementProfile.deleteMany({});
  });

  it('creates an order with a generated number', async () => {
    const token = await registerAdminAndGetToken(app);
    const customer = await seedCustomer();

    const res = await request(app)
      .post('/api/admin/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerId: String(customer._id),
        title: 'Bridal Lehenga',
        lineItems: [{ name: 'Bridal Lehenga', qty: 1, productTypeCode: 'BR-LH' }],
        expectedDeliveryAt: '2030-01-01T00:00:00.000Z',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.orderNumber).toBeGreaterThan(0);
    expect(res.body.data.title).toBe('Bridal Lehenga');
  });

  it('refuses an order without a line item', async () => {
    const token = await registerAdminAndGetToken(app);
    const customer = await seedCustomer();

    const res = await request(app)
      .post('/api/admin/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({ customerId: String(customer._id), title: 'Empty order', lineItems: [] });

    expect(res.status).toBe(400);
  });

  it('lists orders and filters them', async () => {
    const token = await registerAdminAndGetToken(app);
    const customer = await seedCustomer();

    await request(app)
      .post('/api/admin/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerId: String(customer._id),
        title: 'Bridal Lehenga',
        lineItems: [{ name: 'Bridal Lehenga', qty: 1 }],
      });

    const all = await request(app)
      .get('/api/admin/orders')
      .set('Authorization', `Bearer ${token}`);
    expect(all.status).toBe(200);
    expect(all.body.data.items.length).toBeGreaterThanOrEqual(1);

    const byStatus = await request(app)
      .get('/api/admin/orders?status=enquiry')
      .set('Authorization', `Bearer ${token}`);
    expect(byStatus.body.data.items).toHaveLength(1);
  });

  it('reads one order and 404s for an unknown id', async () => {
    const token = await registerAdminAndGetToken(app);
    const customer = await seedCustomer();

    const created = await request(app)
      .post('/api/admin/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerId: String(customer._id),
        title: 'Bridal Lehenga',
        lineItems: [{ name: 'Bridal Lehenga', qty: 1 }],
      });

    const found = await request(app)
      .get(`/api/admin/orders/${created.body.data.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(found.status).toBe(200);

    const missing = await request(app)
      .get('/api/admin/orders/64b000000000000000000000')
      .set('Authorization', `Bearer ${token}`);
    expect(missing.status).toBe(404);
  });

  it('updates the editable fields of an order', async () => {
    const token = await registerAdminAndGetToken(app);
    const customer = await seedCustomer();

    const created = await request(app)
      .post('/api/admin/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerId: String(customer._id),
        title: 'Bridal Lehenga',
        lineItems: [{ name: 'Bridal Lehenga', qty: 1 }],
      });

    const res = await request(app)
      .patch(`/api/admin/orders/${created.body.data.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Bridal Lehenga — Final',
        priority: 'high',
        lineItems: [{ name: 'Bridal Lehenga', qty: 2 }],
        tags: ['bridal'],
      });

    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('Bridal Lehenga — Final');
    expect(res.body.data.priority).toBe('high');
    expect(res.body.data.lineItems[0].qty).toBe(2);
  });

  it('moves an order through the production flow', async () => {
    const token = await registerAdminAndGetToken(app);
    const customer = await seedCustomer();

    const created = await request(app)
      .post('/api/admin/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerId: String(customer._id),
        title: 'Bridal Lehenga',
        lineItems: [{ name: 'Bridal Lehenga', qty: 1 }],
      });
    const id = created.body.data.id;

    for (const status of ['confirmed', 'measurements', 'cutting', 'stitching', 'trial', 'finishing', 'delivery']) {
      const res = await request(app)
        .post(`/api/admin/orders/${id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status, note: `Moved to ${status}` });
      expect(res.status, status).toBe(200);
      expect(res.body.data.status, status).toBe(status);
    }
  });

  it('refuses a move the lifecycle does not allow', async () => {
    const token = await registerAdminAndGetToken(app);
    const customer = await seedCustomer();

    const created = await request(app)
      .post('/api/admin/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerId: String(customer._id),
        title: 'Bridal Lehenga',
        lineItems: [{ name: 'Bridal Lehenga', qty: 1 }],
      });

    const res = await request(app)
      .post(`/api/admin/orders/${created.body.data.id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'delivery' });

    // 409 — the request was well formed, but it conflicts with the order's
    // current state.
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('INVALID_TRANSITION');
  });

  it('refuses to move a delivered order again', async () => {
    const token = await registerAdminAndGetToken(app);
    const customer = await seedCustomer();

    const order = await Order.create({
      orderNumber: 8100,
      customerId: customer._id,
      status: 'delivery',
      priority: 'normal',
      title: 'Delivered order',
      lineItems: [{ name: 'Saree', qty: 1 }],
      measurementProfileIds: [],
      assignedStaff: [],
      tags: [],
      notes: [],
      timeline: [],
      paymentSummary: { totalQuoted: 1000, advance: 0, totalPaid: 1000, balance: 0 },
      attachments: [],
    });

    const res = await request(app)
      .post(`/api/admin/orders/${order._id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'finishing' });

    expect(res.status).toBe(409);
  });

  it('assigns staff to an order', async () => {
    const token = await registerAdminAndGetToken(app);
    const customer = await seedCustomer();

    const created = await request(app)
      .post('/api/admin/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerId: String(customer._id),
        title: 'Bridal Lehenga',
        lineItems: [{ name: 'Bridal Lehenga', qty: 1 }],
      });

    const res = await request(app)
      .post(`/api/admin/orders/${created.body.data.id}/assign`)
      .set('Authorization', `Bearer ${token}`)
      .send({ assignedStaff: [{ name: 'Lakshmi', role: 'stitcher' }] });

    expect(res.status).toBe(200);
    expect(res.body.data.assignedStaff).toHaveLength(1);
    expect(res.body.data.assignedStaff[0].name).toBe('Lakshmi');
  });

  it('links measurement profiles to an order', async () => {
    const token = await registerAdminAndGetToken(app);
    const customer = await seedCustomer();

    const created = await request(app)
      .post('/api/admin/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerId: String(customer._id),
        title: 'Bridal Lehenga',
        lineItems: [{ name: 'Bridal Lehenga', qty: 1 }],
      });

    const profile = await MeasurementProfile.create({
      customerId: String(customer._id),
      productTypeCode: 'BR-LH',
      profileName: 'Meera — lehenga',
      unit: 'inches',
      status: 'draft',
      values: { bust: 34 },
      measuredBy: 'studio',
      measuredAt: new Date(),
      currentVersion: 1,
      versions: [],
    });

    const res = await request(app)
      .post(`/api/admin/orders/${created.body.data.id}/link-measurements`)
      .set('Authorization', `Bearer ${token}`)
      .send({ measurementProfileIds: [String(profile._id)] });

    expect(res.status).toBe(200);
    expect(res.body.data.measurementProfileIds).toHaveLength(1);
  });

  it('adds an internal and a customer-visible note', async () => {
    const token = await registerAdminAndGetToken(app);
    const customer = await seedCustomer();

    const created = await request(app)
      .post('/api/admin/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerId: String(customer._id),
        title: 'Bridal Lehenga',
        lineItems: [{ name: 'Bridal Lehenga', qty: 1 }],
      });

    const internal = await request(app)
      .post(`/api/admin/orders/${created.body.data.id}/notes`)
      .set('Authorization', `Bearer ${token}`)
      .send({ body: 'Fabric is delayed', visibility: 'internal' });
    expect(internal.status).toBe(201);

    const visible = await request(app)
      .post(`/api/admin/orders/${created.body.data.id}/notes`)
      .set('Authorization', `Bearer ${token}`)
      .send({ body: 'Your fitting is on Saturday', visibility: 'customer' });
    expect(visible.status).toBe(201);
    expect(visible.body.data.notes).toHaveLength(2);
  });

  it('converts a lead into an order', async () => {
    const token = await registerAdminAndGetToken(app);
    const customer = await seedCustomer();

    const lead = await Lead.create({
      name: 'Converted Lead',
      phone: '9000000003',
      email: 'converted@example.com',
      city: 'Kurnool',
      service: 'Bridal Lehenga',
      occasion: 'Wedding',
      budget: '50k',
      preferredDate: new Date(),
      message: 'A message long enough for the enquiry form rules.',
      inspirationImages: [],
      status: 'Qualified',
      source: 'Referral',
      assignee: 'Studio Team',
      notes: [],
      timeline: [],
      followUps: [],
    });

    const res = await request(app)
      .post(`/api/admin/orders/from-lead/${lead._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(201);
    expect(res.body.data.leadId).toBe(String(lead._id));

    const updatedLead = await Lead.findById(lead._id).lean();
    expect(updatedLead?.orderId).toBeTruthy();
    expect(updatedLead?.orderNumber).toBeTruthy();
  });

  it('returns the existing order when a lead is converted twice', async () => {
    const token = await registerAdminAndGetToken(app);
    const customer = await seedCustomer();

    const order = await Order.create({
      orderNumber: 8200,
      customerId: customer._id,
      status: 'enquiry',
      priority: 'normal',
      title: 'Existing order',
      lineItems: [{ name: 'Saree', qty: 1 }],
      measurementProfileIds: [],
      assignedStaff: [],
      tags: [],
      notes: [],
      timeline: [],
      paymentSummary: { totalQuoted: 1000, advance: 0, totalPaid: 0, balance: 1000 },
      attachments: [],
    });

    const lead = await Lead.create({
      name: 'Already Converted',
      phone: '9000000004',
      email: 'converted2@example.com',
      city: 'Kurnool',
      service: 'Bridal Lehenga',
      occasion: 'Wedding',
      budget: '50k',
      preferredDate: new Date(),
      message: 'A message long enough for the enquiry form rules.',
      inspirationImages: [],
      status: 'Qualified',
      source: 'Referral',
      assignee: 'Studio Team',
      orderId: order._id,
      orderNumber: 8200,
      notes: [],
      timeline: [],
      followUps: [],
    });

    const res = await request(app)
      .post(`/api/admin/orders/from-lead/${lead._id}`)
      .set('Authorization', `Bearer ${token}`);

    // Converting is idempotent: the order that already exists is returned
    // rather than a second one being created.
    expect(res.status).toBe(201);
    expect(res.body.data.id).toBe(String(order._id));
    expect(await Order.countDocuments({})).toBe(1);
  });
});
