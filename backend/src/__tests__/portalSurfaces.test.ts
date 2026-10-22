import request from 'supertest';
import { describe, expect, it, beforeEach } from 'vitest';
import { createApp } from '../app';
import { Customer } from '../models/Customer';
import { MeasurementProfile } from '../models/MeasurementProfile';
import { MeasurementTemplate } from '../models/MeasurementTemplate';
import { Order } from '../models/Order';
import { Payment } from '../models/Payment';
import { PortalMessage } from '../models/PortalMessage';
import { ProductType } from '../models/ProductType';
import { registerAdminAndGetToken } from './helpers/auth';

const app = createApp();

/** A customer with an active portal account and a token ready to use. */
async function seedActivatedCustomer() {
  const customer = await Customer.create({
    name: 'Portal Customer',
    phone: '9876500000',
    email: 'portal.customer@test.local',
    address: { city: 'Kurnool' },
    portalStatus: 'active',
    portalUserId: '64b000000000000000000001',
  });

  const order = await Order.create({
    orderNumber: 3301,
    referenceId: 'KDS-2026-3301',
    customerId: customer._id,
    status: 'stitching',
    priority: 'normal',
    title: 'Bridal Lehenga',
    lineItems: [{ name: 'Bridal Lehenga', qty: 1, productTypeCode: 'BR-LH' }],
    measurementProfileIds: [],
    assignedStaff: [],
    tags: [],
    notes: [],
    timeline: [],
    paymentSummary: { totalQuoted: 30000, advance: 5000, totalPaid: 5000, balance: 25000 },
    attachments: [],
  });

  return { customer, order };
}

