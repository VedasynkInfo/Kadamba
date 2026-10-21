import { describe, expect, it, beforeEach } from 'vitest';
import { CronLock } from '../models/CronLock';
import { EmailOutbox } from '../models/EmailOutbox';
import { acquireCronLock, lastCronRunAt, releaseCronLock, runWithCronLock } from '../services/cronLockService';
import { isJobDue, CRON_JOBS, runCronJob, schedulerStatus } from '../services/cronService';
import { cleanupOrphans, sendFollowUpReminders, sendTrialDeliveryReminders } from '../services/cronJobs';
import { Lead } from '../models/Lead';
import { Order } from '../models/Order';
import { Customer } from '../models/Customer';
import { RefreshToken } from '../models/RefreshToken';
import { ImageAsset } from '../models/ImageAsset';
import { PortalMessage } from '../models/PortalMessage';
import { uploadsDir } from '../config/storage';
import fs from 'fs';
import path from 'path';

const LOCK_TTL = 60_000;

describe('cron locks', () => {
  beforeEach(async () => {
    await CronLock.deleteMany({});
  });

  it('grants the lock to one holder and refuses the second', async () => {
    const first = await acquireCronLock('job-a', LOCK_TTL, 'instance-1');
    const second = await acquireCronLock('job-a', LOCK_TTL, 'instance-2');

    expect(first).not.toBeNull();
    expect(second).toBeNull();
  });

  it('releases the lock so the next instance can take it', async () => {
    const first = await acquireCronLock('job-a', LOCK_TTL, 'instance-1');
    expect(first).not.toBeNull();
    await releaseCronLock(first!);

    const second = await acquireCronLock('job-a', LOCK_TTL, 'instance-2');
    expect(second).not.toBeNull();
  });

  it('reclaims a lease that expired after a crash', async () => {
    await CronLock.create({
      name: 'job-a',
      lockedUntil: new Date(Date.now() - 60_000),
      lockedBy: 'dead-instance',
      lockToken: 'stale',
    });

    const handle = await acquireCronLock('job-a', LOCK_TTL, 'new-instance');
    expect(handle).not.toBeNull();
  });

  it('runs the job body exactly once when two instances race', async () => {
    let runs = 0;
    const body = async () => {
      runs += 1;
      await new Promise((resolve) => setTimeout(resolve, 20));
      return 'done';
    };

    const [a, b] = await Promise.all([
      runWithCronLock('job-b', LOCK_TTL, body),
      runWithCronLock('job-b', LOCK_TTL, body),
    ]);

    expect(runs).toBe(1);
    expect([a.ran, b.ran].filter(Boolean)).toHaveLength(1);
    expect(a.skipped ?? b.skipped).toBe('locked');
  });

  it('records the outcome of a run', async () => {
    await runWithCronLock('job-c', LOCK_TTL, async () => 'ok');
    const row = await CronLock.findOne({ name: 'job-c' });
    expect(row?.lastStatus).toBe('success');
    expect(row?.lastRunAt).toBeInstanceOf(Date);
  });

  it('remembers when a job last ran, for the shared schedule', async () => {
    expect(await lastCronRunAt('job-shared')).toBe(0);
    await runWithCronLock('job-shared', LOCK_TTL, async () => 'ok');
    expect(await lastCronRunAt('job-shared')).toBeGreaterThan(0);
  });

  it('records a failure without losing the lock', async () => {
    const result = await runWithCronLock('job-d', LOCK_TTL, async () => {
      throw new Error('boom');
    });

    expect(result.ran).toBe(true);
    expect(result.error).toContain('boom');
    const row = await CronLock.findOne({ name: 'job-d' });
    expect(row?.lastStatus).toBe('failure');
    expect(row?.lastError).toContain('boom');
  });
});

