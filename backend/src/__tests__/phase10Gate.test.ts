import { describe, expect, it, beforeEach } from 'vitest';
import { EmailOutbox } from '../models/EmailOutbox';
import { CronLock } from '../models/CronLock';
import { drainEmailOutbox, enqueueEmail } from '../services/emailOutboxService';
import { lastCronRunAt, runWithCronLock } from '../services/cronLockService';
import { CRON_JOBS, isJobDue } from '../services/cronService';

/**
 * The Phase 10 gate:
 *   - kill the process mid-queue → every email eventually sends exactly once;
 *   - cron de-dupes via the lock;
 *   - login counts survive a redeploy.
 *
 * These tests simulate a process death by abandoning rows in the database
 * exactly the way a `kill -9` would leave them, then restart and let the
 * scheduler recover them.
 */
describe('Phase 10 gate: kill the process mid-queue', () => {
  beforeEach(async () => {
    await EmailOutbox.deleteMany({});
    await CronLock.deleteMany({});
  });

  it('delivers every queued email exactly once after a mid-queue kill', async () => {
    // 1. The studio triggers ten notifications.
    for (let i = 0; i < 10; i += 1) {
      await enqueueEmail({
        to: `customer${i}@example.com`,
        subject: `Enquiry ${i}`,
        html: `<p>Enquiry ${i}</p>`,
        kind: 'test',
        dedupeKey: `enquiry:${i}`,
      });
    }

    // 2. The process starts draining, sends three, then is killed.
    const sentBeforeCrash: string[] = [];
    await drainEmailOutbox({
      limit: 3,
      send: async (email) => {
        sentBeforeCrash.push(email.to);
      },
    });
    expect(sentBeforeCrash).toHaveLength(3);

    // 3. Restart: the drainer picks up where the dead process left off.
    const sentAfterRestart: string[] = [];
    const result = await drainEmailOutbox({
      send: async (email) => {
        sentAfterRestart.push(email.to);
      },
    });

    expect(result.sent).toBe(7);

    // 4. Every email went out, and no email went out twice.
    const allSent = [...sentBeforeCrash, ...sentAfterRestart];
    expect(allSent).toHaveLength(10);
    expect(new Set(allSent).size).toBe(10);

    // 5. And the queue is empty.
    expect(await EmailOutbox.countDocuments({ status: 'pending' })).toBe(0);
    expect(await EmailOutbox.countDocuments({ status: 'sent' })).toBe(10);
  });

  it('recovers rows that were claimed but never completed', async () => {
    await enqueueEmail({
      to: 'a@example.com',
      subject: 'A',
      html: '<p>A</p>',
      kind: 'test',
      dedupeKey: 'enquiry:a',
    });
    await enqueueEmail({
      to: 'b@example.com',
      subject: 'B',
      html: '<p>B</p>',
      kind: 'test',
      dedupeKey: 'enquiry:b',
    });

    // The dead process claimed one row and died before recording the result.
    const claimed = await EmailOutbox.findOne({ to: 'a@example.com' });
    await EmailOutbox.updateOne(
      { _id: claimed!._id },
      {
        $set: {
          status: 'sending',
          lockedAt: new Date(Date.now() - 10 * 60_000),
          lockToken: 'token-of-the-dead-process',
        },
        $inc: { attempts: 1 },
      },
    );

    const sent: string[] = [];
    const result = await drainEmailOutbox({
      send: async (email) => {
        sent.push(email.to);
      },
    });

    expect(result.sent).toBe(2);
    expect(new Set(sent).size).toBe(2);
  });

  it('does not re-send an email that was already delivered', async () => {
    await enqueueEmail({
      to: 'a@example.com',
      subject: 'A',
      html: '<p>A</p>',
      kind: 'test',
      dedupeKey: 'enquiry:a',
    });

    const first: string[] = [];
    await drainEmailOutbox({
      send: async (email) => {
        first.push(email.to);
      },
    });

    // Several more scheduler ticks after the delivery.
    const second: string[] = [];
    for (let i = 0; i < 3; i += 1) {
      await drainEmailOutbox({
        send: async (email) => {
          second.push(email.to);
        },
      });
    }

    expect(first).toHaveLength(1);
    expect(second).toHaveLength(0);
  });

  it('de-duplicates a cron job across two instances', async () => {
    let runs = 0;

    const job = async () => {
      runs += 1;
      await new Promise((resolve) => setTimeout(resolve, 30));
    };

    await Promise.all([
      runWithCronLock('nightly-backup', 60_000, job),
      runWithCronLock('nightly-backup', 60_000, job),
    ]);

    expect(runs).toBe(1);
  });

  it('lets a second instance run the job once the first one finished', async () => {
    let runs = 0;
    const job = async () => {
      runs += 1;
    };

    await runWithCronLock('lead-followups', 60_000, job);
    await runWithCronLock('lead-followups', 60_000, job);

    // The lock is released after each run, but the two runs are separate
    // windows — the guarantee is "one run per window", enforced by the
    // scheduler's own interval, not by the lock.
    expect(runs).toBe(2);
  });

  it('does not run the daily job a second time on another instance', async () => {
    const job = CRON_JOBS.find((j) => j.name === 'nightly-backup')!;

    // Instance A runs the nightly backup.
    await runWithCronLock('nightly-backup', 60_000, async () => 'ok');

    // Instance B consults the shared record and finds the job already done
    // for today, so it does not start a second backup.
    const lastRunAt = await lastCronRunAt('nightly-backup');
    const laterToday = new Date();
    laterToday.setHours(12, 0, 0, 0);
    expect(isJobDue(job, laterToday.getTime(), lastRunAt)).toBe(false);

    // Tomorrow it is due again.
    const tomorrow = laterToday.getTime() + 24 * 60 * 60 * 1000;
    expect(isJobDue(job, tomorrow, lastRunAt)).toBe(true);
  });
});
