import request from 'supertest';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { describe, expect, it } from 'vitest';
import { createApp } from '../app';
import { env } from '../config/env';
import { User } from '../models/User';
import { signAccessToken } from '../services/tokenService';
import { defaultErrorCode, ERROR_CODES, type ErrorCode } from '../shared/enums';
import { ADMIN_CREDENTIALS, registerAdminAndGetToken } from './helpers/auth';

const app = createApp();

/**
 * The error envelope is a contract the SPA codes against: `code` decides which
 * recovery the UI offers, so it must be present and correct on *every* failure
 * path — not just the ones a handler bothered to name.
 */
function expectErrorEnvelope(
  res: { status: number; body: { success?: unknown; code?: unknown; message?: unknown } },
  status: number,
  code: ErrorCode,
) {
  expect(res.status).toBe(status);
  expect(res.body.success).toBe(false);
  expect(res.body.code).toBe(code);
  expect(ERROR_CODES).toContain(res.body.code);
  expect(typeof res.body.message).toBe('string');
  expect(String(res.body.message).length).toBeGreaterThan(0);
}

describe('defaultErrorCode', () => {
  it('maps each documented status to its code', () => {
    expect(defaultErrorCode(401)).toBe('UNAUTHENTICATED');
    expect(defaultErrorCode(403)).toBe('FORBIDDEN');
    expect(defaultErrorCode(404)).toBe('NOT_FOUND');
    expect(defaultErrorCode(409)).toBe('CONFLICT');
    expect(defaultErrorCode(422)).toBe('VALIDATION_FAILED');
    expect(defaultErrorCode(423)).toBe('ACCOUNT_LOCKED');
    expect(defaultErrorCode(429)).toBe('RATE_LIMITED');
    expect(defaultErrorCode(500)).toBe('INTERNAL');
    expect(defaultErrorCode(503)).toBe('INTERNAL');
  });

  it('falls back to BAD_REQUEST for unlisted 4xx statuses rather than returning undefined', () => {
    for (const status of [400, 402, 405, 418, 451]) {
      expect(defaultErrorCode(status)).toBe('BAD_REQUEST');
    }
  });
});

describe('401 — authentication', () => {
  it('reports a missing token as UNAUTHENTICATED', async () => {
    const res = await request(app).get('/api/leads');
    expectErrorEnvelope(res, 401, 'UNAUTHENTICATED');
  });

  it('reports a malformed token as UNAUTHENTICATED, not as an expired session', async () => {
    const res = await request(app)
      .get('/api/leads')
      .set('Authorization', 'Bearer not-a-real-jwt');
    expectErrorEnvelope(res, 401, 'UNAUTHENTICATED');
  });

  it('reports an expired token as TOKEN_EXPIRED so the client can refresh instead of re-login', async () => {
    const expired = jwt.sign({ id: String(new mongoose.Types.ObjectId()) }, env.jwtSecret, {
      expiresIn: -10,
      issuer: env.jwtIssuer,
      audience: env.jwtAudience,
    });

    const res = await request(app)
      .get('/api/leads')
      .set('Authorization', `Bearer ${expired}`);
    expectErrorEnvelope(res, 401, 'TOKEN_EXPIRED');
  });
});

describe('403 — authorisation', () => {
  it('reports a signed-in staff account without the capability as FORBIDDEN', async () => {
    const staff = await User.create({
      name: 'Desk Staff',
      email: 'staff-no-role@test.local',
      password: 'staff-password-123',
      role: 'staff',
      status: 'active',
      permissions: [],
    });

    const res = await request(app)
      .get('/api/leads')
      .set('Authorization', `Bearer ${signAccessToken(staff, 'contract-test-family')}`);

    expectErrorEnvelope(res, 403, 'FORBIDDEN');
    // The missing capability is named, so the UI can explain the refusal.
    expect(JSON.stringify(res.body.errors)).toContain('leads:read');
  });
});

