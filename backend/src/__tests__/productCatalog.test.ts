import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../app';
import { registerAdminAndGetToken } from './helpers/auth';
import { ProductCategory } from '../models/ProductCategory';
import { ProductType } from '../models/ProductType';

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

    expect(duplicateRes.status).toBe(500); // throws DB unique constraint or service throw

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
});