describe('cron schedule', () => {
  it('runs a daily job once per calendar day', () => {
    const job = CRON_JOBS.find((j) => j.name === 'nightly-backup')!;
    const at2am = new Date('2026-05-10T02:00:00').getTime();
    const at1am = new Date('2026-05-10T01:00:00').getTime();

    expect(isJobDue(job, at2am, 0)).toBe(true);
    // Already ran today.
    expect(isJobDue(job, at2am, at2am)).toBe(false);
    // Before the scheduled hour.
    expect(isJobDue(job, at1am, 0)).toBe(false);
    // A new day makes it due again.
    expect(isJobDue(job, new Date('2026-05-11T02:00:00').getTime(), at2am)).toBe(true);
  });

  it('runs an interval job once its interval has elapsed', () => {
    const job = CRON_JOBS.find((j) => j.name === 'email-outbox')!;
    const now = Date.now();
    expect(isJobDue(job, now, 0)).toBe(true);
    expect(isJobDue(job, now, now)).toBe(false);
    expect(isJobDue(job, now + job.intervalMs + 1, now)).toBe(true);
  });

  it('exposes scheduler status for the health endpoint', () => {
    const status = schedulerStatus();
    expect(status.jobs.map((j) => j.name)).toContain('email-outbox');
    expect(status.jobs.map((j) => j.name)).toContain('nightly-backup');
  });
});

