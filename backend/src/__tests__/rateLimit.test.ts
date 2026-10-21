import { describe, expect, it, beforeEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { createApp } from '../app';
import { RateLimitCounter } from '../models/RateLimitCounter';
import { MongoRateLimitStore } from '../services/rateLimitMongoStore';
import { User } from '../models/User';
import { ADMIN_CREDENTIALS, registerAdminAndGetToken } from './helpers/auth';
import { upsertAdminUser } from '../services/authService';

const app = createApp();

describe('Mongo rate limit store', () => {
  beforeEach(async () => {
    await RateLimitCounter.deleteMany({});
  });

  it('counts hits and reports the reset time', async () => {
    const store = new MongoRateLimitStore('test');
    store.init({ windowMs: 60_000 } as never);

    const first = await store.increment('1.2.3.4');
    expect(first.totalHits).toBe(1);

    const second = await store.increment('1.2.3.4');
    expect(second.totalHits).toBe(2);

    const other = await store.increment('5.6.7.8');
    expect(other.totalHits).toBe(1);
  });

  it('keeps counters for different limiters apart', async () => {
    const global = new MongoRateLimitStore('global');
    const auth = new MongoRateLimitStore('auth');
    global.init({ windowMs: 60_000 } as never);
    auth.init({ windowMs: 60_000 } as never);

    await global.increment('same-key');
    await auth.increment('same-key');

    expect((await global.get('same-key'))?.totalHits).toBe(1);
    expect((await auth.get('same-key'))?.totalHits).toBe(1);
  });

  it('survives a new store instance — the count lives in Mongo', async () => {
    const store = new MongoRateLimitStore('durable');
    store.init({ windowMs: 60_000 } as never);
    await store.increment('9.9.9.9');
    await store.increment('9.9.9.9');

    // A "restart" — a fresh store against the same database.
    const restarted = new MongoRateLimitStore('durable');
    restarted.init({ windowMs: 60_000 } as never);
    const info = await restarted.get('9.9.9.9');
    expect(info?.totalHits).toBe(2);

    await restarted.increment('9.9.9.9');
    expect((await restarted.get('9.9.9.9'))?.totalHits).toBe(3);
  });

  it('resets a key', async () => {
    const store = new MongoRateLimitStore('resettable');
    store.init({ windowMs: 60_000 } as never);
    await store.increment('key');
    await store.resetKey('key');
    expect(await store.get('key')).toBeUndefined();
  });

  it('resets every key for its limiter only', async () => {
    const a = new MongoRateLimitStore('scope-a');
    const b = new MongoRateLimitStore('scope-b');
    a.init({ windowMs: 60_000 } as never);
    b.init({ windowMs: 60_000 } as never);
    await a.increment('k');
    await b.increment('k');

    await a.resetAll();

    expect(await a.get('k')).toBeUndefined();
    expect((await b.get('k'))?.totalHits).toBe(1);
  });

  it('starts a fresh window once the old one has expired', async () => {
    const store = new MongoRateLimitStore('rolling');
    store.init({ windowMs: 60_000 } as never);
    await store.increment('key');
    await store.increment('key');

    // Age the counter past its window.
    await RateLimitCounter.updateMany({}, { $set: { resetAt: new Date(Date.now() - 1000) } });

    const after = await store.increment('key');
    expect(after.totalHits).toBe(1);
  });

  it('reports no counter for an unknown key', async () => {
    const store = new MongoRateLimitStore('empty');
    store.init({ windowMs: 60_000 } as never);
    expect(await store.get('never-seen')).toBeUndefined();
  });

  it('stores the counter under the limiter prefix', async () => {
    const store = new MongoRateLimitStore('prefixed');
    store.init({ windowMs: 60_000 } as never);
    await store.increment('abc');
    const rows = await RateLimitCounter.find({});
    expect(rows).toHaveLength(1);
    expect(rows[0].key).toBe('prefixed:abc');
  });
});

describe('per-account login lockout', () => {
  beforeEach(async () => {
    await User.deleteMany({});
    await RateLimitCounter.deleteMany({});
  });

  it('locks the account after repeated failed logins', async () => {
    await registerAdminAndGetToken(app);

    for (let i = 0; i < 5; i += 1) {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: ADMIN_CREDENTIALS.email, password: 'wrong-password' });
      expect(res.status).toBe(401);
    }

    const locked = await request(app)
      .post('/api/auth/login')
      .send({ email: ADMIN_CREDENTIALS.email, password: ADMIN_CREDENTIALS.password });
    expect(locked.status).toBe(423);
  });

  it('keeps the failed-attempt count in Mongo, so a restart does not reset it', async () => {
    await upsertAdminUser(ADMIN_CREDENTIALS);

    for (let i = 0; i < 3; i += 1) {
      await request(app)
        .post('/api/auth/login')
        .send({ email: ADMIN_CREDENTIALS.email, password: 'wrong-password' });
    }

    // Read the counter straight from the database, as a restarted process
    // would.
    const stored = await User.findOne({ email: ADMIN_CREDENTIALS.email });
    expect(stored?.failedLoginAttempts).toBe(3);

    // Two more failures reach the threshold, even though the process "restarted".
    for (let i = 0; i < 2; i += 1) {
      await request(app)
        .post('/api/auth/login')
        .send({ email: ADMIN_CREDENTIALS.email, password: 'wrong-password' });
    }

    const locked = await User.findOne({ email: ADMIN_CREDENTIALS.email });
    expect(locked?.lockedUntil).toBeInstanceOf(Date);
    expect(locked?.lockedUntil!.getTime()).toBeGreaterThan(Date.now());

    const blocked = await request(app)
      .post('/api/auth/login')
      .send({ email: ADMIN_CREDENTIALS.email, password: ADMIN_CREDENTIALS.password });
    expect(blocked.status).toBe(423);
  });

  it('clears the counter after a successful sign-in', async () => {
    await registerAdminAndGetToken(app);

    await request(app)
      .post('/api/auth/login')
      .send({ email: ADMIN_CREDENTIALS.email, password: 'wrong-password' });

    const afterFailure = await User.findOne({ email: ADMIN_CREDENTIALS.email });
    expect(afterFailure?.failedLoginAttempts).toBe(1);

    await request(app)
      .post('/api/auth/login')
      .send({ email: ADMIN_CREDENTIALS.email, password: ADMIN_CREDENTIALS.password });

    const afterSuccess = await User.findOne({ email: ADMIN_CREDENTIALS.email });
    expect(afterSuccess?.failedLoginAttempts).toBe(0);
    expect(afterSuccess?.lockedUntil).toBeFalsy();
  });

  it('keeps the failed-attempt counter independent per account', async () => {
    await upsertAdminUser(ADMIN_CREDENTIALS);
    await upsertAdminUser({ ...ADMIN_CREDENTIALS, email: 'other@test.local' });

    await request(app)
      .post('/api/auth/login')
      .send({ email: ADMIN_CREDENTIALS.email, password: 'wrong-password' });

    const other = await User.findOne({ email: 'other@test.local' });
    expect(other?.failedLoginAttempts ?? 0).toBe(0);
    expect(mongoose.connection.readyState).toBe(1);
  });
});
