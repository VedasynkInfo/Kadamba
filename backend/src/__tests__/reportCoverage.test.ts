import request from 'supertest';
import { describe, expect, it, beforeEach } from 'vitest';
import { createApp } from '../app';
import { Customer } from '../models/Customer';
import { Expense } from '../models/Expense';
import { Lead } from '../models/Lead';
import { Order } from '../models/Order';
import { Payment } from '../models/Payment';
import { SalaryPayment } from '../models/SalaryPayment';
import { Staff } from '../models/Staff';
import { REPORT_TYPES } from '../services/reportService';
import { registerAdminAndGetToken } from './helpers/auth';

const app = createApp();

function isoDaysAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function isoDaysAhead(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

/**
 * The range is computed *after* the data is seeded, and it reaches a day
 * into the future: a report that filters on `paidAt` or `spentAt` would
 * otherwise exclude a record written a millisecond after the range closed.
 */
function range() {
  return { from: isoDaysAgo(30), to: isoDaysAhead(1) };
}

async function seedReportingData() {
  const customer = await Customer.create({
    name: 'Report Client',
    phone: '9000001111',
    email: 'report@example.com',
  });

  const order = await Order.create({
    orderNumber: 7001,
    referenceId: 'KDS-7001',
    customerId: customer._id,
    status: 'stitching',
    priority: 'normal',
    title: 'Bridal Lehenga',
    lineItems: [
      { name: 'Bridal Lehenga', qty: 1, productTypeCode: 'BR-LH' },
      { name: 'Blouse', qty: 2, productTypeCode: 'BL-SR' },
    ],
    assignedStaff: [
      { name: 'Lakshmi', role: 'stitcher', staffId: 'staff-1' },
      { name: 'Sravani', role: 'maggam', staffId: 'staff-2' },
    ],
    expectedTrialAt: new Date(Date.now() - 5 * 86400000),
    expectedDeliveryAt: new Date(Date.now() - 10 * 86400000),
    actualTrialAt: new Date(Date.now() - 4 * 86400000),
    actualDeliveryAt: new Date(Date.now() - 9 * 86400000),
    tags: ['bridal'],
    notes: [],
    timeline: [],
    paymentSummary: { totalQuoted: 50000, advance: 10000, totalPaid: 10000, balance: 40000 },
    attachments: [],
  });

  const secondOrder = await Order.create({
    orderNumber: 7002,
    customerId: customer._id,
    status: 'delivery',
    priority: 'normal',
    title: 'Second Order',
    lineItems: [{ name: 'Saree', qty: 1, productTypeCode: 'SK-LH' }],
    assignedStaff: [],
    tags: [],
    notes: [],
    timeline: [],
    paymentSummary: { totalQuoted: 8000, advance: 0, totalPaid: 8000, balance: 0 },
    attachments: [],
  });

  await Payment.create({
    orderId: order._id,
    amount: 10000,
    method: 'upi',
    paidAt: new Date(),
    recordedBy: 'admin',
  });
  await Payment.create({
    orderId: secondOrder._id,
    amount: 8000,
    method: 'cash',
    paidAt: new Date(),
    recordedBy: 'admin',
  });

  await Expense.create({
    title: 'Silk fabric',
    category: 'fabric',
    amount: 2000,
    spentAt: new Date(),
    createdBy: 'admin',
  });

  const staff = await Staff.create({
    fullName: 'Lakshmi Rao',
    phone: '9000002222',
    email: 'lakshmi@example.com',
    locality: 'Kurnool',
    employmentType: 'permanent',
    specializations: ['Stitching'],
  });

  await SalaryPayment.create({
    staffId: staff._id,
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    amount: 15000,
    paidAt: new Date(),
    createdBy: 'admin',
  });

  const lead = await Lead.create({
    name: 'Report Lead',
    phone: '9111222333',
    email: 'lead@example.com',
    city: 'Kurnool',
    service: 'Bridal',
    occasion: 'Wedding',
    budget: '50k',
    preferredDate: new Date(),
    message: 'Need a bridal lehenga',
    status: 'Qualified',
    source: 'WhatsApp',
    orderId: order._id,
    orderNumber: 7001,
    inspirationImages: [],
    notes: [],
    timeline: [],
    followUps: [],
  });

  return { customer, order, secondOrder, lead, staff };
}

describe('every report type', () => {
  beforeEach(async () => {
    await Payment.deleteMany({});
    await Expense.deleteMany({});
    await SalaryPayment.deleteMany({});
    await Order.deleteMany({});
    await Lead.deleteMany({});
    await Customer.deleteMany({});
    await Staff.deleteMany({});
  });

  it('produces a result for every report type', async () => {
    const token = await registerAdminAndGetToken(app);
    await seedReportingData();
    const { from, to } = range();

    for (const type of REPORT_TYPES) {
      const query: Record<string, string> = { from, to };
      if (type === 'outstanding') {
        query.asOf = to;
      }
      const res = await request(app)
        .get(`/api/admin/reports/${type}`)
        .set('Authorization', `Bearer ${token}`)
        .query(query);

      expect(res.status, type).toBe(200);
      expect(res.body.success, type).toBe(true);
      expect(res.body.data, type).toBeTruthy();
    }
  });

  it('exports every report type as CSV', async () => {
    const token = await registerAdminAndGetToken(app);
    await seedReportingData();
    const { from, to } = range();

    for (const type of REPORT_TYPES) {
      const query: Record<string, string> = { from, to };
      if (type === 'outstanding') {
        query.asOf = to;
      }
      const res = await request(app)
        .get(`/api/admin/reports/export/${type}`)
        .set('Authorization', `Bearer ${token}`)
        .query(query);

      expect(res.status, type).toBe(200);
      expect(res.headers['content-type'], type).toMatch(/text\/csv/);
      expect(res.text.length, type).toBeGreaterThan(0);
    }
  });

  it('rejects an unknown report type', async () => {
    const token = await registerAdminAndGetToken(app);
    const { from, to } = range();

    const res = await request(app)
      .get('/api/admin/reports/export/not-a-report')
      .set('Authorization', `Bearer ${token}`)
      .query({ from, to });
    expect(res.status).toBe(400);
  });

  it('reports deliveries and trials', async () => {
    const token = await registerAdminAndGetToken(app);
    await seedReportingData();
    const { from, to } = range();

    const res = await request(app)
      .get('/api/admin/reports/deliveries-trials')
      .set('Authorization', `Bearer ${token}`)
      .query({ from, to });

    expect(res.status).toBe(200);
    expect(res.body.data.rows.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.summary.expectedTrials).toBeGreaterThanOrEqual(1);
    expect(res.body.data.summary.actualDeliveries).toBeGreaterThanOrEqual(1);
  });

  it('reports revenue by service', async () => {
    const token = await registerAdminAndGetToken(app);
    await seedReportingData();
    const { from, to } = range();

    const res = await request(app)
      .get('/api/admin/reports/revenue-by-service')
      .set('Authorization', `Bearer ${token}`)
      .query({ from, to });

    expect(res.status).toBe(200);
    expect(res.body.data.rows).toBeTruthy();
  });

  it('reports expenses against salaries', async () => {
    const token = await registerAdminAndGetToken(app);
    await seedReportingData();
    const { from, to } = range();

    const res = await request(app)
      .get('/api/admin/reports/expenses-salaries')
      .set('Authorization', `Bearer ${token}`)
      .query({ from, to });

    expect(res.status).toBe(200);
    expect(res.body.data.summary.totalExpenses).toBeGreaterThanOrEqual(2000);
    expect(res.body.data.summary.totalSalaries).toBeGreaterThanOrEqual(15000);
  });

  it('reports repeat customers', async () => {
    const token = await registerAdminAndGetToken(app);
    const { customer } = await seedReportingData();
    const { from, to } = range();

    await Order.create({
      orderNumber: 7003,
      customerId: customer._id,
      status: 'delivery',
      priority: 'normal',
      title: 'Third Order',
      lineItems: [{ name: 'Saree', qty: 1 }],
      assignedStaff: [],
      tags: [],
      notes: [],
      timeline: [],
      paymentSummary: { totalQuoted: 5000, advance: 0, totalPaid: 5000, balance: 0 },
      attachments: [],
    });

    const res = await request(app)
      .get('/api/admin/reports/customer-repeat')
      .set('Authorization', `Bearer ${token}`)
      .query({ from, to });

    expect(res.status).toBe(200);
    expect(
      res.body.data.rows.some((r: { customerName: string }) => r.customerName === 'Report Client'),
    ).toBe(true);
    expect(res.body.data.summary.returningCustomers).toBeGreaterThanOrEqual(1);
  });

  it('groups the revenue trend by day, week and month', async () => {
    const token = await registerAdminAndGetToken(app);
    await seedReportingData();
    const { from, to } = range();

    for (const groupBy of ['day', 'week', 'month']) {
      const res = await request(app)
        .get('/api/admin/reports/revenue-trend')
        .set('Authorization', `Bearer ${token}`)
        .query({ from, to, groupBy });
      expect(res.status, groupBy).toBe(200);
      expect(res.body.data.rows.length, groupBy).toBeGreaterThanOrEqual(1);
    }
  });

  it('rejects a range that ends before it starts', async () => {
    const token = await registerAdminAndGetToken(app);
    const { from, to } = range();
    const res = await request(app)
      .get('/api/admin/reports/orders-by-status')
      .set('Authorization', `Bearer ${token}`)
      .query({ from: to, to: from });
    expect(res.status).toBe(400);
  });

  it('rejects a malformed date', async () => {
    const token = await registerAdminAndGetToken(app);
    const { to } = range();
    const res = await request(app)
      .get('/api/admin/reports/orders-by-status')
      .set('Authorization', `Bearer ${token}`)
      .query({ from: 'not-a-date', to });
    expect(res.status).toBe(400);
  });

  it('rejects a malformed asOf on the outstanding report', async () => {
    const token = await registerAdminAndGetToken(app);
    const res = await request(app)
      .get('/api/admin/reports/outstanding')
      .set('Authorization', `Bearer ${token}`)
      .query({ asOf: 'not-a-date' });
    expect(res.status).toBe(400);
  });

  it('rejects an unknown grouping', async () => {
    const token = await registerAdminAndGetToken(app);
    await seedReportingData();
    const { from, to } = range();

    const res = await request(app)
      .get('/api/admin/reports/revenue-trend')
      .set('Authorization', `Bearer ${token}`)
      .query({ from, to, groupBy: 'fortnight' });
    expect(res.status).toBe(400);
  });
});
