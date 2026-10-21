import fs from 'fs';
import os from 'os';
import path from 'path';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { clearCache } from '../../services/cacheService';
import { ensurePhase10Indexes } from '../../services/phase10Bootstrap';

// Ensure a test environment before any app module reads config.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret_min_32_chars_1234567890';

/**
 * Point uploads at a throwaway directory.
 *
 * This must be set here (not in a test file) because ESM imports are evaluated
 * before a test module's body runs, so `config/storage.ts` would otherwise
 * resolve to the repository's real `uploads/` folder — and a test would write
 * files among the owner's production images.
 */
const testUploadsDir = path.join(os.tmpdir(), `kadamba-test-uploads-${process.pid}`);
process.env.UPLOAD_DIR = testUploadsDir;

let mongo: MongoMemoryServer;

beforeAll(async () => {
  // A clean tree, including the `optimized/` subtree the server expects —
  // `createApp()` creates it at import time, which happens *before* this hook.
  fs.rmSync(testUploadsDir, { recursive: true, force: true });
  fs.mkdirSync(path.join(testUploadsDir, 'optimized'), { recursive: true });
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
  // The Phase 10 unique indexes back notification de-duplication and the cron
  // lease, so they must exist before any test relies on them.
  await ensurePhase10Indexes();
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key of Object.keys(collections)) {
    await collections[key].deleteMany({});
  }
  // The rows are gone, so the cached reads of them must go too. Wiping the
  // collections directly bypasses the model hooks that normally invalidate.
  clearCache();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongo?.stop();
  fs.rmSync(testUploadsDir, { recursive: true, force: true });
});
