import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../app';
import { registerAdminAndGetToken } from './helpers/auth';
import { Customer } from '../models/Customer';
import { Order } from '../models/Order';
import { MeasurementProfile } from '../models/MeasurementProfile';

const app = createApp();

describe('Customer Management CRM API', () => {
  it('protects customer endpoints', async () => {
    const res = await request(app).get('/api/admin/customers');
    expect(res.status).toBe(401);
  });

  it('runs complete customer lifecycle: create, duplicate check, detail query, update, note logging, list searches, and archival logic', async () => {
    const token = await registerAdminAndGetToken(app);

    // 1. Create a customer
    const createRes = await request(app)
      .post('/api/admin/customers')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Harika Reddy',
        phone: '9900112233',
        email: 'harika@reddy.local',
        whatsapp: '9900112233',
        address: {
          line1: 'Fl-202, SV Residency',
          landmark: 'Opp Rama Temple',
          locality: 'Prakash Nagar',
          city: 'Kurnool',
          state: 'Andhra Pradesh',
          pincode: '518004',
        },
        source: 'instagram',
        tags: ['bridal', 'VIP'],
        notes: 'Requested heavy zari lehengas only.',
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.success).toBe(true);
    expect(createRes.body.data.name).toBe('Harika Reddy');
    expect(createRes.body.data.address.locality).toBe('Prakash Nagar');

    const customerId = createRes.body.data.id;

    // 2. Duplicate Check: Block same phone
    const duplicateRes = await request(app)
      .post('/api/admin/customers')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Harika Reddy SV',
        phone: '9900112233', // duplicate
      });

    expect(duplicateRes.status).toBe(409);
    expect(duplicateRes.body.success).toBe(false);
    expect(duplicateRes.body.duplicateFound).toBe(true);

    // Force Create bypass
    const forceCreateRes = await request(app)
      .post('/api/admin/customers')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Harika Reddy SV',
        phone: '9900112233',
        force: true,
      });

    expect(forceCreateRes.status).toBe(201);
    expect(forceCreateRes.body.data.name).toBe('Harika Reddy SV');

    // 3. Post CRM Note
    const noteRes = await request(app)
      .post(`/api/admin/customers/${customerId}/notes`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        body: 'Fitting trial rescheduled to next Tuesday.',
        pinned: true,
      });

    expect(noteRes.status).toBe(201);
    expect(noteRes.body.data[0].body).toBe('Fitting trial rescheduled to next Tuesday.');
    expect(noteRes.body.data[0].pinned).toBe(true);

    // 4. Update Customer Info
    const updateRes = await request(app)
      .patch(`/api/admin/customers/${customerId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        whatsapp: '9900112234',
        preferredUnit: 'cm',
        tags: ['bridal', 'VIP', 'rush'],
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.whatsapp).toBe('9900112234');
    expect(updateRes.body.data.preferredUnit).toBe('cm');
    expect(updateRes.body.data.tags).toContain('rush');

    // 5. Query Customer Detail with counts
    // Seed an order for this customer
    await Order.create({
      orderNumber: 201,
      customerId: customerId,
      title: 'Zari Border Saree Stitching',
      status: 'stitching',
      priority: 'high',
      lineItems: [{ name: 'Saree Blouse', qty: 1 }],
      paymentSummary: { totalQuoted: 3500, advance: 1500, totalPaid: 1500, balance: 2000 },
    });

    // Seed a measurement profile
    await MeasurementProfile.create({
      customerId: customerId,
      productTypeCode: 'BLOUSE',
      profileName: 'Standard Fitting',
      unit: 'in',
      status: 'active',
      values: { bust: 36, waist: 30 },
      measuredAt: new Date(),
    });

    const getRes = await request(app)
      .get(`/api/admin/customers/${customerId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.data.summary.orderCount).toBe(1);
    expect(getRes.body.data.summary.activeOrderCount).toBe(1);
    expect(getRes.body.data.summary.measurementCount).toBe(1);
    expect(getRes.body.data.summary.totalSpent).toBe(1500);

    // 6. Nested Queries
    const ordersRes = await request(app)
      .get(`/api/admin/customers/${customerId}/orders`)
      .set('Authorization', `Bearer ${token}`);
    expect(ordersRes.status).toBe(200);
    expect(ordersRes.body.data.length).toBe(1);

    const measurementsRes = await request(app)
      .get(`/api/admin/customers/${customerId}/measurements`)
      .set('Authorization', `Bearer ${token}`);
    expect(measurementsRes.status).toBe(200);
    expect(measurementsRes.body.data.length).toBe(1);

    // 7. Search & Filters
    // Search by locality
    const searchLocRes = await request(app)
      .get('/api/admin/customers?q=Prakash')
      .set('Authorization', `Bearer ${token}`);
    expect(searchLocRes.body.data.items.length).toBe(1);

    // Search by tag
    const searchTagRes = await request(app)
      .get('/api/admin/customers?tag=rush')
      .set('Authorization', `Bearer ${token}`);
    expect(searchTagRes.body.data.items.length).toBe(1);

    // Filter by hasOpenOrders
    const openOrdersFilter = await request(app)
      .get('/api/admin/customers?hasOpenOrders=true')
      .set('Authorization', `Bearer ${token}`);
    expect(openOrdersFilter.body.data.items.length).toBe(1);

    // 8. Archival restriction (customer has open order)
    const archiveFailRes = await request(app)
      .patch(`/api/admin/customers/${customerId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ archive: true });

    expect(archiveFailRes.status).toBe(400); // blocked because customer has open order
    expect(archiveFailRes.body.message).toMatch(/Cannot archive.*active.*orders/);

    // Transition order to delivery (closed)
    await Order.updateMany({ customerId }, { status: 'delivery' });

    // Try archive again
    const archiveSuccessRes = await request(app)
      .patch(`/api/admin/customers/${customerId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ archive: true });

    expect(archiveSuccessRes.status).toBe(200);

    // Get detail now should fail
    const getArchiveRes = await request(app)
      .get(`/api/admin/customers/${customerId}`)
      .set('Authorization', `Bearer ${token}`);
    expect(getArchiveRes.status).toBe(404);
  });
});
