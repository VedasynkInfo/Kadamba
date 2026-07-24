import nodemailer from 'nodemailer';
import { env } from './env';
import { logger } from './logger';

function envEmailConfigured(): boolean {
  const { user, pass } = env.email;
  if (!user || !pass) return false;
  if (user.startsWith('your_') || pass.startsWith('your_')) return false;
  return true;
}

/**
 * Send email using Settings SMTP when configured, else env SMTP.
 * Logs payload when neither is available.
 */
export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<void> {
  let smtp: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    pass: string;
    from: string;
    fromName?: string;
  } | null = null;

  try {
    const { resolveSmtpConfig } = await import('../services/settingsService');
    const resolved = await resolveSmtpConfig();
    if (resolved) {
      smtp = {
        host: resolved.host,
        port: resolved.port,
        secure: resolved.secure,
        user: resolved.user,
        pass: resolved.pass,
        from: resolved.from,
        fromName: resolved.fromName,
      };
    }
  } catch {
    // Settings unavailable — fall back to env
  }

  if (!smtp && envEmailConfigured()) {
    smtp = {
      host: env.email.host,
      port: env.email.port,
      secure: env.email.port === 465,
      user: env.email.user,
      pass: env.email.pass,
      from: env.email.from || env.email.user,
    };
  }

  if (!smtp) {
    logger.warn(
      { to: options.to, subject: options.subject },
      'Email credentials not configured — logging instead of send',
    );
    console.info('[email:log]', {
      to: options.to,
      subject: options.subject,
      text: options.text?.slice(0, 400),
    });
    return;
  }

  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: { user: smtp.user, pass: smtp.pass },
  });

  await transporter.sendMail({
    from: smtp.fromName ? `"${smtp.fromName}" <${smtp.from}>` : smtp.from,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  });
}

/** Legacy export — some code may still import it; prefer sendEmail. */
export const mailTransporter = nodemailer.createTransport({
  host: env.email.host,
  port: env.email.port,
  secure: env.email.port === 465,
  auth: env.email.user
    ? {
        user: env.email.user,
        pass: env.email.pass,
      }
    : undefined,
});
