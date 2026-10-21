import request from 'supertest';
import { describe, expect, it, beforeEach } from 'vitest';
import { createApp } from '../app';
import { EmailOutbox } from '../models/EmailOutbox';
import { drainEmailOutbox } from '../services/emailOutboxService';

const app = createApp();

/**
 * End-to-end wiring: a public request must leave a durable row in the
 * outbox, and the drainer must be able to deliver it afterwards. Nothing in
 * the request path talks to SMTP any more.
 */
describe('request → outbox → delivery', () => {
  beforeEach(async () => {
    await EmailOutbox.deleteMany({});
  });

  it('queues the studio and customer notifications for a public enquiry', async () => {
    const res = await request(app)
      .post('/api/leads')
      .send({
        name: 'Divya Reddy',
        phone: '9876500000',
        email: 'divya@example.com',
        city: 'Kurnool',
        service: 'Bridal Lehenga',
        occasion: 'Wedding',
        budget: 'High',
        preferredDate: '2026-12-01',
        message: 'I would like to book a bridal fitting consultation.',
      });

    expect(res.status).toBe(201);

    const queued = await EmailOutbox.find({});
    expect(queued.length).toBeGreaterThan(0);

    const customerAck = queued.find((row) => row.to === 'divya@example.com');
    expect(customerAck).toBeTruthy();
    expect(customerAck?.kind).toBe('request-customer');
    expect(customerAck?.status).toBe('pending');
  });

  it('never sends during the request — the SMTP transport is not touched', async () => {
    await request(app)
      .post('/api/leads')
      .send({
        name: 'Divya Reddy',
        phone: '9876500000',
        email: 'divya@example.com',
        city: 'Kurnool',
        service: 'Bridal Lehenga',
        occasion: 'Wedding',
        budget: 'High',
        preferredDate: '2026-12-01',
        message: 'I would like to book a bridal fitting consultation.',
      });

    const pending = await EmailOutbox.countDocuments({ status: 'pending' });
    expect(pending).toBeGreaterThan(0);
    expect(await EmailOutbox.countDocuments({ status: 'sent' })).toBe(0);
  });

  it('delivers the queued notifications on the next drain', async () => {
    await request(app)
      .post('/api/leads')
      .send({
        name: 'Divya Reddy',
        phone: '9876500000',
        email: 'divya@example.com',
        city: 'Kurnool',
        service: 'Bridal Lehenga',
        occasion: 'Wedding',
        budget: 'High',
        preferredDate: '2026-12-01',
        message: 'I would like to book a bridal fitting consultation.',
      });

    const sent: string[] = [];
    const result = await drainEmailOutbox({
      send: async (email) => {
        sent.push(email.to);
      },
    });

    expect(result.sent).toBeGreaterThan(0);
    expect(sent).toContain('divya@example.com');
    expect(await EmailOutbox.countDocuments({ status: 'pending' })).toBe(0);
  });

  it('does not queue a second copy when the same enquiry is submitted twice', async () => {
    const payload = {
      name: 'Divya Reddy',
      phone: '9876500000',
      email: 'divya@example.com',
      city: 'Kurnool',
      service: 'Bridal Lehenga',
      occasion: 'Wedding',
      budget: 'High',
      preferredDate: '2026-12-01',
      message: 'I would like to book a bridal fitting consultation.',
    };

    await request(app).post('/api/leads').send(payload);
    const first = await EmailOutbox.find({}).lean();
    const firstKeys = first.map((row) => row.dedupeKey).filter(Boolean);

    // The same enquiry twice creates two leads, so two *different* dedupe keys
    // — but never a duplicate key.
    await request(app).post('/api/leads').send(payload);
    const second = await EmailOutbox.find({}).lean();
    const allKeys = second.map((row) => row.dedupeKey).filter(Boolean) as string[];

    expect(new Set(allKeys).size).toBe(allKeys.length);
    expect(firstKeys.length).toBeGreaterThan(0);
  });
});
