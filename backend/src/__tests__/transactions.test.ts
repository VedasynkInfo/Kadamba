import request from 'supertest';
import { describe, expect, it, beforeEach } from 'vitest';
import { createApp } from '../app';
import { Customer } from '../models/Customer';
import { Expense } from '../models/Expense';
import { Order } from '../models/Order';
import { Payment } from '../models/Payment';
import { SalaryPayment } from '../models/SalaryPayment';
import { Staff } from '../models/Staff';
import { registerAdminAndGetToken } from './helpers/auth';

const app = createApp();

async function seedOrder(overrides: Record<string, unknown> = {}) {
  const customer = await Customer.create({
    name: 'Meera Kumari',
    phone: '9000000001',
    email: 'meera@example.com',
    address: {
      line1: '12 Ring Road',
      city: 'Kurnool',
      state: 'Andhra Pradesh',
      pincode: '518001',
    },
  });

  const order = await Order.create({
    orderNumber: 5001,
    referenceId: 'KDS-5001',
    customerId: customer._id,
    status: 'confirmed',
    priority: 'normal',
    title: 'Bridal Lehenga',
    lineItems: [{ name: 'Bridal Lehenga', qty: 1, productTypeCode: 'BR-LH' }],
    measurementProfileIds: [],
    assignedStaff: [],
    tags: [],
    notes: [
      { body: 'Visible to the customer', visibility: 'customer', createdBy: 'Studio' },
      { body: 'Internal only', visibility: 'internal', createdBy: 'Studio' },
    ],
    timeline: [],
    paymentSummary: { totalQuoted: 25000, advance: 5000, totalPaid: 0, balance: 25000 },
    attachments: [],
    ...overrides,
  });

  return { customer, order };
}

