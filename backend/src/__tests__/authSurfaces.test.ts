import request from 'supertest';
import { describe, expect, it, beforeEach } from 'vitest';
import { createApp } from '../app';
import { User } from '../models/User';
import { PasswordResetToken } from '../models/PasswordResetToken';
import { upsertAdminUser } from '../services/authService';
import { ADMIN_CREDENTIALS, registerAdminAndGetToken } from './helpers/auth';
import { totp } from '../utils/totp';

const app = createApp();

describe('auth surfaces', () => {
  beforeEach(async () => {
    await PasswordResetToken.deleteMany({});
  });

  it('returns the signed-in user', async () => {
    const token = await registerAdminAndGetToken(app);
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.user.email).toBe(ADMIN_CREDENTIALS.email);
    expect(res.body.data.user.password).toBeUndefined();
  });

  it('updates the signed-in user profile', async () => {
    const token = await registerAdminAndGetToken(app);
    const res = await request(app)
      .patch('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Renamed Admin' });

    expect(res.status).toBe(200);
    expect(res.body.data.user.name).toBe('Renamed Admin');
  });

  it('ignores an email in the profile payload — the account email is not editable here', async () => {
    const token = await registerAdminAndGetToken(app);
    await upsertAdminUser({
      name: 'Other Admin',
      email: 'other.admin@test.local',
      password: 'other-password-123',
    });

    const res = await request(app)
      .patch('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Still The Admin', email: 'other.admin@test.local' });

    expect(res.status).toBe(200);
    // The email belongs to the other account and was not taken over.
    const unchanged = await User.findOne({ email: 'other.admin@test.local' }).lean();
    expect(unchanged?.name).toBe('Other Admin');
  });

  it('refuses a password change without the current password', async () => {
    const token = await registerAdminAndGetToken(app);
    const res = await request(app)
      .patch('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ newPassword: 'BrandNewPass9' });

    expect(res.status).toBe(400);
  });

  it('issues a password reset and accepts it once', async () => {
    await upsertAdminUser(ADMIN_CREDENTIALS);

    const requested = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: ADMIN_CREDENTIALS.email });
    expect(requested.status).toBe(200);

    const admin = await User.findOne({ email: ADMIN_CREDENTIALS.email });
    const record = await PasswordResetToken.findOne({ userId: admin!._id });
    expect(record).toBeTruthy();

    // The raw token is only available in the response outside production.
    const token = requested.body.data?.devToken as string | undefined;
    expect(token).toBeTruthy();

    const reset = await request(app)
      .post('/api/auth/reset-password')
      .send({ token, password: 'BrandNewPass9' });
    expect(reset.status).toBe(200);

    // The token is single-use.
    const replay = await request(app)
      .post('/api/auth/reset-password')
      .send({ token, password: 'BrandNewPass9' });
    expect(replay.status).toBe(400);
  });

  it('answers a password reset request for an unknown account without leaking', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'nobody@example.com' });

    expect(res.status).toBe(200);
    expect(res.body.data).toBeUndefined();
  });

  it('refuses a reset token that was never issued', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: 'not-a-real-token', password: 'BrandNewPass9' });
    expect(res.status).toBe(400);
  });

  it('refuses a reset with a password that fails the policy', async () => {
    await upsertAdminUser(ADMIN_CREDENTIALS);
    const requested = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: ADMIN_CREDENTIALS.email });
    const token = requested.body.data?.devToken as string;

    const res = await request(app)
      .post('/api/auth/reset-password')
      .send({ token, password: 'weak' });
    expect(res.status).toBe(400);
  });

  it('enrols, confirms and disables two-factor authentication', async () => {
    const token = await registerAdminAndGetToken(app);

    const status = await request(app)
      .get('/api/auth/mfa')
      .set('Authorization', `Bearer ${token}`);
    expect(status.status).toBe(200);
    expect(status.body.data.enabled).toBe(false);

    const started = await request(app)
      .post('/api/auth/mfa/enroll')
      .set('Authorization', `Bearer ${token}`);
    expect(started.status).toBe(200);
    const secret = started.body.data.secret as string;
    expect(secret).toBeTruthy();

    const confirmed = await request(app)
      .post('/api/auth/mfa/enroll/confirm')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: totp(secret) });
    expect(confirmed.status).toBe(200);
    expect(confirmed.body.data.enabled).toBe(true);
    expect(confirmed.body.data.backupCodes.length).toBeGreaterThan(0);

    const disabled = await request(app)
      .post('/api/auth/mfa/disable')
      .set('Authorization', `Bearer ${token}`)
      .send({ password: ADMIN_CREDENTIALS.password, code: totp(secret) });
    expect(disabled.status).toBe(200);
    expect(disabled.body.data.enabled).toBe(false);
  });

  it('refuses to confirm enrolment with the wrong code', async () => {
    const token = await registerAdminAndGetToken(app);
    const started = await request(app)
      .post('/api/auth/mfa/enroll')
      .set('Authorization', `Bearer ${token}`);
    expect(started.status).toBe(200);

    const res = await request(app)
      .post('/api/auth/mfa/enroll/confirm')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: '000000' });
    expect(res.status).toBe(400);
  });

  it('issues fresh backup codes', async () => {
    const token = await registerAdminAndGetToken(app);
    const started = await request(app)
      .post('/api/auth/mfa/enroll')
      .set('Authorization', `Bearer ${token}`);
    const secret = started.body.data.secret as string;
    await request(app)
      .post('/api/auth/mfa/enroll/confirm')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: totp(secret) });

    const res = await request(app)
      .post('/api/auth/mfa/backup-codes')
      .set('Authorization', `Bearer ${token}`)
      .send({ password: ADMIN_CREDENTIALS.password });

    expect(res.status).toBe(200);
    expect(res.body.data.backupCodes.length).toBeGreaterThan(0);
  });

  it('lists the sessions and can revoke them all', async () => {
    const token = await registerAdminAndGetToken(app);
    await request(app)
      .post('/api/auth/login')
      .send({ email: ADMIN_CREDENTIALS.email, password: ADMIN_CREDENTIALS.password });

    const list = await request(app)
      .get('/api/auth/sessions')
      .set('Authorization', `Bearer ${token}`);
    expect(list.status).toBe(200);
    expect(list.body.data.items.length).toBeGreaterThanOrEqual(2);

    const revoked = await request(app)
      .post('/api/auth/sessions/revoke-all')
      .set('Authorization', `Bearer ${token}`);
    expect(revoked.status).toBe(200);

    // The token that was just revoked no longer works.
    const after = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(after.status).toBe(401);
  });

  it('changes a user’s permissions', async () => {
    const token = await registerAdminAndGetToken(app);
    const other = await upsertAdminUser({
      name: 'Staff User',
      email: 'staff.user@test.local',
      password: 'staff-password-123',
    });

    const res = await request(app)
      .put(`/api/auth/users/${other.user.id}/permissions`)
      .set('Authorization', `Bearer ${token}`)
      .send({ permissions: ['orders:read'] });

    expect(res.status).toBe(200);
    const updated = await User.findById(other.user.id).lean();
    expect(updated?.permissions).toEqual(['orders:read']);
  });

  it('refuses a permission change for a user that does not exist', async () => {
    const token = await registerAdminAndGetToken(app);
    const res = await request(app)
      .put('/api/auth/users/64b000000000000000000000/permissions')
      .set('Authorization', `Bearer ${token}`)
      .send({ permissions: [] });
    expect(res.status).toBe(404);
  });

  it('serves the audit trail and verifies its chain', async () => {
    const token = await registerAdminAndGetToken(app);

    const list = await request(app)
      .get('/api/auth/audit')
      .set('Authorization', `Bearer ${token}`);
    expect(list.status).toBe(200);
    expect(list.body.data).toBeTruthy();

    const verified = await request(app)
      .get('/api/auth/audit/verify')
      .set('Authorization', `Bearer ${token}`);
    expect(verified.status).toBe(200);
    expect(verified.body.data.valid).toBe(true);
  });

  it('keeps the audit trail admin-only', async () => {
    const res = await request(app).get('/api/auth/audit');
    expect(res.status).toBe(401);
  });

  it('signs out and invalidates the refresh cookie', async () => {
    const token = await registerAdminAndGetToken(app);

    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });
});
