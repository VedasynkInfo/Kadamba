import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../app';
import { registerAdminAndGetToken } from './helpers/auth';

const app = createApp();

describe('admin route guards', () => {
  it('blocks unauthenticated access to admin leads', async () => {
    const res = await request(app).get('/api/leads');
    expect(res.status).toBe(401);
  });

  it('allows an admin token to reach admin leads', async () => {
    const token = await registerAdminAndGetToken(app);
    const res = await request(app).get('/api/leads').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
  });
});
