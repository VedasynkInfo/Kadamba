import request from 'supertest';
import type { Express } from 'express';
import { upsertAdminUser } from '../../services/authService';

export const ADMIN_CREDENTIALS = {
  name: 'Test Admin',
  email: 'admin@test.local',
  password: 'test-password-123',
};

/** Creates an admin directly and returns a valid bearer token via login. */
export async function registerAdminAndGetToken(app: Express): Promise<string> {
  await upsertAdminUser(ADMIN_CREDENTIALS);
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: ADMIN_CREDENTIALS.email, password: ADMIN_CREDENTIALS.password });
  return res.body.data.token as string;
}
