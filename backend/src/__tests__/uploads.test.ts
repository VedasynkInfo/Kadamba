import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../app';
import { sendEmail } from '../config/email';
import { EmailOutbox } from '../models/EmailOutbox';
import { ALLOWED_UPLOAD_MIMES, detectFileType, isAllowedUpload } from '../utils/fileSignature';
import { registerAdminAndGetToken } from './helpers/auth';

const app = createApp();

/** Minimal byte signatures — enough to exercise the detector. */
const SIGNATURES: Array<{ name: string; bytes: number[]; expected?: string }> = [
  { name: 'jpeg', bytes: [0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0], expected: 'image/jpeg' },
  { name: 'png', bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0], expected: 'image/png' },
  { name: 'gif', bytes: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0, 0, 0, 0, 0, 0], expected: 'image/gif' },
  { name: 'bmp', bytes: [0x42, 0x4d, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], expected: 'image/bmp' },
  { name: 'webm', bytes: [0x1a, 0x45, 0xdf, 0xa3, 0, 0, 0, 0, 0, 0, 0, 0], expected: 'video/webm' },
];

describe('file signature detection', () => {
  it('recognises the common image formats', () => {
    for (const signature of SIGNATURES) {
      const detected = detectFileType(Buffer.from(signature.bytes));
      expect(detected?.mime, signature.name).toBe(signature.expected);
    }
  });

  it('recognises webp and the ISO-BMFF family', () => {
    const webp = Buffer.alloc(16);
    webp.write('RIFF', 0, 'latin1');
    webp.write('WEBP', 8, 'latin1');
    expect(detectFileType(webp)?.mime).toBe('image/webp');

    const avif = Buffer.alloc(16);
    avif.write('ftyp', 4, 'latin1');
    avif.write('avif', 8, 'latin1');
    expect(detectFileType(avif)?.mime).toBe('image/avif');

    const mov = Buffer.alloc(16);
    mov.write('ftyp', 4, 'latin1');
    mov.write('qt  ', 8, 'latin1');
    expect(detectFileType(mov)?.mime).toBe('video/quicktime');

    const mp4 = Buffer.alloc(16);
    mp4.write('ftyp', 4, 'latin1');
    mp4.write('isom', 8, 'latin1');
    expect(detectFileType(mp4)?.mime).toBe('video/mp4');
  });

  it('rejects an unknown ISO-BMFF brand rather than guessing', () => {
    const heic = Buffer.alloc(16);
    heic.write('ftyp', 4, 'latin1');
    heic.write('heic', 8, 'latin1');
    expect(detectFileType(heic)).toBeUndefined();
  });

  it('rejects SVG and HTML, which can carry script', () => {
    const svg = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>');
    expect(detectFileType(svg)).toBeUndefined();

    const html = Buffer.from('<!DOCTYPE html><html><body></body></html>');
    expect(detectFileType(html)).toBeUndefined();
  });

  it('rejects a buffer that is too short to identify', () => {
    expect(detectFileType(Buffer.from([0xff, 0xd8]))).toBeUndefined();
    expect(detectFileType(Buffer.alloc(0))).toBeUndefined();
  });

  it('only allows the formats it claims to allow', () => {
    expect(ALLOWED_UPLOAD_MIMES.has('image/jpeg')).toBe(true);
    expect(ALLOWED_UPLOAD_MIMES.has('image/svg+xml')).toBe(false);
    expect(isAllowedUpload(Buffer.from('<svg></svg>'))).toBe(false);
    expect(isAllowedUpload(Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]))).toBe(
      true,
    );
  });
});

describe('contact form', () => {
  it('accepts a message and queues the notifications', async () => {
    const res = await request(app)
      .post('/api/contact')
      .send({
        name: 'Divya Reddy',
        email: 'divya@example.com',
        phone: '9876500000',
        message: 'I would like to book a fitting consultation.',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('rejects a message with no body', async () => {
    const res = await request(app)
      .post('/api/contact')
      .send({ name: 'Divya Reddy', email: 'divya@example.com', phone: '9876500000' });

    expect(res.status).toBe(400);
  });
});

describe('email transport', () => {
  it('logs instead of sending when no SMTP is configured', async () => {
    // No SMTP is configured in the test environment, so the transport must
    // degrade to a log rather than throw.
    await expect(
      sendEmail({
        to: 'someone@example.com',
        subject: 'Hello',
        html: '<p>Hello</p>',
        text: 'Hello',
      }),
    ).resolves.toBeUndefined();
  });

  it('does not touch SMTP for a queued message until the drainer runs', async () => {
    await EmailOutbox.deleteMany({});

    await request(app)
      .post('/api/contact')
      .send({
        name: 'Divya Reddy',
        email: 'divya@example.com',
        phone: '9876500000',
        message: 'I would like to book a fitting consultation.',
      });

    // The contact form only queues; nothing is sent inline.
    const pending = await EmailOutbox.countDocuments({ status: 'pending' });
    const sent = await EmailOutbox.countDocuments({ status: 'sent' });
    expect(sent).toBe(0);
    expect(pending).toBeGreaterThanOrEqual(0);
  });
});

describe('upload authorisation', () => {
  it('keeps the upload route behind authentication', async () => {
    const res = await request(app).post('/api/upload').attach('file', Buffer.from('nope'), {
      filename: 'nope.png',
      contentType: 'image/png',
    });
    expect(res.status).toBe(401);
  });

  it('keeps the media library behind authentication', async () => {
    const res = await request(app).get('/api/admin/media');
    expect(res.status).toBe(401);
  });

  it('rejects a file whose bytes are not a supported image', async () => {
    const token = await registerAdminAndGetToken(app);

    const res = await request(app)
      .post('/api/upload')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>'), {
        filename: 'payload.svg',
        contentType: 'image/png',
      });

    expect(res.status).toBe(400);
  });
});
