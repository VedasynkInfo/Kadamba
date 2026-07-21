import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../app';

const app = createApp();

describe('public endpoints', () => {
  it('serves public content collections', async () => {
    for (const path of ['/api/gallery', '/api/services', '/api/blogs', '/api/portfolio', '/api/settings']) {
      const res = await request(app).get(path);
      expect(res.status, `${path} should be public`).toBe(200);
      expect(res.body.success).toBe(true);
    }
  });

  it('validates the contact form', async () => {
    const missing = await request(app).post('/api/contact').send({ name: 'A' });
    expect(missing.status).toBe(400);
    expect(missing.body.success).toBe(false);
  });

  it('sets Helmet security headers', async () => {
    const res = await request(app).get('/');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });
});
