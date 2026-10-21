import fs from 'fs';
import os from 'os';
import path from 'path';
import zlib from 'zlib';
import { describe, expect, it, beforeEach } from 'vitest';
import { backupDir, pruneOldBackups, runBackup } from '../services/backupService';
import { Lead } from '../models/Lead';

describe('nightly backup', () => {
  let dir: string;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'kadamba-backup-'));
    process.env.BACKUP_DIR = dir;
    fs.mkdirSync(dir, { recursive: true });
  });

  it('writes a gzipped archive of the collections', async () => {
    await Lead.create({
      name: 'Backup Lead',
      phone: '9000000007',
      email: 'backup@example.com',
      city: 'Kurnool',
      service: 'Saree',
      occasion: 'Wedding',
      budget: 'Mid',
      preferredDate: new Date(),
      message: 'This record must survive a backup.',
      inspirationImages: [],
      status: 'New',
      source: 'WhatsApp',
      assignee: 'Studio Team',
      notes: [],
      timeline: [],
      followUps: [],
    });

    const result = await runBackup();

    expect(result.ok).toBe(true);
    expect(result.bytes).toBeGreaterThan(0);
    expect(result.documents).toBeGreaterThan(0);
    expect(fs.existsSync(result.file)).toBe(true);

    const raw = zlib.gunzipSync(fs.readFileSync(result.file)).toString('utf8');
    const lines = raw.trim().split('\n');
    const manifest = JSON.parse(lines[0]);
    expect(manifest.type).toBe('manifest');
    expect(manifest.createdAt).toBeTruthy();

    const leadLine = lines.find((line) => line.includes('Backup Lead'));
    expect(leadLine).toBeTruthy();
    const parsed = JSON.parse(leadLine!);
    expect(parsed.name).toBe('Backup Lead');
  });

  it('prunes archives older than the retention window', async () => {
    const old = path.join(dir, 'kadamba-backup-old.jsonl.gz');
    fs.writeFileSync(old, 'old');
    const oldTime = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    fs.utimesSync(old, oldTime, oldTime);

    const fresh = path.join(dir, 'kadamba-backup-fresh.jsonl.gz');
    fs.writeFileSync(fresh, 'fresh');

    const removed = await pruneOldBackups(14);

    expect(removed).toContain('kadamba-backup-old.jsonl.gz');
    expect(fs.existsSync(old)).toBe(false);
    expect(fs.existsSync(fresh)).toBe(true);
  });

  it('never touches files that are not its own archives', async () => {
    const other = path.join(dir, 'notes.txt');
    fs.writeFileSync(other, 'keep me');

    await pruneOldBackups(0);

    expect(fs.existsSync(other)).toBe(true);
  });

  it('resolves the backup directory from the environment', () => {
    expect(backupDir()).toBe(path.resolve(dir));
  });
});
