import fs from 'fs';
import path from 'path';
import { logger } from '../config/logger';
import { Customer } from '../models/Customer';
import { ImageAsset } from '../models/ImageAsset';
import { Lead } from '../models/Lead';
import { Order } from '../models/Order';
import { PortalMessage } from '../models/PortalMessage';
import { RefreshToken } from '../models/RefreshToken';
import { uploadsDir } from '../config/storage';
import { blobExists, isAzureBlobConfigured, isAzureBlobUrl } from './azureBlobService';
import { enqueueEmail } from './emailOutboxService';
import { resolveAdminInbox } from './notificationService';
import { runBackup } from './backupService';
import { pruneStaleCronLocks } from './cronLockService';
import { purgeTerminalEmails } from './emailOutboxService';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* -------------------------------------------------------------------------- */
/* Lead follow-ups                                                            */
/* -------------------------------------------------------------------------- */

export interface FollowUpReminderResult {
  checked: number;
  reminded: number;
  skipped: number;
}

/**
 * Remind the studio about leads whose follow-up window has arrived.
 *
 * A lead is due when it is still open, has a pending follow-up scheduled in
 * the past, and that follow-up has not already been reminded about today.
 * The dedupe key is per lead+follow-up+day, so a run that repeats (or a
 * second instance that slips past the lock) cannot spam the studio twice.
 */
export async function sendFollowUpReminders(
  options: { now?: Date } = {},
): Promise<FollowUpReminderResult> {
  const now = options.now ?? new Date();
  const day = now.toISOString().slice(0, 10);
  const result: FollowUpReminderResult = { checked: 0, reminded: 0, skipped: 0 };

  const leads = await Lead.find({
    status: { $nin: ['Completed', 'Rejected'] },
    followUps: { $elemMatch: { status: 'pending', scheduledAt: { $lte: now } } },
  })
    .limit(200)
    .lean();

  if (leads.length === 0) return result;
  result.checked = leads.length;

  const inbox = await resolveAdminInbox();

  for (const lead of leads) {
    const due = (lead.followUps ?? []).filter(
      (f) => f.status === 'pending' && new Date(f.scheduledAt).getTime() <= now.getTime(),
    );
    if (due.length === 0) {
      result.skipped += 1;
      continue;
    }

    if (!inbox) {
      logger.info({ leadId: String(lead._id) }, 'Follow-up due but no admin inbox configured');
      result.skipped += 1;
      continue;
    }

    const followUp = due[0];
    const followUpId = String(followUp._id);
    const overdueDays = Math.max(
      0,
      Math.floor((now.getTime() - new Date(followUp.scheduledAt).getTime()) / (24 * 60 * 60 * 1000)),
    );

    const subject = `Follow-up due — ${lead.name}${overdueDays > 0 ? ` (${overdueDays}d overdue)` : ''}`;
    const text = [
      `A follow-up is due for ${lead.name}.`,
      `Phone: ${lead.phone}`,
      `Service: ${lead.service}`,
      `Type: ${followUp.type}`,
      `Scheduled: ${new Date(followUp.scheduledAt).toISOString()}`,
      followUp.notes ? `Notes: ${followUp.notes}` : '',
      `Lead ID: ${String(lead._id)}`,
    ]
      .filter(Boolean)
      .join('\n');

    const queued = await enqueueEmail({
      to: inbox,
      kind: 'lead-followup-reminder',
      dedupeKey: `lead-followup:${String(lead._id)}:${followUpId}:${day}`,
      subject,
      text,
      html: `
        <p>A follow-up is due for <strong>${escapeHtml(lead.name)}</strong>.</p>
        <p><strong>Phone:</strong> ${escapeHtml(lead.phone)}</p>
        <p><strong>Service:</strong> ${escapeHtml(lead.service)}</p>
        <p><strong>Type:</strong> ${escapeHtml(followUp.type)}</p>
        <p><strong>Scheduled:</strong> ${escapeHtml(new Date(followUp.scheduledAt).toISOString())}</p>
        ${followUp.notes ? `<p><strong>Notes:</strong> ${escapeHtml(followUp.notes)}</p>` : ''}
      `,
    });

    if (queued.duplicate) result.skipped += 1;
    else result.reminded += 1;
  }

  return result;
}

/* -------------------------------------------------------------------------- */
/* Trial & delivery reminders                                                 */
/* -------------------------------------------------------------------------- */

export interface OrderReminderResult {
  checked: number;
  trialReminders: number;
  deliveryReminders: number;
}

/**
 * Remind the customer about an upcoming fitting trial or delivery.
 *
 * A reminder is keyed by order + milestone + calendar day, so each customer
 * receives at most one trial and one delivery notice per day, and repeated
 * cron runs never duplicate a notice.
 */
