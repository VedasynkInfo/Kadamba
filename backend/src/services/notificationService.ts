import { sendEmail } from '../config/email';
import { env } from '../config/env';
import { logger } from '../config/logger';
import {
  emitNotifyBadge,
  emitNotifyLead,
  emitNotifyMeasurement,
  emitNotifyOrder,
  emitNotifyPayment,
} from '../realtime/portalSocket';
import { Lead } from '../models/Lead';
import { MeasurementProfile } from '../models/MeasurementProfile';
import { PortalMessage } from '../models/PortalMessage';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Always attempt send; sendEmail logs+skips when SMTP unset. Also console.info for ops visibility. */
async function deliver(options: {
  to: string;
  subject: string;
  html: string;
  text: string;
  kind: string;
}): Promise<void> {
  console.info(`[notify:${options.kind}]`, {
    to: options.to,
    subject: options.subject,
  });
  try {
    await sendEmail({
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
  } catch (err) {
    logger.warn({ err, kind: options.kind }, 'Notification email failed');
  }
}

function adminInbox(): string | undefined {
  // Prefer Settings admin inbox when loaded asynchronously by callers;
  // env remains the sync fallback used at module load time.
  const to = env.email.to || env.email.user;
  return to && !to.startsWith('your_') ? to : undefined;
}

/** Resolve admin notify inbox: Settings SMTP adminTo → env EMAIL_TO. */
export async function resolveAdminInbox(): Promise<string | undefined> {
  try {
    const { resolveSmtpConfig } = await import('./settingsService');
    const smtp = await resolveSmtpConfig();
    if (smtp?.adminTo) return smtp.adminTo;
  } catch {
    // ignore
  }
  return adminInbox();
}

export async function getAdminBadgeCounts() {
  const [leads, measurements, chat] = await Promise.all([
    Lead.countDocuments({ status: { $in: ['New', 'Contacted'] } }),
    MeasurementProfile.countDocuments({ status: 'pending_approval' }),
    PortalMessage.countDocuments({
      senderRole: 'customer',
      readAt: { $exists: false },
    }),
  ]);
  return { leads, measurements, chat };
}

export async function emitAdminBadgeRefresh(reason?: string) {
  try {
    const counts = await getAdminBadgeCounts();
    emitNotifyBadge({ scope: 'admin', reason, ...counts });
  } catch {
    emitNotifyBadge({ scope: 'admin', reason });
  }
}

/** Public or portal request → admin + customer ack + live notify */
export async function notifyRequestReceived(input: {
  leadId: string;
  name: string;
  phone: string;
  email?: string;
  service?: string;
  occasion?: string;
  orderId?: string;
  orderNumber?: number;
  source?: string;
}): Promise<void> {
  const adminTo = await resolveAdminInbox();
  const serviceLabel = input.service || 'Consultation';

  if (adminTo) {
    await deliver({
      kind: 'request-admin',
      to: adminTo,
      subject: `New service request — ${input.name}`,
      text: [
        `New request from ${input.name}`,
        `Phone: ${input.phone}`,
        `Email: ${input.email || '—'}`,
        `Service: ${serviceLabel}`,
        `Occasion: ${input.occasion || '—'}`,
        input.orderNumber ? `Order #${input.orderNumber}` : '',
        `Lead ID: ${input.leadId}`,
      ]
        .filter(Boolean)
        .join('\n'),
      html: `
        <h2>New service request</h2>
        <p><strong>Name:</strong> ${escapeHtml(input.name)}</p>
        <p><strong>Phone:</strong> ${escapeHtml(input.phone)}</p>
        <p><strong>Email:</strong> ${escapeHtml(input.email || '—')}</p>
        <p><strong>Service:</strong> ${escapeHtml(serviceLabel)}</p>
        ${input.orderNumber ? `<p><strong>Order:</strong> #${input.orderNumber}</p>` : ''}
        <p><strong>Lead ID:</strong> ${escapeHtml(input.leadId)}</p>
      `,
    });
  } else {
    console.info('[notify:request-admin] no admin inbox configured', input);
  }

  if (input.email && !input.email.includes('@kadamba.local')) {
    await deliver({
      kind: 'request-customer',
      to: input.email,
      subject: "We received your consultation request — Kadamba's Designer Studio",
      text: `Hi ${input.name},\n\nThank you for requesting a consultation with Kadamba's Designer Studio in Kurnool. We will review your details and get back to you shortly.${
        input.orderNumber ? `\n\nYour enquiry order is #${input.orderNumber}.` : ''
      }\n\n— Kadamba's Designer Studio`,
      html: `
        <p>Hi ${escapeHtml(input.name)},</p>
        <p>Thank you for requesting a consultation with <strong>Kadamba's Designer Studio</strong> in Kurnool. We will review your details and get back to you shortly.</p>
        ${
          input.orderNumber
            ? `<p>Your enquiry order is <strong>#${input.orderNumber}</strong>.</p>`
            : ''
        }
        <p>— Kadamba's Designer Studio</p>
      `,
    });
  }

  try {
    emitNotifyLead({
      leadId: input.leadId,
      name: input.name,
      phone: input.phone,
      service: serviceLabel,
      orderId: input.orderId,
      orderNumber: input.orderNumber,
      source: input.source || 'Request Service',
      at: new Date().toISOString(),
    });
    await emitAdminBadgeRefresh('lead');
  } catch {
    // Socket optional
  }
}

/** Measurement submitted pending approval → admin email + socket */
export async function notifyMeasurementPending(input: {
  profileId: string;
  customerId: string;
  customerName?: string;
  productTypeCode: string;
  profileName?: string;
}): Promise<void> {
  const adminTo = await resolveAdminInbox();
  const label = input.profileName || input.productTypeCode;

  if (adminTo) {
    await deliver({
      kind: 'measurement-pending',
      to: adminTo,
      subject: `Measurement pending approval — ${input.customerName || 'Customer'}`,
      text: `Customer ${input.customerName || input.customerId} submitted measurements for ${label}. Profile ${input.profileId}.`,
      html: `
        <p>Measurement profile awaiting approval.</p>
        <p><strong>Customer:</strong> ${escapeHtml(input.customerName || input.customerId)}</p>
        <p><strong>Profile:</strong> ${escapeHtml(label)}</p>
        <p><strong>ID:</strong> ${escapeHtml(input.profileId)}</p>
      `,
    });
  } else {
    console.info('[notify:measurement-pending]', input);
  }

  try {
    emitNotifyMeasurement({
      profileId: input.profileId,
      customerId: input.customerId,
      status: 'pending_approval',
      productTypeCode: input.productTypeCode,
      profileName: input.profileName,
      at: new Date().toISOString(),
    });
    await emitAdminBadgeRefresh('measurement');
    emitNotifyBadge({ scope: 'customer', customerId: input.customerId, reason: 'measurement' });
  } catch {
    // Socket optional
  }
}

/** Measurement approved → customer email + socket */
export async function notifyMeasurementApproved(input: {
  profileId: string;
  customerId: string;
  customerName?: string;
  customerEmail?: string;
  productTypeCode: string;
  profileName?: string;
}): Promise<void> {
  const label = input.profileName || input.productTypeCode;

  if (input.customerEmail && !input.customerEmail.includes('@kadamba.local')) {
    await deliver({
      kind: 'measurement-approved',
      to: input.customerEmail,
      subject: `Measurements approved — Kadamba's Designer Studio`,
      text: `Hi ${input.customerName || 'there'},\n\nYour measurements for "${label}" have been approved by Kadamba's Designer Studio in Kurnool. You can view them in your customer portal.\n\n— Kadamba's Designer Studio`,
      html: `
        <p>Hi ${escapeHtml(input.customerName || 'there')},</p>
        <p>Your measurements for <strong>${escapeHtml(label)}</strong> have been approved by Kadamba's Designer Studio in Kurnool.</p>
        <p>You can view them in your customer portal.</p>
        <p>— Kadamba's Designer Studio</p>
      `,
    });
  } else {
    console.info('[notify:measurement-approved]', input);
  }

  try {
    emitNotifyMeasurement({
      profileId: input.profileId,
      customerId: input.customerId,
      status: 'active',
      productTypeCode: input.productTypeCode,
      profileName: input.profileName,
      at: new Date().toISOString(),
    });
    await emitAdminBadgeRefresh('measurement');
    emitNotifyBadge({ scope: 'customer', customerId: input.customerId, reason: 'measurement' });
  } catch {
    // Socket optional
  }
}

