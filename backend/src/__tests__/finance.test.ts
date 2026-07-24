import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../app';
import { registerAdminAndGetToken } from './helpers/auth';
import { Customer } from '../models/Customer';
import { Order } from '../models/Order';
import { Staff } from '../models/Staff';
import { Expense } from '../models/Expense';
import { Payment } from '../models/Payment';
import { SalaryPayment } from '../models/SalaryPayment';

const app = createApp();

describe('Finance API', () => {
  it('protects finance endpoints', async () => {
    const res1 = await request(app).get('/api/admin/finance/summary');
    expect(res1.status).toBe(401);

    const res2 = await request(app).get('/api/admin/finance/payments');
    expect(res2.status).toBe(401);
  });

  it('runs complete payments, expenses, salaries, and profit & loss flow', async () => {
    const token = await registerAdminAndGetToken(app);

    // 1. Setup Customer and Order
    const customer = await Customer.create({
      name: 'Sunitha Kurnool',
      phone: '9848099881',
      city: 'Kurnool',
    });

    const order = await Order.create({
      orderNumber: 201, // unique order number
      customerId: customer._id,
      title: 'Heavy Bridal Lehenga',
      status: 'confirmed',
      priority: 'high',
      lineItems: [
        { name: 'Bridal Lehenga', qty: 1, productTypeCode: 'BR-LH' },
      ],
      paymentSummary: {
        totalQuoted: 50000,
        advance: 10000,
        totalPaid: 10000,
        balance: 40000,
      },
    });

    // 2. Record a normal payment (₹15,000 via UPI)
    const pay1 = await request(app)
      .post('/api/admin/finance/payments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        orderId: order._id.toString(),
        amount: 15000,
        method: 'upi',
        reference: 'UPI1234567890',
        notes: 'Second advance payment',
      });

    expect(pay1.status).toBe(201);
    expect(pay1.body.data.amount).toBe(15000);

    // Verify order totalPaid and balance was updated
    const updatedOrder = await Order.findById(order._id);
    expect(updatedOrder?.paymentSummary.totalPaid).toBe(15000); // 15000 total from Payment database
    expect(updatedOrder?.paymentSummary.balance).toBe(35000);

    // 3. Attempt a payment exceeding remaining balance (₹40,000 exceeds ₹35,000 remaining)
    const payExceed = await request(app)
      .post('/api/admin/finance/payments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        orderId: order._id.toString(),
        amount: 40000,
        method: 'cash',
      });

    expect(payExceed.status).toBe(400);

    // 4. Overwrite/Bypass balance check (e.g. for tips or adjustment overrides)
    const payBypass = await request(app)
      .post('/api/admin/finance/payments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        orderId: order._id.toString(),
        amount: 40000,
        method: 'cash',
        bypassBalanceCheck: true,
      });

    expect(payBypass.status).toBe(201);

    // 5. List payments
    const listPay = await request(app)
      .get(`/api/admin/finance/payments?orderId=${order._id.toString()}`)
      .set('Authorization', `Bearer ${token}`);

    expect(listPay.status).toBe(200);
    expect(listPay.body.data.items.length).toBe(2);

    // 6. Record manual Expense
    const expRes = await request(app)
      .post('/api/admin/finance/expenses')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Atelier Shop Rent July',
        category: 'rent',
        amount: 12000,
        spentAt: new Date().toISOString(),
        notes: 'Monthly rental amount paid to landlord',
      });

    expect(expRes.status).toBe(201);
    expect(expRes.body.data.title).toBe('Atelier Shop Rent July');
    const expenseId = expRes.body.data.id;

    // List Expenses
    const listExp = await request(app)
      .get('/api/admin/finance/expenses?category=rent')
      .set('Authorization', `Bearer ${token}`);
    expect(listExp.status).toBe(200);
    expect(listExp.body.data.items.length).toBe(1);

    // 7. Setup Staff and Record Salary payment
    const staff = await Staff.create({
      fullName: 'Venkatesh Maggam',
      phone: '9000100021',
      locality: 'Prakash Nagar',
      employmentType: 'permanent',
      specializations: ['maggam'],
      joiningDate: new Date(),
    });

    const salRes = await request(app)
      .post('/api/admin/finance/salaries')
      .set('Authorization', `Bearer ${token}`)
      .send({
        staffId: staff._id.toString(),
        year: 2026,
        month: 7,
        amount: 15000,
        paidAt: new Date().toISOString(),
        notes: 'July month basic salary payout',
      });

    expect(salRes.status).toBe(201);
    expect(salRes.body.data.amount).toBe(15000);

    // List salaries
    const listSal = await request(app)
      .get(`/api/admin/finance/salaries?staffId=${staff._id.toString()}`)
      .set('Authorization', `Bearer ${token}`);
    expect(listSal.status).toBe(200);
    expect(listSal.body.data.items.length).toBe(1);

    // 8. Finance Summary Dashboard
    const sumRes = await request(app)
      .get('/api/admin/finance/summary')
      .set('Authorization', `Bearer ${token}`);

    expect(sumRes.status).toBe(200);
    expect(sumRes.body.data.totalRevenue).toBe(55000); // 15000 + 40000
    expect(sumRes.body.data.totalExpenses).toBe(12000); // rent
    expect(sumRes.body.data.totalSalaries).toBe(15000); // Venkatesh salary
    expect(sumRes.body.data.netProfit).toBe(28000); // 55000 - 12000 - 15000

    // 9. Profit & Loss Report details
    const plRes = await request(app)
      .get('/api/admin/finance/profit-loss')
      .set('Authorization', `Bearer ${token}`);

    expect(plRes.status).toBe(200);
    expect(plRes.body.data.summary.revenue).toBe(55000);
    expect(plRes.body.data.payments.length).toBe(2);
    expect(plRes.body.data.expenses.length).toBe(1);
    expect(plRes.body.data.salaries.length).toBe(1);
  }, 20000);
});
