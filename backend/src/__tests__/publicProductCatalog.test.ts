import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../app';
import { ProductCategory } from '../models/ProductCategory';
import { ProductType } from '../models/ProductType';
import { registerAdminAndGetToken } from './helpers/auth';

const app = createApp();

describe('Public product catalogue', () => {
  it('lists active categories and products with stable slugs', async () => {
    const token = await registerAdminAndGetToken(app);
    await request(app)
      .post('/api/admin/products/seed')
      .set('Authorization', `Bearer ${token}`)
      .send()
      .expect(200);

    const res = await request(app).get('/api/products').expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.categories.length).toBe(8);
    expect(res.body.data.products.length).toBeGreaterThan(20);

    const product = res.body.data.products[0];
    expect(product.slug).toMatch(/^[a-z0-9-]+$/);
    expect(product.category.name).toBeTruthy();
    expect(product).not.toHaveProperty('measurementTemplateId');
    expect(Array.isArray(product.defaultStages)).toBe(true);
  });

  it('resolves a product by slug and by workshop code', async () => {
    const token = await registerAdminAndGetToken(app);
    await request(app)
      .post('/api/admin/products/seed')
      .set('Authorization', `Bearer ${token}`)
      .send()
      .expect(200);

    const catalog = await request(app).get('/api/products').expect(200);
    const product = catalog.body.data.products[0];

    const bySlug = await request(app).get(`/api/products/${product.slug}`).expect(200);
    expect(bySlug.body.data.id).toBe(product.id);

    const byCode = await request(app)
      .get(`/api/products/${product.code.toLowerCase()}`)
      .expect(200);
    expect(byCode.body.data.id).toBe(product.id);

    await request(app).get('/api/products/not-a-real-garment').expect(404);
  });

  it('removes a deactivated product and category from the public catalogue', async () => {
    const token = await registerAdminAndGetToken(app);
    await request(app)
      .post('/api/admin/products/seed')
      .set('Authorization', `Bearer ${token}`)
      .send()
      .expect(200);

    const catalog = await request(app).get('/api/products').expect(200);
    const product = catalog.body.data.products[0];

    await request(app)
      .patch(`/api/admin/products/product-types/${product.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ active: false })
      .expect(200);

    const after = await request(app).get('/api/products').expect(200);
    expect(after.body.data.products.some((item: { id: string }) => item.id === product.id)).toBe(
      false,
    );
    await request(app).get(`/api/products/${product.slug}`).expect(404);
  });

  it('backfills a missing slug without colliding with an inactive garment', async () => {
    const token = await registerAdminAndGetToken(app);
    await request(app)
      .post('/api/admin/products/seed')
      .set('Authorization', `Bearer ${token}`)
      .send()
      .expect(200);

    const category = await ProductCategory.findOne();
    if (!category) throw new Error('Seeded catalogue has no category');

    await ProductType.create({
      code: 'ZZ-LEGACY',
      slug: 'legacy-garment',
      name: 'Legacy Garment',
      categoryId: category._id,
      active: false,
      sortOrder: 0,
      defaultStages: [],
    });
    await ProductType.create({
      code: 'ZZ-ACTIVE',
      name: 'Legacy Garment',
      categoryId: category._id,
      active: true,
      sortOrder: 0,
      defaultStages: [],
    });

    const res = await request(app).get('/api/products').expect(200);
    const active = res.body.data.products.find(
      (item: { code: string }) => item.code === 'ZZ-ACTIVE',
    );

    expect(active.slug).toBe('legacy-garment-2');
    const saved = await ProductType.findOne({ code: 'ZZ-ACTIVE' }).select('slug');
    expect(saved?.slug).toBe('legacy-garment-2');
  });

  it('serves featured products with gallery, variants and lead time', async () => {
    const token = await registerAdminAndGetToken(app);
    await request(app)
      .post('/api/admin/products/seed')
      .set('Authorization', `Bearer ${token}`)
      .send()
      .expect(200);

    const catalog = await request(app).get('/api/products').expect(200);
    const product = catalog.body.data.products.find((item: { featured: boolean }) => item.featured);
    expect(product).toBeTruthy();

    const detail = await request(app).get(`/api/products/${product.slug}`).expect(200);
    expect(detail.body.data.featured).toBe(true);
    expect(Array.isArray(detail.body.data.gallery)).toBe(true);
    expect(Array.isArray(detail.body.data.variants)).toBe(true);
    expect(detail.body.data.leadTimeDays).toBeGreaterThan(0);
    expect(detail.body.data).not.toHaveProperty('measurementTemplateId');
    expect(detail.body.data).not.toHaveProperty('sku');

    const featuredOnly = await request(app).get('/api/products?featured=true').expect(200);
    expect(featuredOnly.body.data.products.length).toBeGreaterThan(0);
    expect(
      featuredOnly.body.data.products.every((item: { featured: boolean }) => item.featured),
    ).toBe(true);

    const hidden = await request(app).get('/api/products?featured=false').expect(200);
    expect(hidden.body.data.products.every((item: { featured: boolean }) => !item.featured)).toBe(
      true,
    );
  });
});
