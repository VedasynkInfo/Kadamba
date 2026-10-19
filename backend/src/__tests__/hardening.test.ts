import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../app';
import { AuditLog } from '../models/AuditLog';
import { User } from '../models/User';
import { registerAdminAndGetToken } from './helpers/auth';

const app = createApp();

/** Poll for an audit row — writes land on `finish`, just after the response. */
async function waitForAudit(action: string) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const row = await AuditLog.findOne({ action }).lean();
    if (row) return row;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  return null;
}

async function signInStaff(permissions: string[], email = `staff-${Date.now()}@test.local`) {
  await User.create({
    name: 'Test Stitcher',
    email,
    password: 'staff-password-1234',
    role: 'staff',
    permissions,
  });
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password: 'staff-password-1234' });
  return res.body.data?.token as string;
}

describe('hardening', () => {
  it('redacts financial metrics from the dashboard for staff without finance:read', async () => {
    const staffToken = await signInStaff(['orders:read']);

    const res = await request(app)
      .get('/api/admin/dashboard/summary')
      .set('Authorization', `Bearer ${staffToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.metrics.revenueMtd).toBeNull();
    expect(res.body.data.metrics.outstandingBalance).toBeNull();
    expect(res.body.data.series.revenueByMonth).toEqual([]);
    // Operational data still flows — staff need their worklist.
    expect(typeof res.body.data.metrics.ordersActive).toBe('number');
  });

  it('shows financial metrics to an admin', async () => {
    const adminToken = await registerAdminAndGetToken(app);

    const res = await request(app)
      .get('/api/admin/dashboard/summary')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.data.metrics.revenueMtd).not.toBeNull();
    expect(res.body.data.metrics.outstandingBalance).not.toBeNull();
  });

  it('records a fallback audit entry for a write with no explicit event', async () => {
    const adminToken = await registerAdminAndGetToken(app);

    const created = await request(app)
      .post('/api/admin/products/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ code: `CAT-${Date.now()}`, name: 'Tailoring' });
    expect(created.status).toBe(201);

    const row = await waitForAudit('admin.request');
    expect(row).not.toBeNull();
    expect(row?.summary).toContain('POST /api/admin/products/categories');
    expect(row?.actorRole).toBe('admin');
  });

  it('does not double-log an explicitly audited mutation', async () => {
    const adminToken = await registerAdminAndGetToken(app);

    // Creating a category has no structured event → fallback fires.
    const category = await request(app)
      .post('/api/admin/products/categories')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ code: `CAT-B-${Date.now()}`, name: 'Alterations' });
    expect(category.status).toBe(201);
    await waitForAudit('admin.request');

    // Recording an expense is explicitly audited → no generic duplicate.
    const expense = await request(app)
      .post('/api/admin/finance/expenses')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        title: 'Buttons',
        category: 'fabric',
        amount: 250,
        spentAt: new Date().toISOString(),
      });
    expect(expense.status).toBe(201);

    await waitForAudit('expense.created');
    await new Promise((resolve) => setTimeout(resolve, 200));

    const generic = await AuditLog.find({
      action: 'admin.request',
      summary: /finance\/expenses/,
    }).lean();
    expect(generic).toHaveLength(0);
  });

  it('rejects a refresh attempt from an untrusted origin', async () => {
    const blocked = await request(app)
      .post('/api/auth/refresh')
      .set('Origin', 'https://evil.example')
      .send({});

    expect(blocked.status).toBe(403);
    expect(blocked.body.message).toMatch(/origin/i);
  });

  it('allows a refresh attempt from a trusted origin', async () => {
    const allowed = await request(app)
      .post('/api/auth/refresh')
      .set('Origin', 'http://localhost:5173')
      .send({});

    // No cookie in this request, so it is unauthenticated — but not blocked
    // by the origin guard.
    expect(allowed.status).not.toBe(403);
  });

  it('rejects a logout from an untrusted origin', async () => {
    const adminToken = await registerAdminAndGetToken(app);

    const blocked = await request(app)
      .post('/api/auth/logout')
      .set('Origin', 'https://evil.example')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(blocked.status).toBe(403);
  });
});
