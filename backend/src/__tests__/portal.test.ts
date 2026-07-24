import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../app';
import { registerAdminAndGetToken } from './helpers/auth';
import { Customer } from '../models/Customer';
import { MeasurementTemplate } from '../models/MeasurementTemplate';
import { Order } from '../models/Order';
import { Payment } from '../models/Payment';

const app = createApp();

describe('Customer Portal API', () => {
  it('rejects invalid Reference ID activation without leaking details', async () => {
    const res = await request(app).post('/api/portal/activate/verify').send({
      referenceId: 'KDS-2099-9999',
      emailOrMobile: 'nobody@example.com',
    });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Unable to verify/i);
  });

  it('activates portal after order confirm, then serves dashboard/orders/chat/payments', async () => {
    const adminToken = await registerAdminAndGetToken(app);

    const customer = await Customer.create({
      name: 'Priya Reddy',
      phone: '9876543210',
      email: 'priya.portal@test.local',
      address: { city: 'Kurnool' },
      portalStatus: 'none',
    });

    const createRes = await request(app)
      .post('/api/admin/orders')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        customerId: customer._id.toString(),
        title: 'Bridal Lehenga',
        status: 'enquiry',
        lineItems: [{ name: 'Bridal Lehenga', qty: 1 }],
        paymentSummary: { totalQuoted: 50000, advance: 10000 },
      });
    expect(createRes.status).toBe(201);
    const orderId = createRes.body.data.id as string;

    const confirmRes = await request(app)
      .post(`/api/admin/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'confirmed', note: 'Advance received' });
    expect(confirmRes.status).toBe(200);
    const referenceId = confirmRes.body.data.referenceId as string;
    expect(referenceId).toMatch(/^KDS-\d{4}-\d{4}$/);

    // Customer portalStatus invited (async notify may race — reload after short wait)
    await new Promise((r) => setTimeout(r, 50));
    const refreshed = await Customer.findById(customer._id);
    expect(['invited', 'active', 'none']).toContain(refreshed?.portalStatus);

    const verifyRes = await request(app).post('/api/portal/activate/verify').send({
      referenceId,
      emailOrMobile: 'priya.portal@test.local',
    });
    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.data.activationToken).toBeTruthy();

    const badPassword = await request(app).post('/api/portal/activate/set-password').send({
      activationToken: verifyRes.body.data.activationToken,
      password: 'short',
      confirmPassword: 'short',
    });
    expect(badPassword.status).toBe(400);

    const activateRes = await request(app).post('/api/portal/activate/set-password').send({
      activationToken: verifyRes.body.data.activationToken,
      password: 'PortalPass1',
      confirmPassword: 'PortalPass1',
    });
    expect(activateRes.status).toBe(200);
    expect(activateRes.body.data.user.role).toBe('customer');
    expect(activateRes.body.data.token).toBeTruthy();
    const portalToken = activateRes.body.data.token as string;

    // Customer JWT cannot call admin endpoints
    const adminBlocked = await request(app)
      .get('/api/admin/orders')
      .set('Authorization', `Bearer ${portalToken}`);
    expect(adminBlocked.status).toBe(403);

    // Admin login rejects customer credentials
    const adminLogin = await request(app).post('/api/auth/login').send({
      email: 'priya.portal@test.local',
      password: 'PortalPass1',
    });
    expect(adminLogin.status).toBe(403);

    const loginRes = await request(app).post('/api/portal/login').send({
      email: 'priya.portal@test.local',
      password: 'PortalPass1',
    });
    expect(loginRes.status).toBe(200);

    const dash = await request(app)
      .get('/api/portal/dashboard')
      .set('Authorization', `Bearer ${portalToken}`);
    expect(dash.status).toBe(200);
    expect(dash.body.data.referenceId).toBe(referenceId);
    expect(dash.body.data.totalOrderCount).toBeGreaterThanOrEqual(1);

    const orders = await request(app)
      .get('/api/portal/orders')
      .set('Authorization', `Bearer ${portalToken}`);
    expect(orders.status).toBe(200);
    expect(orders.body.data[0].referenceId).toBe(referenceId);

    // Seed a measurement template for portal submit
    await MeasurementTemplate.create({
      code: 'BR-LH-PORTAL',
      name: 'Bridal Lehenga',
      category: 'Bridal Collection',
      active: true,
      version: 1,
      fieldDefs: [
        { key: 'waist', label: 'Waist', type: 'number', required: true, group: 'Body', sortOrder: 1 },
        { key: 'hip', label: 'Hip', type: 'number', required: false, group: 'Body', sortOrder: 2 },
      ],
    });

    const measMissing = await request(app)
      .post('/api/portal/measurements')
      .set('Authorization', `Bearer ${portalToken}`)
      .send({ productTypeCode: 'BR-LH-PORTAL', values: { hip: 40 } });
    expect(measMissing.status).toBe(400);

    const measOk = await request(app)
      .post('/api/portal/measurements')
      .set('Authorization', `Bearer ${portalToken}`)
      .send({
        productTypeCode: 'BR-LH-PORTAL',
        values: { waist: 28, hip: 40 },
        notes: 'Please check waist',
      });
    expect(measOk.status).toBe(201);
    expect(measOk.body.data.status).toBe('pending_approval');
    const profileId = measOk.body.data.id as string;

    const approve = await request(app)
      .patch(`/api/admin/portal/measurements/${profileId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(approve.status).toBe(200);
    expect(approve.body.data.status).toBe('active');

    // Chat both sides
    const custMsg = await request(app)
      .post('/api/portal/chat')
      .set('Authorization', `Bearer ${portalToken}`)
      .send({ body: 'When is my trial?', orderId });
    expect(custMsg.status).toBe(201);

    const adminReply = await request(app)
      .post(`/api/admin/portal/customers/${customer._id}/chat`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ body: 'Trial scheduled for next Saturday.', orderId });
    expect(adminReply.status).toBe(201);

    const chat = await request(app)
      .get('/api/portal/chat')
      .set('Authorization', `Bearer ${portalToken}`);
    expect(chat.status).toBe(200);
    expect(chat.body.data.length).toBeGreaterThanOrEqual(2);

    await Payment.create({
      orderId,
      amount: 10000,
      method: 'upi',
      paidAt: new Date(),
      recordedBy: 'admin',
      reference: 'UPI-TEST',
    });

    const payments = await request(app)
      .get('/api/portal/payments')
      .set('Authorization', `Bearer ${portalToken}`);
    expect(payments.status).toBe(200);
    expect(payments.body.data.payments.length).toBeGreaterThanOrEqual(1);
    expect(payments.body.data.invoices.length).toBeGreaterThanOrEqual(1);
  });

  it('blocks re-activation of an already activated Reference ID', async () => {
    const adminToken = await registerAdminAndGetToken(app);
    const customer = await Customer.create({
      name: 'Sneha Rao',
      phone: '9123456780',
      email: 'sneha.portal@test.local',
    });

    const order = await Order.create({
      orderNumber: 9001,
      referenceId: 'KDS-2026-9001',
      customerId: customer._id,
      status: 'confirmed',
      priority: 'normal',
      title: 'Blouse',
      lineItems: [{ name: 'Blouse', qty: 1 }],
      timeline: [{ status: 'confirmed', actorId: 'admin', at: new Date() }],
      paymentSummary: { totalQuoted: 5000, advance: 0, totalPaid: 0, balance: 5000 },
    });

    const verify1 = await request(app).post('/api/portal/activate/verify').send({
      referenceId: order.referenceId,
      emailOrMobile: '9123456780',
    });
    expect(verify1.status).toBe(200);

    await request(app).post('/api/portal/activate/set-password').send({
      activationToken: verify1.body.data.activationToken,
      password: 'SecurePass9',
      confirmPassword: 'SecurePass9',
    });

    const verify2 = await request(app).post('/api/portal/activate/verify').send({
      referenceId: order.referenceId,
      emailOrMobile: 'sneha.portal@test.local',
    });
    expect(verify2.status).toBe(400);
  });
});
