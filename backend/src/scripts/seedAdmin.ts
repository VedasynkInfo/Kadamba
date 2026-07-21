import { connectDB, disconnectDB } from '../config/database';
import { logger } from '../config/logger';
import { upsertAdminUser } from '../services/authService';

/**
 * One-off admin bootstrap. Reads credentials from the environment so no
 * secrets are passed on the command line or committed.
 *
 *   ADMIN_NAME="Studio Admin" \
 *   ADMIN_EMAIL="admin@kadambastudio.com" \
 *   ADMIN_PASSWORD="a-strong-password" \
 *   npm run seed:admin
 *
 * Safe to re-run: an existing account is promoted to admin and its password
 * reset to the supplied value.
 */
async function main() {
  const name = process.env.ADMIN_NAME?.trim();
  const email = process.env.ADMIN_EMAIL?.trim();
  const password = process.env.ADMIN_PASSWORD;

  if (!name || !email || !password) {
    throw new Error('ADMIN_NAME, ADMIN_EMAIL and ADMIN_PASSWORD must all be set');
  }
  if (password.length < 8) {
    throw new Error('ADMIN_PASSWORD must be at least 8 characters');
  }

  await connectDB();
  const { user, created } = await upsertAdminUser({ name, email, password });
  logger.info({ email: user.email, created }, created ? 'Admin created' : 'Admin updated');
  await disconnectDB();
}

main().catch((error) => {
  logger.error({ err: error }, 'seed:admin failed');
  process.exitCode = 1;
  void disconnectDB();
});
