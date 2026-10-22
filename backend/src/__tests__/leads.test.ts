import request from 'supertest';
import { describe, expect, it, beforeEach } from 'vitest';
import { createApp } from '../app';
import { Customer } from '../models/Customer';
import { Lead } from '../models/Lead';
import { Order } from '../models/Order';
import { registerAdminAndGetToken } from './helpers/auth';

const app = createApp();

const ENQUIRY = {
  name: 'Divya Reddy',
  phone: '9876500000',
  email: 'divya@example.com',
  city: 'Kurnool',
  service: 'Bridal Lehenga',
  occasion: 'Wedding',
  budget: '₹50,000 – ₹80,000',
  preferredDate: '2030-01-01',
  message: 'I would like to book a bridal fitting consultation next month.',
};

async function seedLead(overrides: Record<string, unknown> = {}) {
  return Lead.create({
    name: 'Anita Rao',
    phone: '9876500001',
    email: 'anita@example.com',
    city: 'Kurnool',
    service: 'Blouse',
    occasion: 'Office',
    budget: 'Mid',
    preferredDate: new Date(),
    message: 'A message long enough for the enquiry form rules.',
    inspirationImages: [],
    status: 'New',
    source: 'Referral',
    assignee: 'Unassigned',
    notes: [],
    timeline: [],
    followUps: [],
    ...overrides,
  });
}

