import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../app';
import { ADMIN_CREDENTIALS, registerAdminAndGetToken } from './helpers/auth';

const app = createApp();

describe('auth', () => {
  it('rejects the removed public register route', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Nope', email: 'nope@test.local', password: 'password123' });
    expect(res.status).toBe(404);
  });

  it('logs in a seeded admin and returns a token', async () => {
    await registerAdminAndGetToken(app);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: ADMIN_CREDENTIALS.email, password: ADMIN_CREDENTIALS.password });
    expect(res.status).toBe(200);
    expect(res.body.data.token).toBeTruthy();
    expect(res.body.data.user.role).toBe('admin');
  });

  it('rejects invalid credentials', async () => {
    await registerAdminAndGetToken(app);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: ADMIN_CREDENTIALS.email, password: 'wrong' });
    expect(res.status).toBe(401);
  });

  it('returns the current user with a valid token and 401 without one', async () => {
    const token = await registerAdminAndGetToken(app);
    const ok = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(ok.status).toBe(200);
    expect(ok.body.data.user.email).toBe(ADMIN_CREDENTIALS.email);

    const unauth = await request(app).get('/api/auth/me');
    expect(unauth.status).toBe(401);
  });
});
