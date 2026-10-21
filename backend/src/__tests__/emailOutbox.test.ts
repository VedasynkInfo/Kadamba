import mongoose from 'mongoose';
import { describe, expect, it, beforeEach } from 'vitest';
import { EmailOutbox } from '../models/EmailOutbox';
import {
  backoffDelayMs,
  drainEmailOutbox,
  enqueueEmail,
  getEmailOutboxStats,
} from '../services/emailOutboxService';

interface SentEmail {
  to: string;
  subject: string;
  html: string;
  text?: string;
  messageId?: string;
}

describe('EmailOutbox', () => {
  beforeEach(async () => {
    await EmailOutbox.deleteMany({});
  });

  it('queues an email instead of sending it inline', async () => {
    const result = await enqueueEmail({
      to: 'customer@example.com',
      subject: 'Hello',
      html: '<p>Hi</p>',
      text: 'Hi',
      kind: 'test',
    });

    expect(result.duplicate).toBe(false);
    const row = await EmailOutbox.findById(result.id);
    expect(row?.status).toBe('pending');
    expect(row?.attempts).toBe(0);
    expect(row?.to).toBe('customer@example.com');
  });

  it('de-duplicates repeated notifications with the same dedupe key', async () => {
    const first = await enqueueEmail({
      to: 'a@example.com',
      subject: 'One',
      html: '<p>1</p>',
      kind: 'test',
      dedupeKey: 'lead:123',
    });
    const second = await enqueueEmail({
      to: 'a@example.com',
      subject: 'One',
      html: '<p>1</p>',
      kind: 'test',
      dedupeKey: 'lead:123',
    });

    expect(second.duplicate).toBe(true);
    expect(second.id).toBe(first.id);
    expect(await EmailOutbox.countDocuments({ dedupeKey: 'lead:123' })).toBe(1);
  });

  it('drains due rows exactly once', async () => {
    const sent: SentEmail[] = [];
    await enqueueEmail({ to: 'a@example.com', subject: 'A', html: '<p>A</p>', kind: 'test' });
    await enqueueEmail({ to: 'b@example.com', subject: 'B', html: '<p>B</p>', kind: 'test' });

    const result = await drainEmailOutbox({
      send: async (email) => {
        sent.push(email);
      },
    });

    expect(result.claimed).toBe(2);
    expect(result.sent).toBe(2);
    expect(sent).toHaveLength(2);
    expect(await EmailOutbox.countDocuments({ status: 'sent' })).toBe(2);

    // A second drain has nothing left to do — no duplicate sends.
    const again = await drainEmailOutbox({
      send: async (email) => {
        sent.push(email);
      },
    });
    expect(again.claimed).toBe(0);
    expect(sent).toHaveLength(2);
  });

  it('retries a failed send with exponential backoff and then succeeds', async () => {
    await enqueueEmail({ to: 'a@example.com', subject: 'A', html: '<p>A</p>', kind: 'test' });

    let attempts = 0;
    const first = await drainEmailOutbox({
      now: Date.now(),
      send: async () => {
        attempts += 1;
        throw new Error('SMTP down');
      },
    });

    expect(first.retried).toBe(1);
    const row = await EmailOutbox.findOne({});
    expect(row?.status).toBe('pending');
    expect(row?.attempts).toBe(1);
    expect(row?.lastError).toContain('SMTP down');
    expect(row?.nextAttemptAt.getTime()).toBeGreaterThan(Date.now());

    // Not yet due — the drain must leave it alone.
    const early = await drainEmailOutbox({
      now: Date.now(),
      send: async () => {
        attempts += 1;
      },
    });
    expect(early.claimed).toBe(0);

    // Once the backoff window has passed, it goes out.
    const later = await drainEmailOutbox({
      now: Date.now() + 10 * 60_000,
      send: async () => {
        attempts += 1;
      },
    });
    expect(later.sent).toBe(1);
    expect(attempts).toBe(2);
  });

  it('gives up after the maximum number of attempts', async () => {
    await enqueueEmail({
      to: 'a@example.com',
      subject: 'A',
      html: '<p>A</p>',
      kind: 'test',
      maxAttempts: 2,
    });

    await drainEmailOutbox({ send: async () => { throw new Error('nope'); } });
    const result = await drainEmailOutbox({
      now: Date.now() + 10 * 60_000,
      send: async () => {
        throw new Error('nope');
      },
    });

    expect(result.failed).toBe(1);
    const row = await EmailOutbox.findOne({});
    expect(row?.status).toBe('failed');
    expect(row?.attempts).toBe(2);
  });

  it('recovers a row abandoned by a killed process once its lease expires', async () => {
    const queued = await enqueueEmail({
      to: 'a@example.com',
      subject: 'A',
      html: '<p>A</p>',
      kind: 'test',
    });

    // Simulate a crash after the row was claimed but before the result was
    // recorded: status "sending" with an old lease.
    await EmailOutbox.updateOne(
      { _id: queued.id },
      {
        $set: {
          status: 'sending',
          lockedAt: new Date(Date.now() - 60 * 60_000),
          lockToken: 'stale-token',
        },
        $inc: { attempts: 1 },
      },
    );

    const sent: SentEmail[] = [];
    const result = await drainEmailOutbox({
      send: async (email) => {
        sent.push(email);
      },
    });

    expect(result.sent).toBe(1);
    expect(sent).toHaveLength(1);
    const row = await EmailOutbox.findOne({});
    expect(row?.status).toBe('sent');
  });

  it('does not hand the same row to two concurrent drains', async () => {
    await enqueueEmail({ to: 'a@example.com', subject: 'A', html: '<p>A</p>', kind: 'test' });
    await enqueueEmail({ to: 'b@example.com', subject: 'B', html: '<p>B</p>', kind: 'test' });

    const sent: SentEmail[] = [];
    const send = async (email: SentEmail) => {
      sent.push(email);
      await new Promise((resolve) => setTimeout(resolve, 20));
    };

    await Promise.all([drainEmailOutbox({ send }), drainEmailOutbox({ send })]);

    expect(sent).toHaveLength(2);
    expect(new Set(sent.map((e) => e.to)).size).toBe(2);
  });

  it('sends a stable Message-ID so receivers can collapse a retry', async () => {
    const queued = await enqueueEmail({
      to: 'a@example.com',
      subject: 'A',
      html: '<p>A</p>',
      kind: 'test',
    });

    const sent: SentEmail[] = [];
    await drainEmailOutbox({ send: async (email) => { sent.push(email); } });
    expect(sent[0].messageId).toContain(queued.id);
  });

  it('reports queue depth', async () => {
    await enqueueEmail({ to: 'a@example.com', subject: 'A', html: '<p>A</p>', kind: 'test' });
    const stats = await getEmailOutboxStats();
    expect(stats.pending).toBe(1);
    expect(stats.due).toBe(1);
    expect(stats.sent).toBe(0);
  });

  it('computes a capped exponential backoff', () => {
    const base = 1000;
    expect(backoffDelayMs(1, base, 60_000)).toBeGreaterThanOrEqual(base);
    expect(backoffDelayMs(2, base, 60_000)).toBeGreaterThan(backoffDelayMs(1, base, 60_000));
    expect(backoffDelayMs(20, base, 60_000)).toBeLessThanOrEqual(60_000 * 1.2);
  });

  it('rejects an email with no recipient', async () => {
    await expect(
      enqueueEmail({ to: '', subject: 'A', html: '<p>A</p>', kind: 'test' }),
    ).rejects.toThrow();
  });

  it('stores the queued email in Mongo so a restart cannot lose it', async () => {
    await enqueueEmail({ to: 'a@example.com', subject: 'A', html: '<p>A</p>', kind: 'test' });
    // A "restart" is a fresh query against the same database.
    const survived = await EmailOutbox.find({ kind: 'test' });
    expect(survived).toHaveLength(1);
    expect(survived[0].status).toBe('pending');
    expect(mongoose.connection.readyState).toBe(1);
  });
});