/** Payment recorded → optional short receipt + socket */
export async function notifyPaymentRecorded(input: {
  paymentId: string;
  orderId: string;
  orderNumber?: number;
  customerId: string;
  customerName?: string;
  customerEmail?: string;
  amount: number;
  balance?: number;
  method?: string;
}): Promise<void> {
  if (input.customerEmail && !input.customerEmail.includes('@kadamba.local')) {
    await deliver({
      kind: 'payment-receipt',
      to: input.customerEmail,
      subject: `Payment received — ₹${input.amount}${input.orderNumber ? ` · Order #${input.orderNumber}` : ''}`,
      text: `Hi ${input.customerName || 'there'},\n\nWe recorded a payment of ₹${input.amount}${
        input.method ? ` via ${input.method}` : ''
      }${input.orderNumber ? ` for order #${input.orderNumber}` : ''}.${
        input.balance != null ? `\nOutstanding balance: ₹${input.balance}.` : ''
      }\n\n— Kadamba's Designer Studio, Kurnool`,
      html: `
        <p>Hi ${escapeHtml(input.customerName || 'there')},</p>
        <p>We recorded a payment of <strong>₹${input.amount}</strong>${
          input.method ? ` via ${escapeHtml(input.method)}` : ''
        }${input.orderNumber ? ` for order <strong>#${input.orderNumber}</strong>` : ''}.</p>
        ${
          input.balance != null
            ? `<p>Outstanding balance: <strong>₹${input.balance}</strong>.</p>`
            : ''
        }
        <p>— Kadamba's Designer Studio, Kurnool</p>
      `,
    });
  } else {
    console.info('[notify:payment-receipt]', input);
  }

  try {
    emitNotifyPayment({
      paymentId: input.paymentId,
      orderId: input.orderId,
      orderNumber: input.orderNumber,
      customerId: input.customerId,
      amount: input.amount,
      balance: input.balance,
      at: new Date().toISOString(),
    });
    emitNotifyOrder({
      orderId: input.orderId,
      orderNumber: input.orderNumber,
      customerId: input.customerId,
      reason: 'payment',
      balance: input.balance,
      at: new Date().toISOString(),
    });
    await emitAdminBadgeRefresh('payment');
    emitNotifyBadge({ scope: 'customer', customerId: input.customerId, reason: 'payment' });
  } catch {
    // Socket optional
  }
}

/** Order status change → live notify (email for confirmed is separate / hardened) */
export function notifyOrderStatusChanged(input: {
  orderId: string;
  orderNumber?: number;
  customerId: string;
  status: string;
  referenceId?: string;
  title?: string;
}): void {
  try {
    emitNotifyOrder({
      orderId: input.orderId,
      orderNumber: input.orderNumber,
      customerId: input.customerId,
      status: input.status,
      referenceId: input.referenceId,
      title: input.title,
      at: new Date().toISOString(),
    });
    emitNotifyBadge({
      scope: 'both',
      customerId: input.customerId,
      reason: 'order',
    });
    void emitAdminBadgeRefresh('order');
  } catch {
    // Socket optional
  }
}
