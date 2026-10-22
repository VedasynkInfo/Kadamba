import request from 'supertest';
import { describe, expect, it, beforeEach } from 'vitest';
import { createApp } from '../app';
import { Customer } from '../models/Customer';
import { MeasurementProfile } from '../models/MeasurementProfile';
import { MeasurementTemplate } from '../models/MeasurementTemplate';
import { registerAdminAndGetToken } from './helpers/auth';

const app = createApp();

const TEMPLATE_FIELDS = [
  {
    key: 'bust',
    label: 'Bust',
    type: 'number',
    required: true,
    min: 0,
    max: 100,
    group: 'Upper Body',
    sortOrder: 1,
  },
  {
    key: 'cup_size',
    label: 'Cup Size',
    type: 'text',
    required: false,
    group: 'Upper Body',
    sortOrder: 2,
  },
];

async function seedTemplate(overrides: Record<string, unknown> = {}) {
  return MeasurementTemplate.create({
    code: 'BR-LH',
    name: 'Bridal Lehenga',
    category: 'Bridal Collection',
    description: 'Complete bridal lehenga',
    fieldDefs: TEMPLATE_FIELDS,
    version: 1,
    ...overrides,
  });
}

async function seedCustomer() {
  return Customer.create({
    name: 'Meera Kumari',
    phone: '9000000001',
    email: 'meera@example.com',
  });
}

describe('measurement templates', () => {
  beforeEach(async () => {
    await MeasurementTemplate.deleteMany({});
  });

  it('lists templates with pagination', async () => {
    const token = await registerAdminAndGetToken(app);
    await seedTemplate();
    await seedTemplate({ code: 'BL-SR', name: 'Saree Blouse' });

    const res = await request(app)
      .get('/api/measurement-templates')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(2);
    expect(res.body.data.pagination.total).toBe(2);
  });

  it('filters templates by active, category and search', async () => {
    const token = await registerAdminAndGetToken(app);
    await seedTemplate();
    await seedTemplate({
      code: 'BL-SR',
      name: 'Saree Blouse',
      category: 'Ethnic / Designer Blouses',
      active: false,
    });

    const byActive = await request(app)
      .get('/api/measurement-templates?active=false')
      .set('Authorization', `Bearer ${token}`);
    expect(byActive.body.data.items).toHaveLength(1);
    expect(byActive.body.data.items[0].code).toBe('BL-SR');

    const byCategory = await request(app)
      .get('/api/measurement-templates?category=Bridal%20Collection')
      .set('Authorization', `Bearer ${token}`);
    expect(byCategory.body.data.items).toHaveLength(1);

    const bySearch = await request(app)
      .get('/api/measurement-templates?q=Saree')
      .set('Authorization', `Bearer ${token}`);
    expect(bySearch.body.data.items).toHaveLength(1);
  });

  it('reads one template by code and 404s for an unknown code', async () => {
    const token = await registerAdminAndGetToken(app);
    await seedTemplate();

    const found = await request(app)
      .get('/api/measurement-templates/BR-LH')
      .set('Authorization', `Bearer ${token}`);
    expect(found.status).toBe(200);
    expect(found.body.data.name).toBe('Bridal Lehenga');

    const missing = await request(app)
      .get('/api/measurement-templates/NOPE')
      .set('Authorization', `Bearer ${token}`);
    expect(missing.status).toBe(404);
  });

  it('creates a template and refuses a duplicate code', async () => {
    const token = await registerAdminAndGetToken(app);

    const created = await request(app)
      .post('/api/measurement-templates')
      .set('Authorization', `Bearer ${token}`)
      .send({
        code: 'BR-LH',
        name: 'Bridal Lehenga',
        category: 'Bridal Collection',
        fieldDefs: TEMPLATE_FIELDS,
      });

    expect(created.status).toBe(201);
    expect(created.body.data.version).toBe(1);

    const duplicate = await request(app)
      .post('/api/measurement-templates')
      .set('Authorization', `Bearer ${token}`)
      .send({
        code: 'BR-LH',
        name: 'Another Lehenga',
        category: 'Bridal Collection',
        fieldDefs: TEMPLATE_FIELDS,
      });
    expect(duplicate.status).toBe(409);
  });

  it('updates a template and bumps its version', async () => {
    const token = await registerAdminAndGetToken(app);
    await seedTemplate();

    const res = await request(app)
      .put('/api/measurement-templates/BR-LH')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Bridal Lehenga (2026)' });

    expect(res.status).toBe(200);
    expect(res.body.data.name).toBe('Bridal Lehenga (2026)');
    expect(res.body.data.version).toBe(2);
  });

  it('refuses to rename a template onto an existing code', async () => {
    const token = await registerAdminAndGetToken(app);
    await seedTemplate();
    await seedTemplate({ code: 'BL-SR', name: 'Saree Blouse' });

    const res = await request(app)
      .put('/api/measurement-templates/BR-LH')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: 'BL-SR' });

    expect(res.status).toBe(409);
  });

  it('archives a template and restores it', async () => {
    const token = await registerAdminAndGetToken(app);
    await seedTemplate();

    const archived = await request(app)
      .patch('/api/measurement-templates/BR-LH/archive')
      .set('Authorization', `Bearer ${token}`)
      .send({ active: false });
    expect(archived.status).toBe(200);
    expect(archived.body.data.active).toBe(false);
    expect(archived.body.data.version).toBe(2);

    const restored = await request(app)
      .patch('/api/measurement-templates/BR-LH/archive')
      .set('Authorization', `Bearer ${token}`)
      .send({ active: true });
    expect(restored.body.data.active).toBe(true);
  });

  it('404s when archiving an unknown template', async () => {
    const token = await registerAdminAndGetToken(app);
    const res = await request(app)
      .patch('/api/measurement-templates/NOPE/archive')
      .set('Authorization', `Bearer ${token}`)
      .send({ active: false });
    expect(res.status).toBe(404);
  });

  it('seeds the template catalogue once', async () => {
    const token = await registerAdminAndGetToken(app);

    const first = await request(app)
      .post('/api/measurement-templates/seed')
      .set('Authorization', `Bearer ${token}`);
    expect(first.status).toBe(200);
    expect(first.body.data.count).toBeGreaterThan(10);

    const second = await request(app)
      .post('/api/measurement-templates/seed')
      .set('Authorization', `Bearer ${token}`);
    expect(second.body.data.message).toContain('already seeded');
  });

  it('requires authentication for the template desk', async () => {
    const res = await request(app).get('/api/measurement-templates');
    expect(res.status).toBe(401);
  });
});

