import request from 'supertest';
import { describe, expect, it } from 'vitest';
import mongoose from 'mongoose';
import { createApp } from '../app';
import { registerAdminAndGetToken } from './helpers/auth';
import { Service } from '../models/Service';
import { Order } from '../models/Order';
import { Customer } from '../models/Customer';

const app = createApp();

describe('Service Management API', () => {
  it('allows public access to get and list services', async () => {
    // List services (initially empty or seeded)
    const listRes = await request(app).get('/api/services');
    expect(listRes.status).toBe(200);
    expect(listRes.body.success).toBe(true);
    expect(Array.isArray(listRes.body.data.items)).toBe(true);
  });

  it('protects mutation endpoints (create, update, delete) from non-admins', async () => {
    const createRes = await request(app).post('/api/services').send({ title: 'Unauthorised Service' });
    expect(createRes.status).toBe(401);

    const updateRes = await request(app).put(`/api/services/${new mongoose.Types.ObjectId()}`).send({ title: 'Edit' });
    expect(updateRes.status).toBe(401);

    const deleteRes = await request(app).delete(`/api/services/${new mongoose.Types.ObjectId()}`);
    expect(deleteRes.status).toBe(401);
  });

  it('runs complete service CRUD lifecycle with operations fields, SEO generation, and delete checks', async () => {
    const token = await registerAdminAndGetToken(app);

    const productType1 = new mongoose.Types.ObjectId();
    const productType2 = new mongoose.Types.ObjectId();

    // 1. Create a service with operations metadata and omitted SEO fields (should auto-generate SEO fields)
    const createRes = await request(app)
      .post('/api/services')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Maggam & Embroidery Work',
        category: 'Traditional',
        summary: 'Premium custom maggam and heavy zari embroidery design for festive blouses.',
        bannerImage: 'https://images.unsplash.com/maggam',
        bannerAlt: '', // empty to test auto-generation
        cardImage: 'https://images.unsplash.com/maggam_card',
        icon: 'traditional',
        isFulfillable: true,
        linkedProductTypeIds: [productType1.toString(), productType2.toString()],
        defaultLeadTimeDays: 14,
        basePriceFrom: 4500,
        tags: ['maggam', 'zari', 'blouse'],
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.success).toBe(true);
    expect(createRes.body.data.id).toBeDefined();
    
    const service = createRes.body.data;
    expect(service.title).toBe('Maggam & Embroidery Work');
    expect(service.slug).toBe('maggam-embroidery-work');
    expect(service.category).toBe('Traditional');
    expect(service.isFulfillable).toBe(true);
    expect(service.defaultLeadTimeDays).toBe(14);
    expect(service.basePriceFrom).toBe(4500);
    expect(service.tags).toEqual(['maggam', 'zari', 'blouse']);
    expect(service.linkedProductTypeIds).toEqual([productType1.toString(), productType2.toString()]);

    // SEO auto-fill verification
    expect(service.bannerAlt).toBe('Maggam & Embroidery Work — Kadamba\'s Designer Studio, Kurnool');
    expect(service.metaTitle).toBe('Maggam & Embroidery Work | Kadamba\'s Designer Studio');
    expect(service.metaDescription).toBe('Premium custom maggam and heavy zari embroidery design for festive blouses.');
    expect(service.ogTitle).toBe(service.metaTitle);
    expect(service.ogDescription).toBe(service.metaDescription);
    expect(service.ogImage).toBe(service.bannerImage);

    const serviceId = service.id;

    // 2. Update service operations and override SEO manually
    const updateRes = await request(app)
      .put(`/api/services/${serviceId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        defaultLeadTimeDays: 10,
        basePriceFrom: 5000,
        metaTitle: 'Custom Maggam Embroidery Work Kurnool',
        metaDescription: 'Custom hand embroidery blouses in Kurnool. Book a boutique consult.',
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.success).toBe(true);

    const updated = updateRes.body.data;
    expect(updated.defaultLeadTimeDays).toBe(10);
    expect(updated.basePriceFrom).toBe(5000);
    expect(updated.metaTitle).toBe('Custom Maggam Embroidery Work Kurnool');
    expect(updated.metaDescription).toBe('Custom hand embroidery blouses in Kurnool. Book a boutique consult.');
    // ogTitle and ogDescription should remain unchanged or regenerate from overridden values
    expect(updated.ogTitle).toBe('Custom Maggam Embroidery Work Kurnool');

    // 3. Test list filter ?fulfillable=true
    // Create an unfulfillable service to test filtering
    const nonFulfillableRes = await request(app)
      .post('/api/services')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Ad-hoc Fitting Service',
        category: 'Boutique',
        summary: 'Consultation only.',
        bannerImage: 'https://images.unsplash.com/fitting',
        bannerAlt: 'Fitting',
        cardImage: 'https://images.unsplash.com/fitting',
        isFulfillable: false,
      });
    expect(nonFulfillableRes.status).toBe(201);

    const listFulfillable = await request(app).get('/api/services?fulfillable=true');
    expect(listFulfillable.status).toBe(200);
    // Should contain Maggam but not Ad-hoc Fitting
    const fulfillableItems = listFulfillable.body.data.items;
    expect(fulfillableItems.some((s: any) => s.id === serviceId)).toBe(true);
    expect(fulfillableItems.some((s: any) => s.id === nonFulfillableRes.body.data.id)).toBe(false);

    // 4. Test delete block if referenced by an Order
    // Create a customer
    const customer = await Customer.create({
      name: 'Radha Devi',
      phone: '9885501234',
      email: 'radha@test.local',
      address: {
        line1: 'Bazaar Street',
        city: 'Kurnool',
      },
    });

    // Create an order referencing the service
    const order = await Order.create({
      orderNumber: 10001,
      customerId: customer._id,
      title: 'Festival Blouse',
      status: 'confirmed',
      priority: 'normal',
      lineItems: [
        {
          name: 'Maggam Blouse',
          serviceId: serviceId,
          qty: 1,
        },
      ],
      paymentSummary: {
        totalQuoted: 5000,
        advance: 2000,
        totalPaid: 2000,
        balance: 3000,
      },
    });

    // Delete should fail since it's referenced by this order
    const deleteFailRes = await request(app)
      .delete(`/api/services/${serviceId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(deleteFailRes.status).toBe(400);
    expect(deleteFailRes.body.success).toBe(false);
    expect(deleteFailRes.body.message).toContain('Cannot delete service because it is referenced by existing orders');

    // Remove referencing order and then delete successfully
    await Order.findByIdAndDelete(order._id);

    const deleteSuccessRes = await request(app)
      .delete(`/api/services/${serviceId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(deleteSuccessRes.status).toBe(200);
    expect(deleteSuccessRes.body.success).toBe(true);
  });
});
