import mongoose from 'mongoose';
import { logger } from '../config/logger';

/**
 * Run `work` inside a MongoDB multi-document transaction when the connected
 * deployment supports it (replica set / Atlas M10+), and fall back to a plain
 * execution otherwise (standalone local `mongod`, free Atlas M0).
 *
 * Why a helper instead of `session.withTransaction` everywhere:
 *  - local dev and the free Atlas tier do NOT support transactions and throw
 *    `Transaction numbers are only allowed on a replica set member or mongos`.
 *  - we still want a single code path that is fully atomic in production.
 *
 * IMPORTANT: the fallback is NOT atomic. It exists so development and the free
 * tier keep working. Production must run on a replica set (Atlas M10+).
 */

let transactionSupport: boolean | null = null;

/** Detect (once) whether the connected deployment supports transactions. */
export async function supportsTransactions(): Promise<boolean> {
  if (transactionSupport !== null) return transactionSupport;

  try {
    const admin = mongoose.connection.db?.admin();
    if (!admin) {
      transactionSupport = false;
      return false;
    }
    const info = await admin.command({ hello: 1 });
    transactionSupport = Boolean(info.setName) || info.msg === 'isdbgrid';
  } catch {
    transactionSupport = false;
  }

  if (!transactionSupport) {
    logger.warn(
      'MongoDB deployment does not support transactions — money operations will run without atomicity. ' +
        'Use a replica set (Atlas M10+) in production.',
    );
  }
  return transactionSupport;
}

/** Test hook — reset the cached capability probe. */
export function resetTransactionSupportCache() {
  transactionSupport = null;
}

/**
 * Execute `work` atomically when possible.
 *
 * The callback receives the active `ClientSession` (or `undefined` in the
 * non-transactional fallback) so callers can pass `{ session }` to queries.
 */
export async function withTransaction<T>(
  work: (session: mongoose.ClientSession | undefined) => Promise<T>,
): Promise<T> {
  if (!(await supportsTransactions())) {
    return work(undefined);
  }

  const session = await mongoose.startSession();
  try {
    let result!: T;
    await session.withTransaction(async () => {
      result = await work(session);
    });
    return result;
  } finally {
    await session.endSession();
  }
}
