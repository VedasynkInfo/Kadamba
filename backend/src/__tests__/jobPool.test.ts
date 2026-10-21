import { describe, expect, it } from 'vitest';
import { JobPool, allJobPoolStats, bulkJobPool, exportJobPool, imageJobPool } from '../services/jobPool';

describe('JobPool', () => {
  it('runs a job and resolves with its result', async () => {
    const pool = new JobPool({ name: 'test-a', concurrency: 1 });
    const result = await pool.run('a', async () => 42);
    expect(result).toBe(42);
    expect(pool.stats().completed).toBe(1);
  });

  it('rejects when the job throws', async () => {
    const pool = new JobPool({ name: 'test-b', concurrency: 1 });
    await expect(
      pool.run('b', async () => {
        throw new Error('boom');
      }),
    ).rejects.toThrow('boom');
    expect(pool.stats().failed).toBe(1);
  });

  it('never runs more than `concurrency` jobs at once', async () => {
    const pool = new JobPool({ name: 'test-c', concurrency: 2 });
    let active = 0;
    let peak = 0;

    const job = async () => {
      active += 1;
      peak = Math.max(peak, active);
      await new Promise((resolve) => setTimeout(resolve, 20));
      active -= 1;
    };

    await Promise.all(Array.from({ length: 8 }, (_, i) => pool.run(`c-${i}`, job)));

    expect(peak).toBeLessThanOrEqual(2);
    expect(pool.stats().completed).toBe(8);
  });

  it('queues work that exceeds the concurrency limit and drains it', async () => {
    const pool = new JobPool({ name: 'test-d', concurrency: 1 });
    const order: number[] = [];

    const first = pool.run('d-0', async () => {
      order.push(0);
      await new Promise((resolve) => setTimeout(resolve, 30));
    });
    const second = pool.run('d-1', async () => {
      order.push(1);
    });

    expect(pool.stats().queued).toBe(1);
    await Promise.all([first, second]);
    expect(order).toEqual([0, 1]);
    expect(pool.stats().queued).toBe(0);
  });

  it('rejects new work when the backlog is full instead of growing without bound', async () => {
    const pool = new JobPool({ name: 'test-e', concurrency: 1, maxQueue: 1 });
    const slow = pool.run('e-0', async () => {
      await new Promise((resolve) => setTimeout(resolve, 40));
    });
    const queued = pool.run('e-1', async () => undefined);

    await expect(pool.run('e-2', async () => undefined)).rejects.toThrow(/busy/i);
    expect(pool.stats().rejected).toBe(1);

    await Promise.all([slow, queued]);
  });

  it('reports its queue depth', async () => {
    const pool = new JobPool({ name: 'test-f', concurrency: 1 });
    const running = pool.run('f-0', async () => {
      await new Promise((resolve) => setTimeout(resolve, 30));
    });
    expect(pool.stats().active).toBe(1);
    expect(pool.stats().name).toBe('test-f');
    await running;
    expect(pool.stats().active).toBe(0);
  });

  it('waits for the queue to drain', async () => {
    const pool = new JobPool({ name: 'test-g', concurrency: 2 });
    await Promise.all(
      Array.from({ length: 5 }, (_, i) =>
        pool.run(`g-${i}`, async () => {
          await new Promise((resolve) => setTimeout(resolve, 10));
        }),
      ),
    );
    const idle = await pool.waitForIdle(2_000);
    expect(idle).toBe(true);
    expect(pool.stats().queued).toBe(0);
    expect(pool.stats().active).toBe(0);
  });

  it('rejects an invalid concurrency', () => {
    expect(() => new JobPool({ name: 'bad', concurrency: 0 })).toThrow();
  });
});

describe('shared job pools', () => {
  it('exposes the image, export and bulk pools', () => {
    const stats = allJobPoolStats();
    expect(stats.map((s) => s.name)).toEqual(['images', 'exports', 'bulk']);
    expect(imageJobPool.concurrency).toBeGreaterThan(0);
    expect(exportJobPool.concurrency).toBeGreaterThan(0);
    expect(bulkJobPool.concurrency).toBeGreaterThan(0);
  });
});