describe('payments', () => {
  beforeEach(async () => {
    await Payment.deleteMany({});
    await Order.deleteMany({});
    await Customer.deleteMany({});
  });

  it('records a payment and reduces the balance', async () => {
    const token = await registerAdminAndGetToken(app);
    const { order } = await seedOrder();

    const res = await request(app)
      .post('/api/admin/finance/payments')
      .set('Authorization', `Bearer ${token}`)
      .send({ orderId: String(order._id), amount: 10000, method: 'upi' });

    expect(res.status).toBe(201);
    expect(res.body.data.amount).toBe(10000);

    const updated = await Order.findById(order._id).lean();
    expect(updated?.paymentSummary?.totalPaid).toBe(10000);
    expect(updated?.paymentSummary?.balance).toBe(15000);
  });

  it('refuses a payment that is larger than the balance', async () => {
    const token = await registerAdminAndGetToken(app);
    const { order } = await seedOrder();

    const res = await request(app)
      .post('/api/admin/finance/payments')
      .set('Authorization', `Bearer ${token}`)
      .send({ orderId: String(order._id), amount: 999999, method: 'cash' });

    expect(res.status).toBe(400);
  });

  it('accepts an overpayment when the balance check is bypassed', async () => {
    const token = await registerAdminAndGetToken(app);
    const { order } = await seedOrder();

    const res = await request(app)
      .post('/api/admin/finance/payments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        orderId: String(order._id),
        amount: 30000,
        method: 'cash',
        bypassBalanceCheck: true,
      });

    expect(res.status).toBe(201);
  });

  it('refuses a payment for an unknown order', async () => {
    const token = await registerAdminAndGetToken(app);

    const res = await request(app)
      .post('/api/admin/finance/payments')
      .set('Authorization', `Bearer ${token}`)
      .send({ orderId: '64b000000000000000000000', amount: 100, method: 'cash' });

    expect(res.status).toBe(404);
  });

  it('refuses a non-positive amount', async () => {
    const token = await registerAdminAndGetToken(app);
    const { order } = await seedOrder();

    const res = await request(app)
      .post('/api/admin/finance/payments')
      .set('Authorization', `Bearer ${token}`)
      .send({ orderId: String(order._id), amount: 0, method: 'cash' });

    expect(res.status).toBe(400);
  });

  it('lists payments, filtered by order', async () => {
    const token = await registerAdminAndGetToken(app);
    const { order } = await seedOrder();

    await request(app)
      .post('/api/admin/finance/payments')
      .set('Authorization', `Bearer ${token}`)
      .send({ orderId: String(order._id), amount: 1000, method: 'cash' });

    const res = await request(app)
      .get(`/api/admin/finance/payments?orderId=${order._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(1);
  });
});

describe('invoices', () => {
  beforeEach(async () => {
    await Payment.deleteMany({});
    await Order.deleteMany({});
    await Customer.deleteMany({});
  });

  it('builds an invoice for an order', async () => {
    const token = await registerAdminAndGetToken(app);
    const { order } = await seedOrder();

    const res = await request(app)
      .get(`/api/admin/finance/invoices/${order._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.invoiceNumber).toMatch(/^INV-\d{4}-5001$/);
    expect(res.body.data.customer.name).toBe('Meera Kumari');
    expect(res.body.data.studio.name).toBeTruthy();
    expect(res.body.data.billStatus).toBe('unpaid');
    expect(res.body.data.paymentSummary.balance).toBe(25000);
  });

  it('includes only the customer-visible notes', async () => {
    const token = await registerAdminAndGetToken(app);
    const { order } = await seedOrder();

    const res = await request(app)
      .get(`/api/admin/finance/invoices/${order._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.data.notes).toContain('Visible to the customer');
    expect(res.body.data.notes).not.toContain('Internal only');
  });

  it('marks a fully paid order as paid', async () => {
    const token = await registerAdminAndGetToken(app);
    const { order } = await seedOrder();

    await request(app)
      .post('/api/admin/finance/payments')
      .set('Authorization', `Bearer ${token}`)
      .send({ orderId: String(order._id), amount: 25000, method: 'bank' });

    const res = await request(app)
      .get(`/api/admin/finance/invoices/${order._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.data.billStatus).toBe('paid');
    expect(res.body.data.paymentSummary.balance).toBe(0);
  });

  it('lists the invoices and filters by payment status', async () => {
    const token = await registerAdminAndGetToken(app);
    await seedOrder();

    const all = await request(app)
      .get('/api/admin/finance/invoices')
      .set('Authorization', `Bearer ${token}`);
    expect(all.status).toBe(200);
    expect(all.body.data.items.length).toBeGreaterThan(0);

    const unpaid = await request(app)
      .get('/api/admin/finance/invoices?paymentStatus=unpaid')
      .set('Authorization', `Bearer ${token}`);
    expect(unpaid.body.data.items.every((i: { billStatus: string }) => i.billStatus === 'unpaid')).toBe(
      true,
    );
  });

  it('404s for an unknown invoice', async () => {
    const token = await registerAdminAndGetToken(app);
    const res = await request(app)
      .get('/api/admin/finance/invoices/64b000000000000000000000')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});

describe('expenses', () => {
  beforeEach(async () => {
    await Expense.deleteMany({});
  });

  it('records, edits and deletes an expense', async () => {
    const token = await registerAdminAndGetToken(app);

    const created = await request(app)
      .post('/api/admin/finance/expenses')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Silk fabric',
        category: 'fabric',
        amount: 4500,
        spentAt: '2030-01-15T00:00:00.000Z',
        notes: 'Bridal order',
      });
    expect(created.status).toBe(201);

    const updated = await request(app)
      .put(`/api/admin/finance/expenses/${created.body.data.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ amount: 5000 });
    expect(updated.status).toBe(200);
    expect(updated.body.data.amount).toBe(5000);

    const removed = await request(app)
      .delete(`/api/admin/finance/expenses/${created.body.data.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(removed.status).toBe(200);
    expect(await Expense.countDocuments({})).toBe(0);
  });

  it('lists expenses, filtered by category and search', async () => {
    const token = await registerAdminAndGetToken(app);

    await request(app)
      .post('/api/admin/finance/expenses')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Silk fabric',
        category: 'fabric',
        amount: 4500,
        spentAt: '2030-01-15T00:00:00.000Z',
      });
    await request(app)
      .post('/api/admin/finance/expenses')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Studio rent',
        category: 'rent',
        amount: 12000,
        spentAt: '2030-01-05T00:00:00.000Z',
      });

    const all = await request(app)
      .get('/api/admin/finance/expenses')
      .set('Authorization', `Bearer ${token}`);
    expect(all.body.data.items).toHaveLength(2);

    const byCategory = await request(app)
      .get('/api/admin/finance/expenses?category=fabric')
      .set('Authorization', `Bearer ${token}`);
    expect(byCategory.body.data.items).toHaveLength(1);

    const bySearch = await request(app)
      .get('/api/admin/finance/expenses?q=rent')
      .set('Authorization', `Bearer ${token}`);
    expect(bySearch.body.data.items).toHaveLength(1);
  });

  it('refuses an unknown category', async () => {
    const token = await registerAdminAndGetToken(app);

    const res = await request(app)
      .post('/api/admin/finance/expenses')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Something',
        category: 'gambling',
        amount: 100,
        spentAt: '2030-01-15T00:00:00.000Z',
      });

    expect(res.status).toBe(400);
  });
});