describe('leads desk', () => {
  beforeEach(async () => {
    await Lead.deleteMany({});
    await Order.deleteMany({});
    await Customer.deleteMany({});
  });

  it('lists leads and reports the pagination', async () => {
    const token = await registerAdminAndGetToken(app);
    await seedLead();
    await seedLead({ name: 'Bhavani Lakshmi', email: 'bhavani@example.com' });

    const res = await request(app)
      .get('/api/leads')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(2);
    expect(res.body.data.pagination.total).toBe(2);
  });

  it('filters by status, source and assignee', async () => {
    const token = await registerAdminAndGetToken(app);
    await seedLead({ status: 'Qualified', assignee: 'Studio Team' });

    const byStatus = await request(app)
      .get('/api/leads?status=Qualified')
      .set('Authorization', `Bearer ${token}`);
    expect(byStatus.body.data.items).toHaveLength(1);

    const byAssignee = await request(app)
      .get('/api/leads?assignee=Studio%20Team')
      .set('Authorization', `Bearer ${token}`);
    expect(byAssignee.body.data.items).toHaveLength(1);

    const bySource = await request(app)
      .get('/api/leads?source=Referral')
      .set('Authorization', `Bearer ${token}`);
    expect(bySource.body.data.items).toHaveLength(1);
  });

  it('refuses an unknown status filter', async () => {
    const token = await registerAdminAndGetToken(app);
    const res = await request(app)
      .get('/api/leads?status=Nonsense')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });

  it('searches by name, phone and service', async () => {
    const token = await registerAdminAndGetToken(app);
    await seedLead();
    await seedLead({
      name: 'Someone Else',
      phone: '9876509999',
      email: 'other@example.com',
      service: 'Saree',
    });

    const byName = await request(app)
      .get('/api/leads?q=Anita')
      .set('Authorization', `Bearer ${token}`);
    expect(byName.body.data.items).toHaveLength(1);

    const byPhone = await request(app)
      .get('/api/leads?q=9876500001')
      .set('Authorization', `Bearer ${token}`);
    expect(byPhone.body.data.items).toHaveLength(1);

    const byService = await request(app)
      .get('/api/leads?q=Blouse')
      .set('Authorization', `Bearer ${token}`);
    expect(byService.body.data.items).toHaveLength(1);
  });

  it('finds a lead by its order number', async () => {
    const token = await registerAdminAndGetToken(app);
    await seedLead({ orderNumber: 4242 });

    const res = await request(app)
      .get('/api/leads?q=4242')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.items).toHaveLength(1);
    expect(res.body.data.items[0].orderNumber).toBe(4242);
  });

  it('reads one lead and 404s for an unknown id', async () => {
    const token = await registerAdminAndGetToken(app);
    const lead = await seedLead();

    const found = await request(app)
      .get(`/api/leads/${lead._id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(found.status).toBe(200);
    expect(found.body.data.name).toBe('Anita Rao');

    const missing = await request(app)
      .get('/api/leads/64b000000000000000000000')
      .set('Authorization', `Bearer ${token}`);
    expect(missing.status).toBe(404);

    const invalid = await request(app)
      .get('/api/leads/not-an-id')
      .set('Authorization', `Bearer ${token}`);
    expect(invalid.status).toBe(400);
  });

  it('moves a lead through the pipeline and records it on the timeline', async () => {
    const token = await registerAdminAndGetToken(app);
    const lead = await seedLead();

    const res = await request(app)
      .patch(`/api/leads/${lead._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'Qualified', assignee: 'Studio Team' });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('Qualified');
    expect(res.body.data.assignee).toBe('Studio Team');
    expect(res.body.data.timeline.length).toBeGreaterThan(0);
  });

  it('rejects an unknown status on a lead', async () => {
    const token = await registerAdminAndGetToken(app);
    const lead = await seedLead();

    const res = await request(app)
      .patch(`/api/leads/${lead._id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'Nonsense' });

    expect(res.status).toBe(400);
  });

  it('adds a note to a lead', async () => {
    const token = await registerAdminAndGetToken(app);
    const lead = await seedLead();

    const res = await request(app)
      .post(`/api/leads/${lead._id}/notes`)
      .set('Authorization', `Bearer ${token}`)
      .send({ body: 'Called her; she will come in on Saturday.' });

    expect(res.status).toBe(201);
    expect(res.body.data.notes).toHaveLength(1);
    expect(res.body.data.notes[0].body).toContain('Saturday');
  });

  it('refuses an empty note', async () => {
    const token = await registerAdminAndGetToken(app);
    const lead = await seedLead();

    const res = await request(app)
      .post(`/api/leads/${lead._id}/notes`)
      .set('Authorization', `Bearer ${token}`)
      .send({ body: '   ' });

    expect(res.status).toBe(400);
  });

  it('schedules a follow-up and points the lead at it', async () => {
    const token = await registerAdminAndGetToken(app);
    const lead = await seedLead();

    const res = await request(app)
      .post(`/api/leads/${lead._id}/follow-ups`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        scheduledAt: '2030-02-01T10:00:00.000Z',
        type: 'call',
        notes: 'Confirm the fabric',
      });

    expect(res.status).toBe(201);
    expect(res.body.data.followUps).toHaveLength(1);
    expect(res.body.data.followUps[0].status).toBe('pending');
    expect(res.body.data.nextFollowUpDate).toBeTruthy();
  });

  it('completes a follow-up and moves the pointer to the next one', async () => {
    const token = await registerAdminAndGetToken(app);
    const lead = await seedLead({
      followUps: [
        {
          scheduledAt: new Date('2030-02-01T10:00:00.000Z'),
          type: 'call',
          notes: 'First',
          status: 'pending',
        },
        {
          scheduledAt: new Date('2030-03-01T10:00:00.000Z'),
          type: 'email',
          notes: 'Second',
          status: 'pending',
        },
      ],
    });

    const followUpId = String((lead.followUps[0] as unknown as { _id: mongoose.Types.ObjectId })._id);

    const res = await request(app)
      .patch(`/api/leads/${lead._id}/follow-ups/${followUpId}/complete`)
      .set('Authorization', `Bearer ${token}`)
      .send({ outcome: 'Booked a fitting' });

    expect(res.status).toBe(200);
    expect(res.body.data.followUps[0].status).toBe('completed');
    expect(res.body.data.followUps[0].outcome).toBe('Booked a fitting');
    // The pointer moves on to the next pending follow-up.
    expect(res.body.data.nextFollowUpDate).toBeTruthy();
  });

  it('404s when completing an unknown follow-up', async () => {
    const token = await registerAdminAndGetToken(app);
    const lead = await seedLead();

    const res = await request(app)
      .patch(`/api/leads/${lead._id}/follow-ups/64b000000000000000000000/complete`)
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(404);
  });

  it('exports the leads as CSV', async () => {
    const token = await registerAdminAndGetToken(app);
    await seedLead();

    const res = await request(app)
      .get('/api/leads/export')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/csv');
    expect(res.text).toContain('Anita Rao');
  });

  it('exports only the filtered leads', async () => {
    const token = await registerAdminAndGetToken(app);
    await seedLead({ status: 'Qualified' });
    await seedLead({ name: 'Other Person', email: 'other@example.com', status: 'New' });

    const res = await request(app)
      .get('/api/leads/export?status=Qualified')
      .set('Authorization', `Bearer ${token}`);

    expect(res.text).toContain('Anita Rao');
    expect(res.text).not.toContain('Other Person');
  });

  it('keeps the lead desk behind authentication', async () => {
    expect((await request(app).get('/api/leads')).status).toBe(401);
  });
});

describe('public enquiry', () => {
  beforeEach(async () => {
    await Lead.deleteMany({});
    await Order.deleteMany({});
    await Customer.deleteMany({});
  });

  it('creates a lead, a customer stub and an enquiry order', async () => {
    const res = await request(app).post('/api/leads').send(ENQUIRY);

    expect(res.status).toBe(201);
    expect(res.body.data.id).toBeTruthy();
    expect(res.body.data.orderId).toBeTruthy();
    expect(res.body.data.orderNumber).toBeTruthy();

    expect(await Lead.countDocuments({})).toBe(1);
    expect(await Customer.countDocuments({})).toBe(1);
    expect(await Order.countDocuments({})).toBe(1);
  });

  it('scores the lead and records the quality', async () => {
    const res = await request(app).post('/api/leads').send(ENQUIRY);
    expect(res.status).toBe(201);

    const lead = await Lead.findById(res.body.data.id).lean();
    expect(lead?.score).toBeGreaterThan(0);
    expect(['hot', 'warm', 'cold']).toContain(lead?.quality);
    expect(lead?.scoreBreakdown).toBeTruthy();
  });

  it('reuses an existing customer with the same phone number', async () => {
    await Customer.create({
      name: 'Divya Reddy',
      phone: '9876500000',
      email: 'divya@example.com',
    });

    await request(app).post('/api/leads').send(ENQUIRY);

    expect(await Customer.countDocuments({})).toBe(1);
    const customer = await Customer.findOne({ phone: '9876500000' }).lean();
    expect(customer?.leadIds?.length).toBe(1);
  });

  it('refuses an enquiry with a missing field', async () => {
    const res = await request(app).post('/api/leads').send({ ...ENQUIRY, email: undefined });
    expect(res.status).toBe(400);
  });
});