describe('404 — not found', () => {
  it('reports an unknown route as NOT_FOUND', async () => {
    const res = await request(app).get('/api/definitely-not-a-route');
    expectErrorEnvelope(res, 404, 'NOT_FOUND');
  });

  it('reports a missing record as NOT_FOUND rather than an empty success', async () => {
    const token = await registerAdminAndGetToken(app);
    const res = await request(app)
      .get(`/api/leads/${new mongoose.Types.ObjectId().toString()}`)
      .set('Authorization', `Bearer ${token}`);

    expectErrorEnvelope(res, 404, 'NOT_FOUND');
  });

  it('reports an unknown console URL as NOT_FOUND, not as a permission failure', async () => {
    // The slug-availability helper is mounted under /api/admin, and it used to
    // gate *every* unmatched path there with its own `router.use`. A staff member
    // without `content:write` therefore got 403 for a URL that simply does not
    // exist — a permission error where the truth was "no such endpoint". The
    // gate is per route now, so the path falls through to the not-found handler.
    const staff = await User.create({
      name: 'Desk Staff Two',
      email: 'staff-no-content@test.local',
      password: 'staff-password-123',
      role: 'staff',
      status: 'active',
      permissions: [],
    });

    const res = await request(app)
      .get('/api/admin/not-a-real-endpoint')
      .set('Authorization', `Bearer ${signAccessToken(staff, 'contract-test-family')}`);

    expectErrorEnvelope(res, 404, 'NOT_FOUND');
  });
});

describe('400 — bad request', () => {
  it('reports failed field validation as VALIDATION_FAILED with field detail', async () => {
    const res = await request(app).post('/api/leads').send({});
    expectErrorEnvelope(res, 400, 'VALIDATION_FAILED');
    expect(Array.isArray(res.body.errors)).toBe(true);
    expect(res.body.errors.length).toBeGreaterThan(0);
  });

  it('rejects a non-ObjectId path parameter as VALIDATION_FAILED', async () => {
    const token = await registerAdminAndGetToken(app);
    const res = await request(app)
      .get('/api/leads/not-an-object-id')
      .set('Authorization', `Bearer ${token}`);

    expectErrorEnvelope(res, 400, 'VALIDATION_FAILED');
  });
});

describe('409 — conflict', () => {
  it('reports a taken slug as CONFLICT and suggests a free one', async () => {
    const token = await registerAdminAndGetToken(app);
    const first = await request(app)
      .post('/api/gallery')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Conflict Piece', category: 'Bridal', src: '/media/placeholders/bridal.jpg', slug: 'conflict-piece' });
    expect(first.status).toBe(201);

    const second = await request(app)
      .post('/api/gallery')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Another Piece', category: 'Bridal', src: '/media/placeholders/bridal.jpg', slug: 'conflict-piece' });

    expectErrorEnvelope(second, 409, 'CONFLICT');
    expect(String(second.body.message)).toContain('conflict-piece-2');
  });
});

describe('423 — account lockout', () => {
  it('locks the account after repeated failures and says so distinctly', async () => {
    await registerAdminAndGetToken(app);

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const failed = await request(app)
        .post('/api/auth/login')
        .send({ email: ADMIN_CREDENTIALS.email, password: 'wrong-password' });
      expect(failed.status).toBe(401);
      expectErrorEnvelope(failed, 401, 'UNAUTHENTICATED');
    }

    const locked = await request(app)
      .post('/api/auth/login')
      .send({ email: ADMIN_CREDENTIALS.email, password: ADMIN_CREDENTIALS.password });

    expectErrorEnvelope(locked, 423, 'ACCOUNT_LOCKED');
  });
});

describe('400 — uploads', () => {
  it('reports a disallowed file type as UPLOAD_INVALID, not as a generic 500', async () => {
    const token = await registerAdminAndGetToken(app);

    const res = await request(app)
      .post('/api/upload')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from('just some text'), {
        filename: 'notes.txt',
        contentType: 'text/plain',
      });

    expectErrorEnvelope(res, 400, 'UPLOAD_INVALID');
  });
});