export async function sendTrialDeliveryReminders(
  options: { now?: Date; windowDays?: number } = {},
): Promise<OrderReminderResult> {
  const now = options.now ?? new Date();
  const windowDays = options.windowDays ?? 3;
  const horizon = new Date(now.getTime() + windowDays * 24 * 60 * 60 * 1000);
  const result: OrderReminderResult = { checked: 0, trialReminders: 0, deliveryReminders: 0 };

  const orders = await Order.find({
    status: { $nin: ['delivery', 'cancelled'] },
    $or: [
      { expectedTrialAt: { $gte: now, $lte: horizon } },
      { expectedDeliveryAt: { $gte: now, $lte: horizon } },
    ],
  })
    .limit(200)
    .lean();

  if (orders.length === 0) return result;
  result.checked = orders.length;

  for (const order of orders) {
    const customer = await Customer.findById(order.customerId).lean();
    if (!customer?.email) continue;

    if (order.expectedTrialAt && order.expectedTrialAt.getTime() >= now.getTime()) {
      const queued = await enqueueEmail({
        to: customer.email,
        kind: 'order-trial-reminder',
        dedupeKey: `order-trial:${String(order._id)}:${order.expectedTrialAt.toISOString().slice(0, 10)}`,
        subject: `Your fitting trial — ${order.title}`,
        text: [
          `Dear ${customer.name},`,
          '',
          `Your fitting trial for "${order.title}" is scheduled for ${order.expectedTrialAt.toLocaleString()}.`,
          `Reference ID: ${order.referenceId ?? order.orderNumber}`,
          '',
          '— Kadamba\'s Designer Studio, Kurnool',
        ].join('\n'),
        html: `
          <p>Dear ${escapeHtml(customer.name)},</p>
          <p>Your fitting trial for <strong>${escapeHtml(order.title)}</strong> is scheduled for <strong>${escapeHtml(order.expectedTrialAt.toISOString())}</strong>.</p>
          <p>Reference ID: <strong>${escapeHtml(order.referenceId ?? String(order.orderNumber))}</strong></p>
          <p>— Kadamba's Designer Studio, Kurnool</p>
        `,
      });
      if (!queued.duplicate) result.trialReminders += 1;
    }

    if (order.expectedDeliveryAt && order.expectedDeliveryAt.getTime() >= now.getTime()) {
      const queued = await enqueueEmail({
        to: customer.email,
        kind: 'order-delivery-reminder',
        dedupeKey: `order-delivery:${String(order._id)}:${order.expectedDeliveryAt.toISOString().slice(0, 10)}`,
        subject: `Your order is ready for delivery — ${order.title}`,
        text: [
          `Dear ${customer.name},`,
          '',
          `Your order "${order.title}" is expected to be ready for delivery on ${order.expectedDeliveryAt.toLocaleDateString()}.`,
          `Reference ID: ${order.referenceId ?? order.orderNumber}`,
          '',
          '— Kadamba\'s Designer Studio, Kurnool',
        ].join('\n'),
        html: `
          <p>Dear ${escapeHtml(customer.name)},</p>
          <p>Your order <strong>${escapeHtml(order.title)}</strong> is expected to be ready for delivery on <strong>${escapeHtml(order.expectedDeliveryAt.toISOString())}</strong>.</p>
          <p>Reference ID: <strong>${escapeHtml(order.referenceId ?? String(order.orderNumber))}</strong></p>
          <p>— Kadamba's Designer Studio, Kurnool</p>
        `,
      });
      if (!queued.duplicate) result.deliveryReminders += 1;
    }
  }

  return result;
}

/* -------------------------------------------------------------------------- */
/* Orphan cleanup                                                             */
/* -------------------------------------------------------------------------- */

export interface OrphanCleanupResult {
  expiredSessions: number;
  orphanMessages: number;
  orphanMediaRows: number;
  orphanFiles: number;
  staleOutbox: number;
  staleLocks: number;
}

/**
 * Remove rows and files that no longer point at anything real.
 *
 * This is deliberately conservative:
 *  - expired refresh tokens and old outbox rows are pure garbage;
 *  - portal messages whose customer or order is gone are unreadable anyway;
 *  - media rows whose original file vanished are dead weight, and the now
 *    unreferenced files in the uploads tree are removed too.
 *
 * It never touches a file that any content still references, and it never
 * touches files outside the uploads directory.
 */
