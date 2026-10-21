import type { Request, Response } from 'express';
import { env } from '../config/env';
import { enqueueEmail } from '../services/emailOutboxService';
import { asyncHandler } from '../utils/asyncHandler';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Public contact form — emails the studio / admin inbox.
 */
export const submitContact = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, phone, message } = req.body as {
    name: string;
    email: string;
    phone: string;
    message: string;
  };

  const to = env.email.to || env.email.user;
  const safeName = escapeHtml(name);
  const safeEmail = escapeHtml(email);
  const safePhone = escapeHtml(phone);
  const safeMessage = escapeHtml(message).replace(/\n/g, '<br />');

  if (!to) {
    console.warn('Contact form received — EMAIL_TO / EMAIL_USER not set; skipping outbound mail');
    console.info({ name, email, phone, message });
  } else {
    // Queued, not sent inline: a slow or broken SMTP server must not hold the
    // public contact form open, and a crash must not lose the message.
    await enqueueEmail({
      to,
      kind: 'contact-admin',
      subject: `Contact form — ${name}`,
      text: `New contact message from ${name}\nEmail: ${email}\nPhone: ${phone}\n\n${message}`,
      html: `
      <h2>New contact message</h2>
      <p><strong>Name:</strong> ${safeName}</p>
      <p><strong>Email:</strong> ${safeEmail}</p>
      <p><strong>Phone:</strong> ${safePhone}</p>
      <p><strong>Message:</strong></p>
      <p>${safeMessage}</p>
    `,
    });

    await enqueueEmail({
      to: email,
      kind: 'contact-customer',
      subject: "We received your message — Kadamba's Designer Studio",
      text: `Hi ${name},\n\nThank you for writing to Kadamba's Designer Studio in Kurnool. We will get back to you shortly.\n\n— Kadamba's Designer Studio`,
      html: `
      <p>Hi ${safeName},</p>
      <p>Thank you for writing to <strong>Kadamba's Designer Studio</strong> in Kurnool. We will get back to you shortly.</p>
      <p>— Kadamba's Designer Studio</p>
    `,
    });
  }

  res.status(200).json({
    success: true,
    message: 'Message sent successfully',
  });
});
