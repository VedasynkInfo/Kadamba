import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../app';
import { registerAdminAndGetToken } from './helpers/auth';
import { Customer } from '../models/Customer';
import { Order } from '../models/Order';
import { Payment } from '../models/Payment';

const app = createApp();

async function seedOrder(totalQuoted: number, status = 'confirmed') {
  const customer = await Customer.create({
    name: 'Integrity Tester',
    phone: '9000000001',
  });
  const order = await Order.create({
    orderNumber: Math.floor(Math.random() * 900000) + 100000,
    customerId: customer._id,
    title: 'Integrity Test Garment',
    status,
    lineItems: [{ name: 'Test Blouse', qty: 1 }],
    paymentSummary: { totalQuoted, advance: 0, totalPaid: 0, balance: totalQuoted },
  });
  return order;
}

describe('Data integrity', () => {
  it('rejects a payment that exceeds the remaining balance', async () => {
    const token = await registerAdminAndGetToken(app);
    const order = await seedOrder(10000);

    const res = await request(app)
      .post('/api/admin/finance/payments')
      .set('Authorization', `Bearer ${token}`)
      .send({ orderId: String(order._id), amount: 15000, method: 'cash' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);

    // No payment row should have been persisted.
    expect(await Payment.countDocuments({ orderId: order._id })).toBe(0);
  });

  it('keeps the order payment summary exact under concurrent payments', async () => {
    const token = await registerAdminAndGetToken(app);
    const order = await seedOrder(10000);

    // Fire 5 concurrent payments of 1000 each against the same order.
    const responses = await Promise.all(
      Array.from({ length: 5 }, () =>
        request(app)
          .post('/api/admin/finance/payments')
          .set('Authorization', `Bearer ${token}`)
          .send({ orderId: String(order._id), amount: 1000, method: 'upi' }),
      ),
    );

    const accepted = responses.filter((r) => r.status === 201);
    expect(accepted.length).toBe(5);

    const fresh = await Order.findById(order._id);
    const payments = await Payment.find({ orderId: order._id });
    const sum = payments.reduce((s, p) => s + p.amount, 0);

    expect(sum).toBe(5000);
    expect(fresh!.paymentSummary.totalPaid).toBe(5000);
    expect(fresh!.paymentSummary.balance).toBe(5000);
  });

  it('refuses an invalid order status transition', async () => {
    const token = await registerAdminAndGetToken(app);
    const order = await seedOrder(5000, 'enquiry');

    // enquiry → delivery is not a legal transition.
    const res = await request(app)
      .post(`/api/admin/orders/${order._id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'delivery' });

    expect(res.status).toBe(409);
    const fresh = await Order.findById(order._id);
    expect(fresh!.status).toBe('enquiry');
  });

  it('allows a valid order status transition', async () => {
    const token = await registerAdminAndGetToken(app);
    const order = await seedOrder(5000, 'enquiry');

    const res = await request(app)
      .post(`/api/admin/orders/${order._id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'confirmed', note: 'Advance received' });

    expect(res.status).toBe(200);
    const fresh = await Order.findById(order._id);
    expect(fresh!.status).toBe('confirmed');
    expect(fresh!.referenceId).toBeTruthy();
  });

  it('prevents duplicate salary payments for the same staff and month', async () => {
    const token = await registerAdminAndGetToken(app);

    const staffRes = await request(app)
      .post('/api/admin/staff')
      .set('Authorization', `Bearer ${token}`)
      .send({
        fullName: 'Salary Tester',
        phone: '9000000002',
        locality: 'Kurnool',
        joiningDate: '2025-01-01',
        employmentType: 'permanent',
        specializations: ['stitching'],
        salaryType: 'monthly',
        salaryAmount: 20000,
      });
    expect(staffRes.status).toBe(201);
    const staffId = staffRes.body.data.id;

    const payload = {
      staffId,
      year: 2026,
      month: 3,
      amount: 20000,
      paidAt: '2026-03-31',
    };

    const first = await request(app)
      .post('/api/admin/finance/salaries')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);
    expect(first.status).toBe(201);

    const second = await request(app)
      .post('/api/admin/finance/salaries')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);
    expect(second.status).toBe(409);
    expect(second.body.success).toBe(false);
  });
});
