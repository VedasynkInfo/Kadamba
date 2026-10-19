import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../app';
import { ADMIN_CREDENTIALS, registerAdminAndGetToken } from './helpers/auth';
import { User } from '../models/User';
import { DEFAULT_STAFF_PERMISSIONS } from '../shared/enums';

const app = createApp();

/** Create a staff login directly (the invite flow is exercised separately). */
async function createStaffToken(
  permissions: readonly string[],
  email = `staff-${Date.now()}@test.local`,
) {
  await User.create({
    name: 'Test Stitcher',
    email,
    password: 'staff-password-1234',
    role: 'staff',
    permissions: [...permissions],
  });

  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password: 'staff-password-1234' });

  return { token: res.body.data?.token as string, email };
}

describe('RBAC', () => {
  it('lets staff sign in but not into admin-only areas', async () => {
    const { token } = await createStaffToken(DEFAULT_STAFF_PERMISSIONS);
    expect(token).toBeTruthy();

    // Staff holds orders:read → allowed.
    const orders = await request(app)
      .get('/api/admin/orders')
      .set('Authorization', `Bearer ${token}`);
    expect(orders.status).toBe(200);

    // Staff holds no finance permission → forbidden.
    const finance = await request(app)
      .get('/api/admin/finance/summary')
      .set('Authorization', `Bearer ${token}`);
    expect(finance.status).toBe(403);

    // Users & Roles is admin-only.
    const users = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${token}`);
    expect(users.status).toBe(403);

    // Audit log is admin-only.
    const audit = await request(app)
      .get('/api/auth/audit')
      .set('Authorization', `Bearer ${token}`);
    expect(audit.status).toBe(403);
  });

  it('honours a permission that was granted explicitly', async () => {
    const { token } = await createStaffToken(['finance:read']);

    const finance = await request(app)
      .get('/api/admin/finance/summary')
      .set('Authorization', `Bearer ${token}`);
    expect(finance.status).toBe(200);

    // Read-only: recording a payment must still be refused.
    const write = await request(app)
      .post('/api/admin/finance/payments')
      .set('Authorization', `Bearer ${token}`)
      .send({ orderId: '507f1f77bcf86cd799439011', amount: 100, method: 'cash' });
    expect(write.status).toBe(403);
  });

  it('applies permission changes on the next request', async () => {
    const adminToken = await registerAdminAndGetToken(app);
    const { token, email } = await createStaffToken([]);

    const denied = await request(app)
      .get('/api/admin/orders')
      .set('Authorization', `Bearer ${token}`);
    expect(denied.status).toBe(403);

    const staff = await User.findOne({ email });
    const granted = await request(app)
      .put(`/api/auth/users/${staff!._id}/permissions`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ permissions: ['orders:read'] });
    expect(granted.status).toBe(200);

    // Same token, new capability — no re-login needed.
    const allowed = await request(app)
      .get('/api/admin/orders')
      .set('Authorization', `Bearer ${token}`);
    expect(allowed.status).toBe(200);
  });

  it('rejects an admin attempt to change their own role or status', async () => {
    const token = await registerAdminAndGetToken(app);
    const admin = await User.findOne({ email: ADMIN_CREDENTIALS.email });

    const selfRole = await request(app)
      .patch(`/api/admin/users/${admin!._id}/role`)
      .set('Authorization', `Bearer ${token}`)
      .send({ role: 'staff' });
    expect(selfRole.status).toBe(400);

    const selfStatus = await request(app)
      .patch(`/api/admin/users/${admin!._id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'disabled' });
    expect(selfStatus.status).toBe(400);
  });

  it('cuts off a disabled user immediately', async () => {
    const adminToken = await registerAdminAndGetToken(app);
    const { token, email } = await createStaffToken(['orders:read']);

    const before = await request(app)
      .get('/api/admin/orders')
      .set('Authorization', `Bearer ${token}`);
    expect(before.status).toBe(200);

    const staff = await User.findOne({ email });
    await request(app)
      .patch(`/api/admin/users/${staff!._id}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'disabled' });

    // The cached state is invalidated on disable, so this is immediate.
    const after = await request(app)
      .get('/api/admin/orders')
      .set('Authorization', `Bearer ${token}`);
    expect(after.status).toBe(403);
  });

  it('provisions a staff login with a one-time setup link', async () => {
    const adminToken = await registerAdminAndGetToken(app);

    const created = await request(app)
      .post('/api/admin/staff')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        fullName: 'Provisioned Tailor',
        phone: '9111111111',
        email: 'tailor@test.local',
        locality: 'Kurnool',
        employmentType: 'permanent',
        specializations: ['stitching'],
        salaryType: 'monthly',
        salaryAmount: 25000,
        createLogin: true,
      });

    expect(created.status).toBe(201);
    expect(created.body.data.userId).toBeTruthy();

    const user = await User.findOne({ email: 'tailor@test.local' });
    expect(user?.role).toBe('staff');
    expect(user?.permissions).toEqual([...DEFAULT_STAFF_PERMISSIONS]);

    // The generated password is unusable — only the setup link can sign in.
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'tailor@test.local', password: 'anything-guessable' });
    expect(login.status).toBe(401);
  });
});
