import request from 'supertest';
import mongoose from 'mongoose';
import { describe, expect, it } from 'vitest';
import { createApp } from '../app';
import { Order } from '../models/Order';
import { Service } from '../models/Service';
import { registerAdminAndGetToken } from './helpers/auth';
const app = createApp();

describe('Product Catalog API', () => {
  it('protects product endpoints', async () => {
    const res = await request(app).get('/api/admin/products/categories');
    expect(res.status).toBe(401);
  });

  it('runs complete product catalog sequence: seed, list categories, CRUD product types, and check uniques', async () => {
    const token = await registerAdminAndGetToken(app);

    // 1. Seed the catalog
    const seedRes = await request(app)
      .post('/api/admin/products/seed')
      .set('Authorization', `Bearer ${token}`)
      .send();

    expect(seedRes.status).toBe(200);
    expect(seedRes.body.success).toBe(true);
    expect(seedRes.body.data.categoriesSeeded).toBe(8);
    expect(seedRes.body.data.typesSeeded).toBeGreaterThan(20);

    // 2. List categories and verify sortOrder
    const catRes = await request(app)
      .get('/api/admin/products/categories')
      .set('Authorization', `Bearer ${token}`);

    expect(catRes.status).toBe(200);
    expect(catRes.body.data.length).toBe(8);
    expect(catRes.body.data[0].code).toBe('BRIDAL');
    expect(catRes.body.data[1].code).toBe('BLOUSES');

    const bridalCatId = catRes.body.data[0]._id;

    // 3. List seeded product types
    const listRes = await request(app)
      .get(`/api/admin/products/product-types?categoryId=${bridalCatId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.data.items.length).toBeGreaterThan(0);
    expect(listRes.body.data.items[0].code).toMatch(/^BR-/);

    // 4. Create custom product type
    const customTypeRes = await request(app)
      .post('/api/admin/products/product-types')
      .set('Authorization', `Bearer ${token}`)
      .send({
        code: 'BR-CUST-LH',
        name: 'Super Heavy Bridal Lehenga',
        categoryId: bridalCatId,
        description: 'Intricate Maggam work lehenga with matching blouse and two dupattas',
        measurementTemplateId: 'BR-LH',
        indicativePriceRange: '₹35,000–₹85,000',
        sortOrder: 5,
      });

    expect(customTypeRes.status).toBe(201);
    expect(customTypeRes.body.data.code).toBe('BR-CUST-LH');

    const customId = customTypeRes.body.data._id;

    // 5. Block duplicate code
    const duplicateRes = await request(app)
      .post('/api/admin/products/product-types')
      .set('Authorization', `Bearer ${token}`)
      .send({
        code: 'BR-CUST-LH',
        name: 'Alternate name',
        categoryId: bridalCatId,
      });

    expect(duplicateRes.status).toBe(409); // service reports the duplicate code

    // 6. Get Product Type detail
    const getRes = await request(app)
      .get(`/api/admin/products/product-types/${customId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.data.name).toBe('Super Heavy Bridal Lehenga');
    expect(getRes.body.data.categoryId.code).toBe('BRIDAL');

    // 7. Update Product Type details
    const updateRes = await request(app)
      .patch(`/api/admin/products/product-types/${customId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        indicativePriceRange: '₹45,000–₹95,000',
        active: false,
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.indicativePriceRange).toBe('₹45,000–₹95,000');
    expect(updateRes.body.data.active).toBe(false);
  });

  it('stores gallery, variants, featured, lead time and SEO, and reports usage', async () => {
    const token = await registerAdminAndGetToken(app);
    await request(app)
      .post('/api/admin/products/seed')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const categories = await request(app)
      .get('/api/admin/products/categories')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    const bridalId = categories.body.data[0]._id;

    const created = await request(app)
      .post('/api/admin/products/product-types')
      .set('Authorization', `Bearer ${token}`)
      .send({
        code: 'BR-USAGE',
        name: 'Usage Test Lehenga',
        categoryId: bridalId,
        measurementTemplateId: 'BR-LH',
        featured: true,
        leadTimeDays: 45,
        leadTimeNote: '45 days after the final fitting',
        tags: ['bridal', 'handwork'],
        gallery: [
          { id: 'img-1', url: '/uploads/products/front.jpg', alt: 'Front view' },
          { id: 'img-2', url: '/uploads/products/detail.jpg', alt: 'Embroidery detail' },
        ],
        variants: [
          { id: 'variant-1', name: 'Sweetheart neckline', priceRange: '+ Rs 4,000', active: true },
        ],
        seo: {
          metaTitle: 'Hand-embroidered bridal lehenga',
          metaDescription: 'A made-to-measure bridal lehenga from Kadamba.',
          ogImage: '/uploads/products/front.jpg',
        },
        image: '/uploads/products/front.jpg',
      })
      .expect(201);

    expect(created.body.data.measurementTemplateId).toBeTruthy();
    expect(created.body.data.measurementTemplate.code).toBe('BR-LH');
    expect(created.body.data.gallery).toHaveLength(2);
    expect(created.body.data.variants[0].name).toBe('Sweetheart neckline');
    expect(created.body.data.featured).toBe(true);
    expect(created.body.data.leadTimeDays).toBe(45);
    expect(created.body.data.seo.metaTitle).toContain('bridal lehenga');

    const productId = created.body.data.id;

    await Service.create({
      slug: 'bridal-service-usage',
      title: 'Bridal Couture',
      category: 'Bridal',
      summary: 'Bridal fittings',
      description: [],
      bannerImage: '/uploads/banner.jpg',
      bannerAlt: 'Bridal banner',
      cardImage: '/uploads/card.jpg',
      icon: 'bridal',
      gallery: [],
      features: [],
      pricing: { note: '', startingFrom: '', tiers: [] },
      includes: [],
      durationNote: '',
      ctaLabel: 'Enquire',
      published: true,
      sortOrder: 0,
      linkedProductTypeIds: [productId],
    });

    await Order.create({
      orderNumber: 9001,
      customerId: new mongoose.Types.ObjectId(),
      status: 'measurements',
      priority: 'normal',
      title: 'Usage test order',
      lineItems: [{ productTypeCode: 'BR-USAGE', name: 'Usage Test Lehenga', qty: 1 }],
      measurementProfileIds: [],
      assignedStaff: [],
    });

    const usage = await request(app)
      .get(`/api/admin/products/product-types/${productId}/usage`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(usage.body.data.orderCount).toBe(1);
    expect(usage.body.data.openOrderCount).toBe(1);
    expect(usage.body.data.serviceCount).toBe(1);
    expect(usage.body.data.services[0].title).toBe('Bridal Couture');

    // Unlinking the fit card is a normal edit; existing orders are untouched.
    const cleared = await request(app)
      .patch(`/api/admin/products/product-types/${productId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        measurementTemplateId: null,
        leadTimeDays: null,
        description: '',
        seo: {},
      })
      .expect(200);
    expect(cleared.body.data.measurementTemplateId).toBeUndefined();
    expect(cleared.body.data.leadTimeDays).toBeUndefined();
    expect(cleared.body.data.description).toBeUndefined();
    expect(cleared.body.data.seo).toBeUndefined();
  });

  it('persists drag reorder and bulk status/feature changes', async () => {
    const token = await registerAdminAndGetToken(app);
    await request(app)
      .post('/api/admin/products/seed')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const list = await request(app)
      .get('/api/admin/products/product-types?limit=100')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    const ids = list.body.data.items.map((item: { id: string }) => item.id);
    const reversed = [...ids].reverse();

    await request(app)
      .patch('/api/admin/products/product-types/reorder')
      .set('Authorization', `Bearer ${token}`)
      .send({ ids: reversed })
      .expect(200);

    const reordered = await request(app)
      .get('/api/admin/products/product-types?limit=100')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(reordered.body.data.items[0].id).toBe(reversed[0]);

    const selected = reversed.slice(0, 2);
    const bulk = await request(app)
      .patch('/api/admin/products/product-types/bulk')
      .set('Authorization', `Bearer ${token}`)
      .send({ ids: selected, updates: { active: false, featured: true } })
      .expect(200);
    expect(bulk.body.data.updated).toBe(2);

    const first = await request(app)
      .get(`/api/admin/products/product-types/${selected[0]}`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(first.body.data.active).toBe(false);
    expect(first.body.data.featured).toBe(true);
  });

  it('imports CSV rows independently and reports the failing row', async () => {
    const token = await registerAdminAndGetToken(app);
    await request(app)
      .post('/api/admin/products/seed')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const result = await request(app)
      .post('/api/admin/products/product-types/import')
      .set('Authorization', `Bearer ${token}`)
      .send({
        rows: [
          {
            row: 2,
            code: 'CSV-NEW',
            name: 'CSV Imported Lehenga',
            category: 'BRIDAL',
            template: 'BR-LH',
            tags: 'bridal;handwork',
            featured: 'true',
            leadTimeDays: '12',
            priceRange: 'Rs 12,000',
            gallery: JSON.stringify([{ id: 'img-1', url: '/uploads/csv.jpg', alt: 'CSV image' }]),
          },
          {
            row: 3,
            code: 'CSV-BAD',
            name: 'Missing Category',
          },
          {
            row: 4,
            code: 'BR-LH',
            name: 'Renamed Seed Lehenga',
            category: 'BRIDAL',
            active: 'false',
          },
        ],
      })
      .expect(200);

    expect(result.body.data.total).toBe(3);
    expect(result.body.data.created).toBe(1);
    expect(result.body.data.updated).toBe(1);
    expect(result.body.data.failed).toHaveLength(1);
    expect(result.body.data.failed[0].row).toBe(3);
    expect(result.body.data.failed[0].message).toContain('category');

    const search = await request(app)
      .get('/api/admin/products/product-types?search=CSV-NEW')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(search.body.data.items).toHaveLength(1);
    const imported = search.body.data.items[0];
    expect(imported.tags).toEqual(['bridal', 'handwork']);
    expect(imported.featured).toBe(true);
    expect(imported.leadTimeDays).toBe(12);
    expect(imported.indicativePriceRange).toBe('Rs 12,000');
    expect(imported.gallery[0].alt).toBe('CSV image');
    expect(imported.measurementTemplate.code).toBe('BR-LH');
  });
});
