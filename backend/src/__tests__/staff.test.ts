import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../app';
import { registerAdminAndGetToken } from './helpers/auth';
import { Staff } from '../models/Staff';

const app = createApp();

describe('Staff Management API', () => {
  it('protects staff routes', async () => {
    const res = await request(app).get('/api/admin/staff');
    expect(res.status).toBe(401);
  });

  it('runs complete staff profile lifecycle: create, get, list, duplicate-check, update, and performance note', async () => {
    const token = await registerAdminAndGetToken(app);

    // 1. Create a staff member
    const createRes = await request(app)
      .post('/api/admin/staff')
      .set('Authorization', `Bearer ${token}`)
      .send({
        fullName: 'Ramesh Maggam Master',
        phone: '9848022338',
        locality: 'Prakash Nagar',
        address: 'Beside Gulf Cafe, Kurnool',
        employmentType: 'permanent',
        specializations: ['maggam', 'embroidery_maggam'],
        yearsExperience: 8,
        languages: ['Telugu', 'Hindi'],
        emergencyContact: {
          name: 'Latha',
          phone: '9848022339',
        },
        salaryType: 'monthly',
        salaryAmount: 25000,
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.success).toBe(true);
    expect(createRes.body.data.fullName).toBe('Ramesh Maggam Master');
    expect(createRes.body.data.phone).toBe('9848022338');
    
    const staffId = createRes.body.data.id;
    expect(staffId).toBeDefined();

    // 2. Reject duplicate phone numbers
    const dupRes = await request(app)
      .post('/api/admin/staff')
      .set('Authorization', `Bearer ${token}`)
      .send({
        fullName: 'Alternative Name',
        phone: '9848022338', // same phone
        locality: 'Kurnool Bazar',
        employmentType: 'freelance',
        specializations: ['cutting'],
      });

    expect(dupRes.status).toBe(400);

    // 3. Get Staff Detail
    const detailRes = await request(app)
      .get(`/api/admin/staff/${staffId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(detailRes.status).toBe(200);
    expect(detailRes.body.data.fullName).toBe('Ramesh Maggam Master');
    expect(detailRes.body.data.emergencyContact.name).toBe('Latha');

    // 4. List staff and filter
    const listRes = await request(app)
      .get('/api/admin/staff?q=Ramesh')
      .set('Authorization', `Bearer ${token}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.data.items.length).toBeGreaterThan(0);
    expect(listRes.body.data.items[0].fullName).toBe('Ramesh Maggam Master');

    // Filter by specialization
    const listSpecRes = await request(app)
      .get('/api/admin/staff?specialization=maggam')
      .set('Authorization', `Bearer ${token}`);
    expect(listSpecRes.status).toBe(200);
    expect(listSpecRes.body.data.items.length).toBeGreaterThan(0);

    // 5. Update Staff details
    const updateRes = await request(app)
      .patch(`/api/admin/staff/${staffId}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        locality: 'Kurnool Bazar',
        salaryAmount: 28000,
        status: 'inactive',
      });

    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.locality).toBe('Kurnool Bazar');
    expect(updateRes.body.data.salaryAmount).toBe(28000);
    expect(updateRes.body.data.status).toBe('inactive');

    // 6. Add performance note
    const noteRes = await request(app)
      .post(`/api/admin/staff/${staffId}/performance-notes`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        body: 'Excellent bridal work design completion.',
      });

    expect(noteRes.status).toBe(200);
    expect(noteRes.body.data.performanceNotes.length).toBe(1);
    expect(noteRes.body.data.performanceNotes[0].body).toBe('Excellent bridal work design completion.');
  }, 20000);
});
