/**
 * Take a database backup on demand.
 *
 * The same code path the nightly cron job uses, so an operator can produce
 * an archive at any time without waiting for the schedule. Point `BACKUP_DIR`
 * at the Persistent Disk in production.
 *
 * Usage:
 *   npm run data:backup
 *   BACKUP_DIR=/var/data/backups npm run data:backup
 */
import { connectDB, disconnectDB } from '../config/database';
import { backupDir, runBackup } from '../services/backupService';

async function main(): Promise<void> {
  console.log('Connecting to MongoDB...');
  await connectDB();

  console.log(`Writing a backup to ${backupDir()}...`);
  const result = await runBackup();

  if (!result.ok) {
    console.error('✖ Backup failed:', result.error);
    await disconnectDB().catch(() => undefined);
    process.exit(1);
  }

  console.log(`✔ Backup written: ${result.file}`);
  console.log(`  collections: ${result.collections.length}`);
  console.log(`  documents:   ${result.documents}`);
  console.log(`  size:        ${result.bytes} bytes`);
  if (result.skipped.length) {
    console.log(`  skipped:     ${result.skipped.join(', ')}`);
  }
  if (result.pruned.length) {
    console.log(`  pruned:      ${result.pruned.join(', ')}`);
  }

  await disconnectDB();
  process.exit(0);
}

main().catch(async (error) => {
  console.error('✖ data:backup failed:', error);
  await disconnectDB().catch(() => undefined);
  process.exit(1);
});