export async function cleanupOrphans(
  options: { now?: Date; dryRun?: boolean } = {},
): Promise<OrphanCleanupResult> {
  const now = options.now ?? new Date();
  const dryRun = options.dryRun ?? false;
  const result: OrphanCleanupResult = {
    expiredSessions: 0,
    orphanMessages: 0,
    orphanMediaRows: 0,
    orphanFiles: 0,
    staleOutbox: 0,
    staleLocks: 0,
  };

  // 1. Expired refresh tokens.
  const expiredTokens = await RefreshToken.deleteMany({ expiresAt: { $lt: now } });
  result.expiredSessions = expiredTokens.deletedCount ?? 0;

  // 2. Portal messages pointing at a customer (or an order) that no longer
  //    exists. A message without an order is normal — the field is optional —
  //    so only a *dangling* reference counts as an orphan.
  const candidateMessages = await PortalMessage.find({})
    .select('_id customerId orderId')
    .limit(2000)
    .lean();

  const customerIds = new Set<string>();
  const orderIds = new Set<string>();
  for (const message of candidateMessages) {
    if (message.customerId) customerIds.add(String(message.customerId));
    if (message.orderId) orderIds.add(String(message.orderId));
  }

  const existingCustomers = new Set(
    (await Customer.find({ _id: { $in: [...customerIds] } }).select('_id').lean()).map((c) =>
      String(c._id),
    ),
  );
  const existingOrders = new Set(
    (await Order.find({ _id: { $in: [...orderIds] } }).select('_id').lean()).map((o) =>
      String(o._id),
    ),
  );

  const orphanMessageIds = candidateMessages
    .filter((message) => {
      const customerMissing =
        Boolean(message.customerId) && !existingCustomers.has(String(message.customerId));
      const orderMissing =
        Boolean(message.orderId) && !existingOrders.has(String(message.orderId));
      return customerMissing || orderMissing;
    })
    .map((message) => message._id);

  if (orphanMessageIds.length > 0) {
    if (!dryRun) {
      const deleted = await PortalMessage.deleteMany({ _id: { $in: orphanMessageIds } });
      result.orphanMessages = deleted.deletedCount ?? 0;
    } else {
      result.orphanMessages = orphanMessageIds.length;
    }
  }

  // 3. Media rows whose original file is gone. The row is dead weight — the
  //    picture it describes no longer exists. Files on disk are NEVER deleted
  //    here: `uploads/` is canonical and existing files are never removed.
  const assets = await ImageAsset.find({}).select('_id hash originalUrl variants').lean();
  const onDisk = new Set<string>();
  if (fs.existsSync(uploadsDir)) {
    for (const entry of fs.readdirSync(uploadsDir, { withFileTypes: true })) {
      if (entry.isFile()) onDisk.add(entry.name);
    }
  }

  const referencedFiles = new Set<string>();
  const azureConfigured = isAzureBlobConfigured();
  const deadAssets: typeof assets = [];

  for (const asset of assets) {
    if (isAzureBlobUrl(asset.originalUrl)) {
      if (!azureConfigured) continue;
      try {
        const exists = await blobExists(asset.originalUrl);
        if (!exists) deadAssets.push(asset);
      } catch {
        // Network/auth blip — never delete metadata on a transient check failure.
      }
      continue;
    }

    const file = path.basename(asset.originalUrl);
    referencedFiles.add(file);
    if (!onDisk.has(file)) {
      deadAssets.push(asset);
    }
  }

  if (deadAssets.length > 0 && !dryRun) {
    const deleted = await ImageAsset.deleteMany({ _id: { $in: deadAssets.map((a) => a._id) } });
    result.orphanMediaRows = deleted.deletedCount ?? 0;
  } else {
    result.orphanMediaRows = deadAssets.length;
  }

  // Files on disk that no asset row mentions are reported, not removed: an
  // original is never deleted by a background job.
  for (const file of onDisk) {
    if (referencedFiles.has(file)) continue;
    result.orphanFiles += 1;
  }

  // 4. Terminal outbox rows past the retention window, and stale cron locks.
  if (!dryRun) {
    result.staleOutbox = await purgeTerminalEmails();
    result.staleLocks = await pruneStaleCronLocks();
  }

  logger.info({ ...result, dryRun }, 'Orphan cleanup finished');
  return result;
}

/* -------------------------------------------------------------------------- */
/* Nightly backup                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Write the nightly database backup.
 *
 * `runBackup()` already prunes the archives it supersedes, so there is no
 * second sweep here.
 */
export async function runNightlyBackup(): Promise<{ ok: boolean; file: string; bytes: number }> {
  const result = await runBackup();
  if (!result.ok) {
    logger.error({ err: result.error }, 'Nightly backup failed');
    return { ok: false, file: result.file, bytes: 0 };
  }
  return { ok: true, file: result.file, bytes: result.bytes };
}
