import nodemailer from 'nodemailer';
import { env } from './env';
import { logger } from './logger';

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

export async function sendEmail(options: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}): Promise<void> {
  if (!env.email.user || !env.email.pass) {
    logger.warn('Email credentials not configured — skipping send');
    return;
  }

  await mailTransporter.sendMail({
    from: env.email.from || env.email.user,
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text,
  });
}