describe('salary payments', () => {
  beforeEach(async () => {
    await SalaryPayment.deleteMany({});
    await Staff.deleteMany({});
  });

  it('records a salary payment for a staff member', async () => {
    const token = await registerAdminAndGetToken(app);
    const staff = await Staff.create({
      fullName: 'Lakshmi Rao',
      phone: '9000000002',
      email: 'lakshmi@example.com',
      locality: 'Kurnool',
      employmentType: 'permanent',
      specializations: ['Stitching'],
    });

    const res = await request(app)
      .post('/api/admin/finance/salaries')
      .set('Authorization', `Bearer ${token}`)
      .send({
        staffId: String(staff._id),
        year: 2030,
        month: 1,
        amount: 15000,
        paidAt: '2030-01-31T00:00:00.000Z',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.amount).toBe(15000);
  });

  it('lists salary payments for a month', async () => {
    const token = await registerAdminAndGetToken(app);
    const staff = await Staff.create({
      fullName: 'Lakshmi Rao',
      phone: '9000000002',
      email: 'lakshmi@example.com',
      locality: 'Kurnool',
      employmentType: 'permanent',
      specializations: ['Stitching'],
    });

    await request(app)
      .post('/api/admin/finance/salaries')
      .set('Authorization', `Bearer ${token}`)
      .send({
        staffId: String(staff._id),
        year: 2030,
        month: 1,
        amount: 15000,
        paidAt: '2030-01-31T00:00:00.000Z',
      });

    const res = await request(app)
      .get('/api/admin/finance/salaries?year=2030&month=1')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(1);
  });

  it('refuses a month outside the calendar', async () => {
    const token = await registerAdminAndGetToken(app);
    const staff = await Staff.create({
      fullName: 'Lakshmi Rao',
      phone: '9000000002',
      email: 'lakshmi@example.com',
      locality: 'Kurnool',
      employmentType: 'permanent',
      specializations: ['Stitching'],
    });

    const res = await request(app)
      .post('/api/admin/finance/salaries')
      .set('Authorization', `Bearer ${token}`)
      .send({
        staffId: String(staff._id),
        year: 2030,
        month: 13,
        amount: 15000,
        paidAt: '2030-01-31T00:00:00.000Z',
      });

    expect(res.status).toBe(400);
  });
});

describe('finance summary', () => {
  beforeEach(async () => {
    await Payment.deleteMany({});
    await Expense.deleteMany({});
    await Order.deleteMany({});
    await Customer.deleteMany({});
  });

  it('summarises revenue, expenses and outstanding balances', async () => {
    const token = await registerAdminAndGetToken(app);
    const { order } = await seedOrder();

    await request(app)
      .post('/api/admin/finance/payments')
      .set('Authorization', `Bearer ${token}`)
      .send({ orderId: String(order._id), amount: 10000, method: 'upi' });

    const res = await request(app)
      .get('/api/admin/finance/summary')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeTruthy();
  });

  it('reports revenue by product', async () => {
    const token = await registerAdminAndGetToken(app);
    const { order } = await seedOrder();

    await request(app)
      .post('/api/admin/finance/payments')
      .set('Authorization', `Bearer ${token}`)
      .send({ orderId: String(order._id), amount: 10000, method: 'upi' });

    const res = await request(app)
      .get('/api/admin/finance/revenue-by-product')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeTruthy();
  });

  it('reports profit and loss', async () => {
    const token = await registerAdminAndGetToken(app);
    const { order } = await seedOrder();

    await request(app)
      .post('/api/admin/finance/payments')
      .set('Authorization', `Bearer ${token}`)
      .send({ orderId: String(order._id), amount: 10000, method: 'upi' });

    const res = await request(app)
      .get('/api/admin/finance/profit-loss')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toBeTruthy();
  });
});
