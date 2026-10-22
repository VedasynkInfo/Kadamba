import request from 'supertest';
import { describe, expect, it, beforeEach } from 'vitest';
import { createApp } from '../app';
import { WebsiteSettings } from '../models/WebsiteSettings';
import { clearCache } from '../services/cacheService';
import { registerAdminAndGetToken } from './helpers/auth';

const app = createApp();

describe('website settings', () => {
  beforeEach(async () => {
    await WebsiteSettings.deleteMany({});
    clearCache();
  });

  it('serves the public settings without the SMTP block', async () => {
    const res = await request(app).get('/api/settings/public');

    expect(res.status).toBe(200);
    expect(res.body.data.studioName).toBeTruthy();
    expect(res.body.data.emailConfig).toBeUndefined();
  });

  it('serves the legacy public endpoint too', async () => {
    const res = await request(app).get('/api/settings');
    expect(res.status).toBe(200);
    expect(res.body.data.studioName).toBeTruthy();
  });

  it('masks the SMTP password in the admin view', async () => {
    const token = await registerAdminAndGetToken(app);
    await WebsiteSettings.findOneAndUpdate(
      { key: 'site' },
      {
        $set: {
          emailConfig: {
            host: 'smtp.example.com',
            port: 587,
            secure: false,
            user: 'studio@example.com',
            pass: 'super-secret',
            fromName: 'Kadamba',
            fromEmail: 'studio@example.com',
            adminTo: 'studio@example.com',
          },
        },
      },
      { upsert: true },
    );
    clearCache();

    const res = await request(app)
      .get('/api/admin/settings')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.emailConfig.pass).toBe('••••••••');
    expect(res.body.data.emailConfig.passSet).toBe(true);
    expect(res.body.data.emailConfig.user).toBe('studio@example.com');
  });

  it('updates the general fields', async () => {
    const token = await registerAdminAndGetToken(app);

    const res = await request(app)
      .put('/api/admin/settings')
      .set('Authorization', `Bearer ${token}`)
      .send({ studioName: 'Kadamba Atelier', phoneDisplay: '+91 90000 00000' });

    expect(res.status).toBe(200);
    expect(res.body.data.studioName).toBe('Kadamba Atelier');
    expect(res.body.data.phoneDisplay).toBe('+91 90000 00000');
  });

  it('refuses an empty studio name', async () => {
    const token = await registerAdminAndGetToken(app);

    const res = await request(app)
      .put('/api/admin/settings')
      .set('Authorization', `Bearer ${token}`)
      .send({ studioName: '   ' });

    expect(res.status).toBe(400);
  });

  it('reflects an update on the public endpoint straight away', async () => {
    const token = await registerAdminAndGetToken(app);

    await request(app)
      .put('/api/admin/settings')
      .set('Authorization', `Bearer ${token}`)
      .send({ studioName: 'Renamed Studio' });

    const pub = await request(app).get('/api/settings/public');
    expect(pub.body.data.studioName).toBe('Renamed Studio');
  });

  it('patches each section on its own', async () => {
    const token = await registerAdminAndGetToken(app);

    const general = await request(app)
      .patch('/api/admin/settings')
      .set('Authorization', `Bearer ${token}`)
      .send({ section: 'general', studioName: 'Patched Studio' });
    expect(general.status).toBe(200);
    expect(general.body.data.studioName).toBe('Patched Studio');

    const seo = await request(app)
      .patch('/api/admin/settings')
      .set('Authorization', `Bearer ${token}`)
      .send({ section: 'seo', siteName: 'Kadamba Atelier' });
    expect(seo.status).toBe(200);
    expect(seo.body.data.seo.siteName).toBe('Kadamba Atelier');

    const social = await request(app)
      .patch('/api/admin/settings')
      .set('Authorization', `Bearer ${token}`)
      .send({ section: 'social', instagram: 'https://instagram.com/kadamba' });
    expect(social.status).toBe(200);
    expect(social.body.data.socialNamed.instagram).toBe('https://instagram.com/kadamba');
    // The plain `social` array is kept in step with the named fields.
    expect(social.body.data.social.some((s: { href: string }) => s.href.includes('instagram'))).toBe(
      true,
    );

    const theme = await request(app)
      .patch('/api/admin/settings')
      .set('Authorization', `Bearer ${token}`)
      .send({ section: 'theme', primary: '#112233' });
    expect(theme.status).toBe(200);
    expect(theme.body.data.theme.primary).toBe('#112233');

    const media = await request(app)
      .patch('/api/admin/settings')
      .set('Authorization', `Bearer ${token}`)
      .send({ section: 'media', defaultUnit: 'cm' });
    expect(media.status).toBe(200);
    expect(media.body.data.media.defaultUnit).toBe('cm');
  });

  it('patches a section sent as a nested data object', async () => {
    const token = await registerAdminAndGetToken(app);

    const res = await request(app)
      .patch('/api/admin/settings')
      .set('Authorization', `Bearer ${token}`)
      .send({ section: 'general', data: { studioName: 'Nested Studio' } });

    expect(res.status).toBe(200);
    expect(res.body.data.studioName).toBe('Nested Studio');
  });

  it('stores the email configuration and keeps a masked password out of it', async () => {
    const token = await registerAdminAndGetToken(app);

    const res = await request(app)
      .patch('/api/admin/settings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        section: 'email',
        host: 'smtp.example.com',
        port: 465,
        secure: true,
        user: 'studio@example.com',
        pass: 'brand-new-secret',
        fromName: "Kadamba's Designer Studio",
        fromEmail: 'studio@example.com',
        adminTo: 'inbox@example.com',
      });

    expect(res.status).toBe(200);
    expect(res.body.data.emailConfig.pass).toBe('••••••••');

    const stored = await WebsiteSettings.findOne({ key: 'site' }).lean();
    expect(stored?.emailConfig?.pass).toBe('brand-new-secret');
    expect(stored?.emailConfig?.adminTo).toBe('inbox@example.com');
  });

  it('keeps the existing password when the masked one is sent back', async () => {
    const token = await registerAdminAndGetToken(app);
    await WebsiteSettings.findOneAndUpdate(
      { key: 'site' },
      {
        $set: {
          emailConfig: {
            host: 'smtp.example.com',
            port: 587,
            secure: false,
            user: 'studio@example.com',
            pass: 'original-secret',
            fromName: 'Kadamba',
            fromEmail: 'studio@example.com',
            adminTo: 'studio@example.com',
          },
        },
      },
      { upsert: true },
    );
    clearCache();

    await request(app)
      .patch('/api/admin/settings')
      .set('Authorization', `Bearer ${token}`)
      .send({ section: 'email', pass: '••••••••', fromName: 'Kadamba Studio' });

    const stored = await WebsiteSettings.findOne({ key: 'site' }).lean();
    expect(stored?.emailConfig?.pass).toBe('original-secret');
    expect(stored?.emailConfig?.fromName).toBe('Kadamba Studio');
  });

  it('clears the password only when asked explicitly', async () => {
    const token = await registerAdminAndGetToken(app);
    await WebsiteSettings.findOneAndUpdate(
      { key: 'site' },
      {
        $set: {
          emailConfig: {
            host: 'smtp.example.com',
            port: 587,
            secure: false,
            user: 'studio@example.com',
            pass: 'original-secret',
            fromName: 'Kadamba',
            fromEmail: 'studio@example.com',
            adminTo: 'studio@example.com',
          },
        },
      },
      { upsert: true },
    );
    clearCache();

    await request(app)
      .patch('/api/admin/settings')
      .set('Authorization', `Bearer ${token}`)
      .send({ section: 'email', passClear: true });

    const stored = await WebsiteSettings.findOne({ key: 'site' }).lean();
    expect(stored?.emailConfig?.pass).toBe('');
  });

  it('stores the email templates with an updated timestamp', async () => {
    const token = await registerAdminAndGetToken(app);

    const res = await request(app)
      .patch('/api/admin/settings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        section: 'email',
        templates: [
          {
            key: 'order-confirmed',
            subject: 'Your order is confirmed',
            bodyHtml: '<p>Hello</p>',
            bodyText: 'Hello',
          },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.data.emailConfig.templates).toHaveLength(1);
    expect(res.body.data.emailConfig.templates[0].updatedAt).toBeTruthy();
  });

  it('refuses to send a test email when SMTP is not configured', async () => {
    const token = await registerAdminAndGetToken(app);
    await WebsiteSettings.deleteMany({});
    clearCache();

    const res = await request(app)
      .post('/api/admin/settings/test-email')
      .set('Authorization', `Bearer ${token}`)
      .send({ to: 'someone@example.com' });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('SMTP');
  });

  it('keeps the settings desk admin-only', async () => {
    expect((await request(app).get('/api/admin/settings')).status).toBe(401);
  });

  it('validates the email address on the admin write', async () => {
    const token = await registerAdminAndGetToken(app);

    const res = await request(app)
      .put('/api/admin/settings')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'not-an-email' });

    expect(res.status).toBe(400);
  });
});