describe('measurement profiles', () => {
  beforeEach(async () => {
    await MeasurementTemplate.deleteMany({});
    await MeasurementProfile.deleteMany({});
  });

  async function seedProfile(overrides: Record<string, unknown> = {}) {
    const customer = await seedCustomer();
    return MeasurementProfile.create({
      customerId: String(customer._id),
      productTypeCode: 'BR-LH',
      profileName: 'Bridal Lehenga — Meera',
      unit: 'inches',
      status: 'draft',
      values: { bust: 34, cup_size: 'B' },
      notes: 'First fitting',
      measuredBy: 'seed',
      measuredAt: new Date(),
      currentVersion: 1,
      versions: [],
      ...overrides,
    });
  }

  it('lists profiles and names the customer', async () => {
    const token = await registerAdminAndGetToken(app);
    await seedProfile();

    const res = await request(app)
      .get('/api/measurements')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0].customerName).toBe('Meera Kumari');
  });

  it('filters profiles by status, customer, product type and search', async () => {
    const token = await registerAdminAndGetToken(app);
    const customer = await seedCustomer();
    await MeasurementProfile.create({
      customerId: String(customer._id),
      productTypeCode: 'BR-LH',
      profileName: 'Silk Lehenga',
      unit: 'inches',
      status: 'active',
      values: { bust: 34 },
      measuredBy: 'seed',
      measuredAt: new Date(),
      currentVersion: 1,
      versions: [],
    });

    const byStatus = await request(app)
      .get('/api/measurements?status=active')
      .set('Authorization', `Bearer ${token}`);
    expect(byStatus.body.data.items).toHaveLength(1);

    const byCustomer = await request(app)
      .get(`/api/measurements?customerId=${customer._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(byCustomer.body.data.items).toHaveLength(1);

    const byProduct = await request(app)
      .get('/api/measurements?productTypeCode=BR-LH')
      .set('Authorization', `Bearer ${token}`);
    expect(byProduct.body.data.items).toHaveLength(1);

    const bySearch = await request(app)
      .get('/api/measurements?q=Silk')
      .set('Authorization', `Bearer ${token}`);
    expect(bySearch.body.data.items).toHaveLength(1);
  });

  it('reads one profile and 404s for an unknown id', async () => {
    const token = await registerAdminAndGetToken(app);
    const profile = await seedProfile();

    const found = await request(app)
      .get(`/api/measurements/${profile._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(found.status).toBe(200);
    expect(found.body.data.id).toBe(String(profile._id));

    const missing = await request(app)
      .get('/api/measurements/64b000000000000000000000')
      .set('Authorization', `Bearer ${token}`);
    expect(missing.status).toBe(404);
  });

  it('creates a profile against an active template', async () => {
    const token = await registerAdminAndGetToken(app);
    await seedTemplate();
    const customer = await seedCustomer();

    const res = await request(app)
      .post('/api/measurements')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerId: String(customer._id),
        productTypeCode: 'BR-LH',
        profileName: 'Bridal Lehenga — Meera',
        unit: 'inches',
        values: { bust: 34 },
      });

    expect(res.status).toBe(201);
    expect(res.body.data.values.bust).toBe(34);
  });

  it('refuses a profile for a template that does not exist', async () => {
    const token = await registerAdminAndGetToken(app);
    const customer = await seedCustomer();

    const res = await request(app)
      .post('/api/measurements')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customerId: String(customer._id),
        productTypeCode: 'NOPE',
        profileName: 'Nothing',
        unit: 'inches',
        values: {},
      });

    expect(res.status).toBe(404);
    expect(res.body.message).toContain('Measurement template');
  });

  it('records a version when the measurements change', async () => {
    const token = await registerAdminAndGetToken(app);
    const profile = await seedProfile();

    const res = await request(app)
      .put(`/api/measurements/${profile._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ values: { bust: 36, cup_size: 'B' }, notes: 'Second fitting' });

    expect(res.status).toBe(200);
    expect(res.body.data.currentVersion).toBe(2);
    expect(res.body.data.versions).toHaveLength(1);
    expect(res.body.data.versions[0].changedBy).toBeTruthy();
  });

  it('does not record a version when only the notes change', async () => {
    const token = await registerAdminAndGetToken(app);
    const profile = await seedProfile();

    const res = await request(app)
      .put(`/api/measurements/${profile._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ notes: 'A different note' });

    expect(res.status).toBe(200);
    expect(res.body.data.currentVersion).toBe(1);
    expect(res.body.data.versions).toHaveLength(0);
  });

  it('refuses to move a profile onto an unknown template', async () => {
    const token = await registerAdminAndGetToken(app);
    const profile = await seedProfile();

    const res = await request(app)
      .put(`/api/measurements/${profile._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ productTypeCode: 'NOPE' });

    expect(res.status).toBe(404);
  });

  it('archives a profile and brings it back', async () => {
    const token = await registerAdminAndGetToken(app);
    const profile = await seedProfile();

    const archived = await request(app)
      .patch(`/api/measurements/${profile._id}/archive`)
      .set('Authorization', `Bearer ${token}`)
      .send({ archive: true });
    expect(archived.status).toBe(200);
    expect(archived.body.data.status).toBe('archived');

    const restored = await request(app)
      .patch(`/api/measurements/${profile._id}/archive`)
      .set('Authorization', `Bearer ${token}`)
      .send({ archive: false });
    expect(restored.body.data.status).toBe('active');
  });

  it('duplicates a profile as a fresh draft', async () => {
    const token = await registerAdminAndGetToken(app);
    const profile = await seedProfile();

    const res = await request(app)
      .post(`/api/measurements/${profile._id}/duplicate`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('draft');
    expect(res.body.data.profileName).toContain('(Copy)');
    expect(res.body.data.currentVersion).toBe(1);
  });

  it('returns the version history of a profile', async () => {
    const token = await registerAdminAndGetToken(app);
    const profile = await seedProfile({
      versions: [
        {
          values: { bust: 34 },
          notes: 'Initial seed',
          changedBy: 'seed',
          changedAt: new Date(),
          reason: 'Seed data',
        },
      ],
    });

    const res = await request(app)
      .get(`/api/measurements/${profile._id}/history`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.versions).toHaveLength(1);
    expect(res.body.data.versions[0].changedBy).toBe('seed');
    expect(res.body.data.versions[0].reason).toBe('Seed data');
  });

  it('seeds sample profiles from customers and templates', async () => {
    const token = await registerAdminAndGetToken(app);
    await seedTemplate();
    await seedCustomer();

    const res = await request(app)
      .post('/api/measurements/seed')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.count).toBe(1);
    expect(await MeasurementProfile.countDocuments({})).toBe(1);
  });

  it('does not seed profiles without customers', async () => {
    const token = await registerAdminAndGetToken(app);
    await seedTemplate();

    const res = await request(app)
      .post('/api/measurements/seed')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.count).toBe(0);
    expect(res.body.data.message).toContain('requires customer data');
  });

  it('does not seed profiles without templates', async () => {
    const token = await registerAdminAndGetToken(app);
    await seedCustomer();

    const res = await request(app)
      .post('/api/measurements/seed')
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.data.count).toBe(0);
    expect(res.body.data.message).toContain('requires measurement templates');
  });
});
