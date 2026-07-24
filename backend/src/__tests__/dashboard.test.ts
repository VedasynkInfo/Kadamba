import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../app';
import { registerAdminAndGetToken } from './helpers/auth';
import { Lead } from '../models/Lead';

const app = createApp();

describe('admin dashboard API', () => {
  it('rejects unauthorized requests', async () => {
    const res = await request(app).get('/api/admin/dashboard/summary');
    expect(res.status).toBe(401);
  });

  it('calculates metrics and aggregates trends correctly for authenticated admin', async () => {
    const token = await registerAdminAndGetToken(app);

    // Seed dummy leads with specific creation dates
    const now = new Date();
    
    // Lead 1: open, created today, source: 'WhatsApp'
    const lead1 = await Lead.create({
      name: 'Client One',
      phone: '9999999999',
      email: 'one@test.local',
      city: 'Kurnool',
      service: 'Bridal Lehenga',
      occasion: 'Wedding',
      budget: '50k-1L',
      preferredDate: new Date(now.getTime() + 86400000),
      message: 'Looking for a custom heavy bridal lehenga.',
      status: 'New',
      source: 'WhatsApp',
      createdAt: now,
    });

    // Lead 2: open, created today, source: 'Request Service'
    const lead2 = await Lead.create({
      name: 'Client Two',
      phone: '8888888888',
      email: 'two@test.local',
      city: 'Kurnool',
      service: 'Maggam Blouse',
      occasion: 'Reception',
      budget: '10k-20k',
      preferredDate: new Date(now.getTime() + 172800000),
      message: 'Need maggam blouse by next week.',
      status: 'Contacted',
      source: 'Request Service',
      createdAt: now,
    });

    // Lead 3: closed (Completed), created today, source: 'Referral'
    const lead3 = await Lead.create({
      name: 'Client Three',
      phone: '7777777777',
      email: 'three@test.local',
      city: 'Kurnool',
      service: 'Designer Saree',
      occasion: 'Festival',
      budget: '20k-30k',
      preferredDate: new Date(now.getTime() + 259200000),
      message: 'Saree designer stitching request.',
      status: 'Completed',
      source: 'Referral',
      createdAt: now,
    });

    // Lead 4: created 2 months ago (Open)
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(now.getMonth() - 2);
    const lead4 = await Lead.create({
      name: 'Client Four',
      phone: '6666666666',
      email: 'four@test.local',
      city: 'Kurnool',
      service: 'Anarkali Suit',
      occasion: 'Party',
      budget: '5k-10k',
      preferredDate: new Date(now.getTime() + 345600000),
      message: 'Stitch designer anarkali suit please.',
      status: 'Qualified',
      source: 'Contact',
      createdAt: twoMonthsAgo,
    });

    // Request dashboard summary (no parameters, defaults to last 12 months)
    const res = await request(app)
      .get('/api/admin/dashboard/summary')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    
    const data = res.body.data;
    
    // Verify metrics
    // Open leads in the range (last 12 months): lead1 (New), lead2 (Contacted), lead4 (Qualified). Total = 3 (lead3 is Completed).
    expect(data.metrics.leadsOpen).toBe(3);
    
    // Pending enquiries in the range: lead1 (New), lead2 (Contacted). Total = 2 (lead4 is Qualified, lead3 is Completed).
    expect(data.metrics.enquiriesPending).toBe(2);
    
    // Orders/revenue metrics (0 when no finance/order seed data in this test)
    expect(data.metrics.ordersActive).toBe(0);
    expect(data.metrics.revenueMtd).toBe(0);
    
    // Verify recent leads contains the latest leads (latest first)
    expect(data.recentLeads.length).toBe(4);
    expect(data.recentLeads[0].name).toBe('Client One'); // sorted by createdAt desc
    expect(data.recentLeads[3].name).toBe('Client Four');

    // Verify lead source aggregation
    const sources = data.series.leadsBySource;
    expect(sources).toContainEqual({ source: 'WhatsApp', count: 1 });
    expect(sources).toContainEqual({ source: 'Request Service', count: 1 });
    expect(sources).toContainEqual({ source: 'Referral', count: 1 });
    expect(sources).toContainEqual({ source: 'Contact', count: 1 });

    // Verify monthly lead trends
    const trends = data.series.leadsByMonth;
    expect(trends.length).toBeGreaterThanOrEqual(1);
  });

  it('filters dashboard metrics correctly by from/to parameters', async () => {
    const token = await registerAdminAndGetToken(app);

    const now = new Date();
    
    // Lead created 1 month ago
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(now.getMonth() - 1);
    await Lead.create({
      name: 'Client Old',
      phone: '9999999999',
      email: 'old@test.local',
      city: 'Kurnool',
      service: 'Bridal Lehenga',
      occasion: 'Wedding',
      budget: '50k-1L',
      preferredDate: new Date(now.getTime() + 86400000),
      message: 'Looking for a custom heavy bridal lehenga.',
      status: 'New',
      source: 'WhatsApp',
      createdAt: oneMonthAgo,
    });

    // Lead created today
    await Lead.create({
      name: 'Client Today',
      phone: '8888888888',
      email: 'today@test.local',
      city: 'Kurnool',
      service: 'Maggam Blouse',
      occasion: 'Reception',
      budget: '10k-20k',
      preferredDate: new Date(now.getTime() + 172800000),
      message: 'Need maggam blouse by next week.',
      status: 'New',
      source: 'Request Service',
      createdAt: now,
    });

    // Filter range: from 15 days ago to tomorrow (should only include Client Today)
    const fifteenDaysAgo = new Date();
    fifteenDaysAgo.setDate(now.getDate() - 15);
    
    const tomorrow = new Date();
    tomorrow.setDate(now.getDate() + 1);

    const res = await request(app)
      .get(`/api/admin/dashboard/summary?from=${fifteenDaysAgo.toISOString()}&to=${tomorrow.toISOString()}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    const data = res.body.data;
    
    // Only Client Today is within the range
    expect(data.metrics.leadsOpen).toBe(1);
    expect(data.recentLeads.length).toBe(1);
    expect(data.recentLeads[0].name).toBe('Client Today');
  });

  it('rejects invalid date parameters', async () => {
    const token = await registerAdminAndGetToken(app);
    const res = await request(app)
      .get('/api/admin/dashboard/summary?from=invalid-date')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });
});
