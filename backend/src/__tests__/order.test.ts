import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../app';
import { registerAdminAndGetToken } from './helpers/auth';
import { Customer } from '../models/Customer';
import { Lead } from '../models/Lead';
import { Order } from '../models/Order';

const app = createApp();

describe('Order Management API', () => {
  it('protects orders endpoints with JWT authentication', async () => {
    const listRes = await request(app).get('/api/admin/orders');
    expect(listRes.status).toBe(401);

    const createRes = await request(app).post('/api/admin/orders').send({});
    expect(createRes.status).toBe(401);
  });

  it('performs full order lifecycle (create, confirm with Ref ID, update, staff assign, note add)', async () => {
    const token = await registerAdminAndGetToken(app);

    // Create a customer first
    const customer = await Customer.create({
      name: 'Ananya Roy',
      phone: '9988776655',
      email: 'ananya@roy.com',
      city: 'Kurnool',
    });

    // 1. Create an Order in 'enquiry' status
    const createRes = await request(app)
      .post('/api/admin/orders')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerId: customer._id.toString(),
        title: 'Bridal Lehenga and Saree Blouse Set',
        status: 'enquiry',
        priority: 'high',
        lineItems: [
          { name: 'Bridal Lehenga', qty: 1, notes: 'Crimson red raw silk' },
          { name: 'Maggam Blouse', qty: 1, notes: 'Heavy embroidery' },
        ],
        expectedDeliveryAt: new Date(Date.now() + 86400000 * 30).toISOString(),
        paymentSummary: {
          totalQuoted: 45000,
          advance: 15000,
        },
        notes: 'Needs matching tassels.',
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.success).toBe(true);
    expect(createRes.body.data.orderNumber).toBe(1);
    expect(createRes.body.data.referenceId).toBeUndefined(); // no ref id on enquiry status
    expect(createRes.body.data.status).toBe('enquiry');
    expect(createRes.body.data.paymentSummary.balance).toBe(30000);
    expect(createRes.body.data.notes[0].body).toBe('Needs matching tassels.');
    expect(createRes.body.data.timeline[0].status).toBe('enquiry');

    const orderId = createRes.body.data.id;

    // 2. Transition Order to 'confirmed' status
    const confirmRes = await request(app)
      .post(`/api/admin/orders/${orderId}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        status: 'confirmed',
        note: 'Advance payment verified by phone',
      });

    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body.data.status).toBe('confirmed');
    // Generates unique human-readable Reference ID
    expect(confirmRes.body.data.referenceId).toMatch(/^KDS-\d{4}-0001$/);
    expect(confirmRes.body.data.timeline.length).toBe(2);
    expect(confirmRes.body.data.timeline[1].note).toBe('Advance payment verified by phone');

    // 3. Assign Staff to Order
    const assignRes = await request(app)
      .post(`/api/admin/orders/${orderId}/assign`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        assignedStaff: [
          { name: 'Mahesh Kumar', role: 'cutter' },
          { name: 'Sita Bai', role: 'stitcher' },
        ],
      });

    expect(assignRes.status).toBe(200);
    expect(assignRes.body.data.assignedStaff.length).toBe(2);
    expect(assignRes.body.data.assignedStaff[0].name).toBe('Mahesh Kumar');

    // 4. Add note
    const noteRes = await request(app)
      .post(`/api/admin/orders/${orderId}/notes`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        body: 'Client requested gold thread work instead of silver.',
        visibility: 'internal',
      });

    expect(noteRes.status).toBe(201);
    expect(noteRes.body.data.notes.length).toBe(2); // 1 initial note + 1 added note
    expect(noteRes.body.data.notes[1].body).toBe('Client requested gold thread work instead of silver.');

    // 5. Update payments in order
    const updateRes = await request(app)
      .patch(`/api/admin/orders/${orderId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        paymentSummary: {
          totalQuoted: 45000,
          totalPaid: 45000, // full payment
        },
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.paymentSummary.totalPaid).toBe(45000);
    expect(updateRes.body.data.paymentSummary.balance).toBe(0); // balance becomes 0
  });

  it('converts Lead to Order successfully, creating customer and saving lead details', async () => {
    const token = await registerAdminAndGetToken(app);

    // Create a lead
    const lead = await Lead.create({
      name: 'Sneha Reddy',
      phone: '9876543210',
      email: 'sneha@reddy.local',
      city: 'Kurnool',
      service: 'maggamblouse',
      occasion: 'Engagement',
      budget: '₹8,000–₹12,000',
      preferredDate: new Date(Date.now() + 86400000 * 10),
      message: 'Need a customized maggam work blouse with peacock motifs.',
      status: 'New',
    });

    const convertRes = await request(app)
      .post(`/api/admin/orders/from-lead/${lead._id.toString()}`)
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(convertRes.status).toBe(201);
    expect(convertRes.body.success).toBe(true);

    const order = convertRes.body.data;
    expect(order.status).toBe('enquiry');
    expect(order.title).toBe('Bridal consultation — Sneha Reddy');
    expect(order.customerId.name).toBe('Sneha Reddy');
    expect(order.customerId.phone).toBe('9876543210');
    expect(order.lineItems[0].name).toBe('maggamblouse');
    expect(order.leadId).toBe(lead._id.toString());

    // Check that original lead status is updated to 'Qualified'
    const updatedLead = await Lead.findById(lead._id);
    expect(updatedLead?.status).toBe('Qualified');
    expect(updatedLead?.timeline.some((t) => t.label === 'Converted to Order')).toBe(true);

    // Verify Customer profile is now persistent in Customer collection
    const customer = await Customer.findOne({ phone: '9876543210' });
    expect(customer).toBeTruthy();
    expect(customer?.name).toBe('Sneha Reddy');
  });

  it('filters and searches orders correctly', async () => {
    const token = await registerAdminAndGetToken(app);

    const customer1 = await Customer.create({ name: 'Farah Khan', phone: '9000000001' });
    const customer2 = await Customer.create({ name: 'Gita Sen', phone: '9000000002' });

    // Seed Order 1 (Confirmed, high priority)
    await Order.create({
      orderNumber: 101,
      referenceId: 'KDS-2026-0101',
      customerId: customer1._id,
      title: 'Bridal Gown',
      status: 'confirmed',
      priority: 'high',
      lineItems: [{ name: 'Gown', qty: 1 }],
      expectedDeliveryAt: new Date('2026-08-01'),
    });

    // Seed Order 2 (Enquiry, normal priority)
    await Order.create({
      orderNumber: 102,
      customerId: customer2._id,
      title: 'Simple Blouse',
      status: 'enquiry',
      priority: 'normal',
      lineItems: [{ name: 'Blouse', qty: 2 }],
      expectedDeliveryAt: new Date('2026-08-15'),
    });

    // Search by customer name "Farah"
    const searchRes = await request(app)
      .get('/api/admin/orders?q=Farah')
      .set('Authorization', `Bearer ${token}`);

    expect(searchRes.status).toBe(200);
    expect(searchRes.body.data.items.length).toBe(1);
    expect(searchRes.body.data.items[0].title).toBe('Bridal Gown');

    // Search by Reference ID
    const refSearchRes = await request(app)
      .get('/api/admin/orders?q=KDS-2026-0101')
      .set('Authorization', `Bearer ${token}`);

    expect(refSearchRes.status).toBe(200);
    expect(refSearchRes.body.data.items.length).toBe(1);

    // Filter by status "enquiry"
    const filterRes = await request(app)
      .get('/api/admin/orders?status=enquiry')
      .set('Authorization', `Bearer ${token}`);

    expect(filterRes.status).toBe(200);
    expect(filterRes.body.data.items.length).toBe(1);
    expect(filterRes.body.data.items[0].title).toBe('Simple Blouse');
  });
});
