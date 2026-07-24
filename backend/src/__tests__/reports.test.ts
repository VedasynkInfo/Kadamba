import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../app';
import { registerAdminAndGetToken } from './helpers/auth';
import { Customer } from '../models/Customer';
import { Order } from '../models/Order';
import { Payment } from '../models/Payment';
import { Expense } from '../models/Expense';
import { Lead } from '../models/Lead';

const app = createApp();

function isoDaysAgo(days: number) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

describe('Reports API', () => {
  it('rejects unauthorized requests', async () => {
    const res = await request(app).get('/api/admin/reports/orders-by-status').query({
      from: isoDaysAgo(30),
      to: new Date().toISOString(),
    });
    expect(res.status).toBe(401);
  });

  it('requires from/to for date-ranged reports', async () => {
    const token = await registerAdminAndGetToken(app);
    const res = await request(app)
      .get('/api/admin/reports/orders-by-status')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });

  it('rejects ranges longer than 36 months', async () => {
    const token = await registerAdminAndGetToken(app);
    const from = new Date();
    from.setFullYear(from.getFullYear() - 4);
    const res = await request(app)
      .get('/api/admin/reports/revenue-trend')
      .set('Authorization', `Bearer ${token}`)
      .query({ from: from.toISOString(), to: new Date().toISOString() });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/36 months/i);
  });

  it('aggregates orders-by-status, revenue, outstanding, and pnl', async () => {
    const token = await registerAdminAndGetToken(app);

    const customer = await Customer.create({
      name: 'Report Test Client',
      phone: '9000001111',
    });

    const order = await Order.create({
      orderNumber: 901,
      customerId: customer._id,
      title: 'Bridal Lehenga Report',
      status: 'confirmed',
      priority: 'normal',
      lineItems: [{ name: 'Bridal Lehenga', qty: 1, productTypeCode: 'BR-LH' }],
      paymentSummary: {
        totalQuoted: 50000,
        advance: 10000,
        totalPaid: 10000,
        balance: 40000,
      },
      assignedStaff: [{ name: 'Lakshmi', role: 'stitcher', staffId: 'staff-1' }],
    });

    await Payment.create({
      orderId: order._id,
      amount: 10000,
      method: 'upi',
      paidAt: new Date(),
      recordedBy: 'admin',
    });

    await Expense.create({
      title: 'Fabric purchase',
      category: 'fabric',
      amount: 2000,
      spentAt: new Date(),
      createdBy: 'admin',
    });

    const from = isoDaysAgo(7);
    const to = new Date().toISOString();

    const statusRes = await request(app)
      .get('/api/admin/reports/orders-by-status')
      .set('Authorization', `Bearer ${token}`)
      .query({ from, to });
    expect(statusRes.status).toBe(200);
    expect(statusRes.body.success).toBe(true);
    expect(statusRes.body.data.total).toBeGreaterThanOrEqual(1);
    expect(statusRes.body.data.rows.some((r: { status: string }) => r.status === 'confirmed')).toBe(true);

    const trendRes = await request(app)
      .get('/api/admin/reports/revenue-trend')
      .set('Authorization', `Bearer ${token}`)
      .query({ from, to, groupBy: 'month' });
    expect(trendRes.status).toBe(200);
    expect(trendRes.body.data.total).toBeGreaterThanOrEqual(10000);

    const productRes = await request(app)
      .get('/api/admin/reports/revenue-by-product')
      .set('Authorization', `Bearer ${token}`)
      .query({ from, to });
    expect(productRes.status).toBe(200);
    expect(productRes.body.data.rows.length).toBeGreaterThanOrEqual(1);

    const outstandingRes = await request(app)
      .get('/api/admin/reports/outstanding')
      .set('Authorization', `Bearer ${token}`);
    expect(outstandingRes.status).toBe(200);
    expect(outstandingRes.body.data.summary.totalOutstanding).toBeGreaterThanOrEqual(40000);

    const pnlRes = await request(app)
      .get('/api/admin/reports/pnl')
      .set('Authorization', `Bearer ${token}`)
      .query({ from, to });
    expect(pnlRes.status).toBe(200);
    expect(pnlRes.body.data.summary.revenue).toBeGreaterThanOrEqual(10000);
    expect(pnlRes.body.data.definition).toMatch(/payments received/i);

    const staffRes = await request(app)
      .get('/api/admin/reports/staff-workload')
      .set('Authorization', `Bearer ${token}`)
      .query({ from, to });
    expect(staffRes.status).toBe(200);
    expect(staffRes.body.data.rows.some((r: { name: string }) => r.name === 'Lakshmi')).toBe(true);
  });

  it('reports leads conversion and exports CSV', async () => {
    const token = await registerAdminAndGetToken(app);
    const now = new Date();

    const lead = await Lead.create({
      name: 'Conversion Lead',
      phone: '9111222333',
      email: 'lead@test.local',
      city: 'Kurnool',
      service: 'Bridal',
      occasion: 'Wedding',
      budget: '50k',
      preferredDate: new Date(now.getTime() + 86400000),
      message: 'Need bridal lehenga',
      status: 'Qualified',
      source: 'WhatsApp',
    });

    const customer = await Customer.create({
      name: 'Conversion Client',
      phone: '9111222444',
    });

    await Order.create({
      orderNumber: 902,
      customerId: customer._id,
      leadId: lead._id,
      title: 'Converted Bridal',
      status: 'confirmed',
      priority: 'normal',
      lineItems: [{ name: 'Lehenga', qty: 1 }],
      paymentSummary: { totalQuoted: 10000, advance: 0, totalPaid: 0, balance: 10000 },
    });

    const from = isoDaysAgo(7);
    const to = new Date().toISOString();

    const convRes = await request(app)
      .get('/api/admin/reports/leads-conversion')
      .set('Authorization', `Bearer ${token}`)
      .query({ from, to });
    expect(convRes.status).toBe(200);
    expect(convRes.body.data.summary.totalConverted).toBeGreaterThanOrEqual(1);

    const csvRes = await request(app)
      .get('/api/admin/reports/export/orders-by-status')
      .set('Authorization', `Bearer ${token}`)
      .query({ from, to });
    expect(csvRes.status).toBe(200);
    expect(csvRes.headers['content-type']).toMatch(/text\/csv/);
    expect(csvRes.text).toContain('status,count,percent');
  });
});