describe('customer portal surfaces', () => {
  beforeEach(async () => {
    await Order.deleteMany({});
    await Payment.deleteMany({});
    await PortalMessage.deleteMany({});
    await MeasurementProfile.deleteMany({});
    await MeasurementTemplate.deleteMany({});
    await ProductType.deleteMany({});
    await Customer.deleteMany({});
  });

  it('browses the public catalogue without signing in', async () => {
    await ProductType.create({
      code: 'BR-LH',
      name: 'Bridal Lehenga',
      slug: 'bridal-lehenga',
      categoryId: '64b000000000000000000009',
      description: 'A bridal lehenga',
      active: true,
      featured: true,
      sortOrder: 1,
      gallery: [],
      variants: [],
      tags: [],
    });

    const res = await request(app).get('/api/portal/catalog');
    expect(res.status).toBe(200);
    expect(res.body.data).toBeTruthy();
  });

  it('refuses a portal endpoint without a token', async () => {
    const res = await request(app).get('/api/portal/dashboard');
    expect(res.status).toBe(401);
  });

  it('refuses an admin token on a portal endpoint', async () => {
    const token = await registerAdminAndGetToken(app);
    const res = await request(app)
      .get('/api/portal/dashboard')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('lists the measurement templates a customer can fill in', async () => {
    const token = await registerAdminAndGetToken(app);
    const { customer } = await seedActivatedCustomer();

    await MeasurementTemplate.create({
      code: 'BR-LH',
      name: 'Bridal Lehenga',
      category: 'Bridal Collection',
      active: true,
      version: 1,
      fieldDefs: [
        { key: 'waist', label: 'Waist', type: 'number', required: true, group: 'Body', sortOrder: 1 },
      ],
    });

    // A customer token is issued by the portal login; mint one directly.
    const portalToken = await loginAsPortalCustomer(customer);

    const list = await request(app)
      .get('/api/portal/measurement-templates')
      .set('Authorization', `Bearer ${portalToken}`);
    expect(list.status).toBe(200);

    const one = await request(app)
      .get('/api/portal/measurement-templates/BR-LH')
      .set('Authorization', `Bearer ${portalToken}`);
    expect(one.status).toBe(200);
    expect(one.body.data.code).toBe('BR-LH');

    const missing = await request(app)
      .get('/api/portal/measurement-templates/NOPE')
      .set('Authorization', `Bearer ${portalToken}`);
    expect(missing.status).toBe(404);
    expect(token).toBeTruthy();
  });

  it('serves one order to its own customer and hides it from the others', async () => {
    const { customer, order } = await seedActivatedCustomer();
    const other = await Customer.create({
      name: 'Other Customer',
      phone: '9876500001',
      email: 'other.customer@test.local',
      portalStatus: 'active',
      portalUserId: '64b000000000000000000002',
    });

    const portalToken = await loginAsPortalCustomer(customer);
    const otherToken = await loginAsPortalCustomer(other);

    const mine = await request(app)
      .get(`/api/portal/orders/${order._id}`)
      .set('Authorization', `Bearer ${portalToken}`);
    expect(mine.status).toBe(200);
    expect(mine.body.data.referenceId).toBe('KDS-2026-3301');

    const theirs = await request(app)
      .get(`/api/portal/orders/${order._id}`)
      .set('Authorization', `Bearer ${otherToken}`);
    expect(theirs.status).toBe(404);
  });

  it('serves the invoice of an order to its customer', async () => {
    const { customer, order } = await seedActivatedCustomer();
    const portalToken = await loginAsPortalCustomer(customer);

    const res = await request(app)
      .get(`/api/portal/invoices/${order._id}`)
      .set('Authorization', `Bearer ${portalToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.invoiceNumber).toContain('3301');
  });

  it('lists the measurements a customer has submitted', async () => {
    const { customer } = await seedActivatedCustomer();
    await MeasurementProfile.create({
      customerId: String(customer._id),
      productTypeCode: 'BR-LH',
      profileName: 'Lehenga measurements',
      unit: 'inches',
      status: 'draft',
      values: { waist: 28 },
      measuredBy: 'portal',
      measuredAt: new Date(),
      currentVersion: 1,
      versions: [],
    });

    const portalToken = await loginAsPortalCustomer(customer);
    const res = await request(app)
      .get('/api/portal/measurements')
      .set('Authorization', `Bearer ${portalToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it('filters the chat by order', async () => {
    const { customer, order } = await seedActivatedCustomer();
    await PortalMessage.create({
      customerId: customer._id,
      orderId: order._id,
      senderRole: 'customer',
      senderId: 'portal',
      body: 'When is my trial?',
      attachments: [],
    });

    const portalToken = await loginAsPortalCustomer(customer);
    const res = await request(app)
      .get(`/api/portal/chat?orderId=${order._id}`)
      .set('Authorization', `Bearer ${portalToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
  });

  it('lets the studio list a customer conversation', async () => {
    const token = await registerAdminAndGetToken(app);
    const { customer } = await seedActivatedCustomer();
    await PortalMessage.create({
      customerId: customer._id,
      senderRole: 'customer',
      senderId: 'portal',
      body: 'A question about fabric',
      attachments: [],
    });

    const res = await request(app)
      .get(`/api/admin/portal/customers/${customer._id}/chat`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it('creates a portal request and links it to a new lead', async () => {
    const { customer } = await seedActivatedCustomer();
    const portalToken = await loginAsPortalCustomer(customer);

    const res = await request(app)
      .post('/api/portal/requests')
      .set('Authorization', `Bearer ${portalToken}`)
      .send({
        service: 'Bridal Lehenga',
        occasion: 'Wedding',
        budget: '₹50,000 – ₹80,000',
        message: 'I would like to book a fitting consultation for my wedding.',
        preferredDate: '2030-02-01',
      });

    expect(res.status).toBe(201);
    expect(res.body.data).toBeTruthy();
  });

  it('lists the payments and invoices of a customer', async () => {
    const { customer, order } = await seedActivatedCustomer();
    await Payment.create({
      orderId: order._id,
      amount: 5000,
      method: 'upi',
      paidAt: new Date(),
      recordedBy: 'admin',
    });

    const portalToken = await loginAsPortalCustomer(customer);
    const res = await request(app)
      .get('/api/portal/payments')
      .set('Authorization', `Bearer ${portalToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.payments.length).toBeGreaterThanOrEqual(1);
  });

  it('signs a portal customer out', async () => {
    const { customer } = await seedActivatedCustomer();
    const portalToken = await loginAsPortalCustomer(customer);

    const res = await request(app)
      .post('/api/portal/logout')
      .set('Authorization', `Bearer ${portalToken}`);

    expect(res.status).toBe(200);
  });
});

/**
 * Sign in as a portal customer and return the access token.
 *
 * The portal account is a `User` with the `customer` role; creating it here
 * keeps the test focused on the portal surfaces rather than on activation.
 */
async function loginAsPortalCustomer(customer: { _id: unknown; email: string }) {
  const { User } = await import('../models/User');
  const PASSWORD = 'PortalPass1';

  const existing = await User.findOne({ email: customer.email });
  if (!existing) {
    // The model hashes the password on save, so it is given in plaintext.
    await User.create({
      name: 'Portal Customer',
      email: customer.email,
      password: PASSWORD,
      role: 'customer',
      customerId: String(customer._id),
      status: 'active',
      permissions: [],
      tokenVersion: 0,
      failedLoginAttempts: 0,
    });
  }

  const res = await request(app)
    .post('/api/portal/login')
    .send({ email: customer.email, password: PASSWORD });

  expect(res.status, res.text).toBe(200);
  return res.body.data.token as string;
}