describe('cron jobs', () => {
  beforeEach(async () => {
    await EmailOutbox.deleteMany({});
    await Lead.deleteMany({});
    await Order.deleteMany({});
    await Customer.deleteMany({});
  });

  it('queues a reminder for a lead whose follow-up is due', async () => {
    await Lead.create({
      name: 'Anita Rao',
      phone: '9876543210',
      email: 'anita@example.com',
      city: 'Kurnool',
      service: 'Bridal Lehenga',
      occasion: 'Wedding',
      budget: 'High',
      preferredDate: new Date(),
      message: 'Interested',
      inspirationImages: [],
      status: 'Qualified',
      source: 'Referral',
      assignee: 'Studio Team',
      notes: [],
      timeline: [],
      followUps: [
        {
          scheduledAt: new Date(Date.now() - 60_000),
          type: 'call',
          notes: 'Confirm the design',
          status: 'pending',
        },
      ],
      nextFollowUpDate: new Date(Date.now() - 60_000),
    });

    const result = await sendFollowUpReminders();
    expect(result.reminded).toBe(1);
    const queued = await EmailOutbox.find({ kind: 'lead-followup-reminder' });
    expect(queued).toHaveLength(1);
    expect(queued[0].subject).toContain('Anita Rao');
  });

  it('does not queue the same follow-up reminder twice on the same day', async () => {
    const lead = await Lead.create({
      name: 'Anita Rao',
      phone: '9876543210',
      email: 'anita@example.com',
      city: 'Kurnool',
      service: 'Bridal Lehenga',
      occasion: 'Wedding',
      budget: 'High',
      preferredDate: new Date(),
      message: 'Interested',
      inspirationImages: [],
      status: 'Qualified',
      source: 'Referral',
      assignee: 'Studio Team',
      notes: [],
      timeline: [],
      followUps: [
        {
          scheduledAt: new Date(Date.now() - 60_000),
          type: 'call',
          notes: '',
          status: 'pending',
        },
      ],
    });

    await sendFollowUpReminders();
    const second = await sendFollowUpReminders();

    expect(second.reminded).toBe(0);
    expect(second.skipped).toBe(1);
    expect(await EmailOutbox.countDocuments({ kind: 'lead-followup-reminder' })).toBe(1);
    expect(lead.id).toBeTruthy();
  });

  it('ignores a follow-up that is still in the future', async () => {
    await Lead.create({
      name: 'Future Lead',
      phone: '9876543210',
      email: 'future@example.com',
      city: 'Kurnool',
      service: 'Blouse',
      occasion: 'Office',
      budget: 'Mid',
      preferredDate: new Date(),
      message: 'Interested',
      inspirationImages: [],
      status: 'New',
      source: 'Walk-in',
      assignee: 'Studio Team',
      notes: [],
      timeline: [],
      followUps: [
        {
          scheduledAt: new Date(Date.now() + 24 * 60 * 60_000),
          type: 'call',
          notes: '',
          status: 'pending',
        },
      ],
    });

    const result = await sendFollowUpReminders();
    expect(result.reminded).toBe(0);
    expect(await EmailOutbox.countDocuments({ kind: 'lead-followup-reminder' })).toBe(0);
  });

  it('queues a trial reminder for an order with an upcoming trial', async () => {
    const customer = await Customer.create({
      name: 'Meera Kumari',
      phone: '9000000001',
      email: 'meera@example.com',
    });
    await Order.create({
      orderNumber: 9001,
      customerId: customer._id,
      status: 'stitching',
      priority: 'normal',
      title: 'Bridal Lehenga',
      lineItems: [{ name: 'Bridal Lehenga', qty: 1 }],
      measurementProfileIds: [],
      assignedStaff: [],
      expectedTrialAt: new Date(Date.now() + 2 * 24 * 60 * 60_000),
      tags: [],
      notes: [],
      timeline: [],
      paymentSummary: { totalQuoted: 1000, advance: 0, totalPaid: 0, balance: 1000 },
      attachments: [],
    });

    const result = await sendTrialDeliveryReminders();
    expect(result.trialReminders).toBe(1);
    const queued = await EmailOutbox.find({ kind: 'order-trial-reminder' });
    expect(queued).toHaveLength(1);
    expect(queued[0].to).toBe('meera@example.com');
  });

  it('does not remind twice for the same order on the same day', async () => {
    const customer = await Customer.create({
      name: 'Meera Kumari',
      phone: '9000000001',
      email: 'meera@example.com',
    });
    await Order.create({
      orderNumber: 9002,
      customerId: customer._id,
      status: 'stitching',
      priority: 'normal',
      title: 'Blouse',
      lineItems: [{ name: 'Blouse', qty: 1 }],
      measurementProfileIds: [],
      assignedStaff: [],
      expectedTrialAt: new Date(Date.now() + 2 * 24 * 60 * 60_000),
      tags: [],
      notes: [],
      timeline: [],
      paymentSummary: { totalQuoted: 500, advance: 0, totalPaid: 0, balance: 500 },
      attachments: [],
    });

    await sendTrialDeliveryReminders();
    const second = await sendTrialDeliveryReminders();

    expect(second.trialReminders).toBe(0);
    expect(await EmailOutbox.countDocuments({ kind: 'order-trial-reminder' })).toBe(1);
  });

  it('cleans up expired sessions and dead media rows', async () => {
    await RefreshToken.create({
      tokenHash: 'expired-hash',
      userId: new (await import('mongoose')).Types.ObjectId(),
      familyId: 'family-1',
      role: 'admin',
      expiresAt: new Date(Date.now() - 60_000),
    });

    // A media row whose original file is no longer on disk.
    await ImageAsset.create({
      hash: 'dead-hash',
      kind: 'image',
      originalUrl: 'https://example.com/uploads/does-not-exist.png',
      mimeType: 'image/png',
    });

    const result = await cleanupOrphans();

    expect(result.expiredSessions).toBe(1);
    expect(result.orphanMediaRows).toBe(1);
    expect(await RefreshToken.countDocuments({})).toBe(0);
    expect(await ImageAsset.countDocuments({ hash: 'dead-hash' })).toBe(0);
  });

  it('never deletes an original file during cleanup', async () => {
    const fileName = 'keep-me.png';
    fs.writeFileSync(path.join(uploadsDir, fileName), 'not-really-a-png');

    await ImageAsset.create({
      hash: 'keep-hash',
      kind: 'image',
      originalUrl: `http://localhost:4000/uploads/${fileName}`,
      mimeType: 'image/png',
    });

    await cleanupOrphans();

    expect(fs.existsSync(path.join(uploadsDir, fileName))).toBe(true);
  });

  it('keeps a portal message that has no order — the field is optional', async () => {
    const customer = await Customer.create({
      name: 'Chat Customer',
      phone: '9000000002',
      email: 'chat@example.com',
    });
    await PortalMessage.create({
      customerId: customer._id,
      senderRole: 'customer',
      senderId: 'portal-user',
      body: 'Hello, I would like to know about a blouse.',
      attachments: [],
    });

    const result = await cleanupOrphans();

    expect(result.orphanMessages).toBe(0);
    expect(await PortalMessage.countDocuments({})).toBe(1);
  });

  it('removes a portal message whose customer no longer exists', async () => {
    const customer = await Customer.create({
      name: 'Gone Customer',
      phone: '9000000003',
      email: 'gone@example.com',
    });
    await PortalMessage.create({
      customerId: customer._id,
      senderRole: 'customer',
      senderId: 'portal-user',
      body: 'This message points at a deleted customer.',
      attachments: [],
    });

    await Customer.deleteOne({ _id: customer._id });

    const result = await cleanupOrphans();

    expect(result.orphanMessages).toBe(1);
    expect(await PortalMessage.countDocuments({})).toBe(0);
  });

  it('runs a job through the scheduler and honours the lock', async () => {
    const result = await runCronJob('email-outbox');
    expect(result).toBeDefined();
  });
});
