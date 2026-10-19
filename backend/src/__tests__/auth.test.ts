import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../app';
import { ADMIN_CREDENTIALS, registerAdminAndGetToken } from './helpers/auth';
import { RefreshToken } from '../models/RefreshToken';
import { User } from '../models/User';
import { totp } from '../utils/totp';

const app = createApp();

function cookieValue(res: request.Response, name = 'kadamba_rt'): string | undefined {
  const cookies = res.headers['set-cookie'] as unknown as string[] | undefined;
  const match = cookies?.find((c) => c.startsWith(`${name}=`));
  return match?.split(';')[0]?.split('=')[1];
}

describe('Auth hardening', () => {
  it('issues an httpOnly refresh cookie and no refresh token in the body', async () => {
    await registerAdminAndGetToken(app);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: ADMIN_CREDENTIALS.email, password: ADMIN_CREDENTIALS.password });

    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeTruthy();
    expect(res.body.data.refreshToken).toBeUndefined();

    const cookies = res.headers['set-cookie'] as unknown as string[];
    const refreshCookie = cookies.find((c) => c.startsWith('kadamba_rt='));
    expect(refreshCookie).toBeTruthy();
    expect(refreshCookie).toContain('HttpOnly');
    expect(refreshCookie).toContain('Path=/api/auth');
  });

  it('rotates the refresh token and invalidates the previous one', async () => {
    await registerAdminAndGetToken(app);

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: ADMIN_CREDENTIALS.email, password: ADMIN_CREDENTIALS.password });

    const firstRefresh = cookieValue(login)!;
    expect(firstRefresh).toBeTruthy();

    const rotated = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', `kadamba_rt=${firstRefresh}`);

    expect(rotated.status).toBe(200);
    expect(rotated.body.data.token).toBeTruthy();

    const secondRefresh = cookieValue(rotated)!;
    expect(secondRefresh).toBeTruthy();
    expect(secondRefresh).not.toBe(firstRefresh);

    // The old token is now single-use exhausted → replay is rejected.
    const replay = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', `kadamba_rt=${firstRefresh}`);
    expect(replay.status).toBe(401);
  });

  it('revokes the whole session family when a rotated token is replayed', async () => {
    await registerAdminAndGetToken(app);

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: ADMIN_CREDENTIALS.email, password: ADMIN_CREDENTIALS.password });

    const first = cookieValue(login)!;
    const rotated = await request(app).post('/api/auth/refresh').set('Cookie', `kadamba_rt=${first}`);
    const second = cookieValue(rotated)!;

    // Replay the old token → theft assumed → family killed.
    const replay = await request(app).post('/api/auth/refresh').set('Cookie', `kadamba_rt=${first}`);
    expect(replay.status).toBe(401);

    // The legitimate (newest) token must also be dead.
    const afterReuse = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', `kadamba_rt=${second}`);
    expect(afterReuse.status).toBe(401);

    const revoked = await RefreshToken.countDocuments({ revokedAt: { $exists: true } });
    expect(revoked).toBeGreaterThan(0);
  });

  it('kills access tokens immediately after a password change', async () => {
    const token = await registerAdminAndGetToken(app);

    const before = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(before.status).toBe(200);

    const changed = await request(app)
      .patch('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({
        currentPassword: ADMIN_CREDENTIALS.password,
        newPassword: 'A-much-stronger-passphrase-2026',
      });
    expect(changed.status).toBe(200);

    // The pre-change access token must now be rejected (tokenVersion bumped).
    const after = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(after.status).toBe(401);

    // The fresh token from the change response still works.
    const fresh = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${changed.body.data.token}`);
    expect(fresh.status).toBe(200);
  });

  it('locks an account after repeated failed logins', async () => {
    await registerAdminAndGetToken(app);

    for (let i = 0; i < 5; i += 1) {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: ADMIN_CREDENTIALS.email, password: 'wrong-password' });
      expect(res.status).toBe(401);
    }

    // Even the correct password is refused while locked.
    const locked = await request(app)
      .post('/api/auth/login')
      .send({ email: ADMIN_CREDENTIALS.email, password: ADMIN_CREDENTIALS.password });
    expect(locked.status).toBe(423);

    const user = await User.findOne({ email: ADMIN_CREDENTIALS.email });
    expect(user?.lockedUntil).toBeTruthy();
  });

  it('does not reveal whether an email exists on password reset', async () => {
    await registerAdminAndGetToken(app);

    const known = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: ADMIN_CREDENTIALS.email });
    const unknown = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'nobody@example.com' });

    expect(known.status).toBe(200);
    expect(unknown.status).toBe(200);
    expect(known.body.message).toBe(unknown.body.message);
  });

  it('rejects weak passwords on reset', async () => {
    await registerAdminAndGetToken(app);

    const forgot = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: ADMIN_CREDENTIALS.email });

    const devToken = forgot.body.data?.devToken;
    expect(devToken).toBeTruthy();

    const weak = await request(app)
      .post('/api/auth/reset-password')
      .send({ token: devToken, password: 'password123' });
    expect(weak.status).toBe(400);
  });

  it('requires MFA for enrolled accounts and accepts a valid TOTP', async () => {
    const token = await registerAdminAndGetToken(app);

    const start = await request(app)
      .post('/api/auth/mfa/enroll')
      .set('Authorization', `Bearer ${token}`);
    expect(start.status).toBe(200);
    const secret = start.body.data.secret as string;
    expect(secret).toBeTruthy();

    const confirm = await request(app)
      .post('/api/auth/mfa/enroll/confirm')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: totp(secret) });
    expect(confirm.status).toBe(200);
    expect(confirm.body.data.backupCodes).toHaveLength(8);

    // Login now returns an MFA challenge instead of a session.
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: ADMIN_CREDENTIALS.email, password: ADMIN_CREDENTIALS.password });
    expect(login.status).toBe(200);
    expect(login.body.data.mfaRequired).toBe(true);
    expect(login.body.data.token).toBeUndefined();

    const bad = await request(app)
      .post('/api/auth/login/mfa')
      .send({ mfaTicket: login.body.data.mfaTicket, code: '000000' });
    expect(bad.status).toBe(401);

    const good = await request(app)
      .post('/api/auth/login/mfa')
      .send({ mfaTicket: login.body.data.mfaTicket, code: totp(secret) });
    expect(good.status).toBe(200);
    expect(good.body.data.token).toBeTruthy();

    // A recovery code also works, exactly once.
    const backupCode = confirm.body.data.backupCodes[0] as string;
    const withRecovery = await request(app)
      .post('/api/auth/login/mfa')
      .send({ mfaTicket: login.body.data.mfaTicket, recoveryCode: backupCode });
    expect(withRecovery.status).toBe(200);
  });

  it('lists and revokes other sessions', async () => {
    await registerAdminAndGetToken(app);

    const first = await request(app)
      .post('/api/auth/login')
      .send({ email: ADMIN_CREDENTIALS.email, password: ADMIN_CREDENTIALS.password });
    const second = await request(app)
      .post('/api/auth/login')
      .send({ email: ADMIN_CREDENTIALS.email, password: ADMIN_CREDENTIALS.password });

    const firstToken = first.body.data.token as string;
    const secondToken = second.body.data.token as string;

    const list = await request(app)
      .get('/api/auth/sessions')
      .set('Authorization', `Bearer ${firstToken}`);
    expect(list.status).toBe(200);
    expect(list.body.data.items.length).toBeGreaterThanOrEqual(2);

    const other = list.body.data.items.find(
      (s: { current: boolean }) => !s.current,
    ) as { familyId: string };

    const revoked = await request(app)
      .delete(`/api/auth/sessions/${other.familyId}`)
      .set('Authorization', `Bearer ${firstToken}`);
    expect(revoked.status).toBe(200);

    // The other device's access token is still valid until it expires (that is
    // the point of a short TTL), but it can no longer refresh.
    const otherRefresh = cookieValue(second);
    if (otherRefresh) {
      const attempt = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', `kadamba_rt=${otherRefresh}`);
      expect(attempt.status).toBe(401);
    }
    expect(secondToken).toBeTruthy();
  });

  it('records an audit trail for logins', async () => {
    const token = await registerAdminAndGetToken(app);

    const logs = await request(app)
      .get('/api/auth/audit')
      .set('Authorization', `Bearer ${token}`);

    expect(logs.status).toBe(200);
    const actions = (logs.body.data.items as Array<{ action: string }>).map((i) => i.action);
    expect(actions).toContain('auth.login');

    const verify = await request(app)
      .get('/api/auth/audit/verify')
      .set('Authorization', `Bearer ${token}`);
    expect(verify.status).toBe(200);
    expect(verify.body.data.valid).toBe(true);
  });

  it('rejects a forged access token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer not-a-real-token');
    expect(res.status).toBe(401);
  });
});
