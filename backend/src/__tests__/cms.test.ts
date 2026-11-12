import request from 'supertest';
import { describe, expect, it, beforeEach } from 'vitest';
import { createApp } from '../app';
import { Blog } from '../models/Blog';
import { GalleryItem } from '../models/GalleryItem';
import { Portfolio } from '../models/Portfolio';
import { Service } from '../models/Service';
import { Order } from '../models/Order';
import { registerAdminAndGetToken } from './helpers/auth';

const app = createApp();

describe('CMS content lifecycle', () => {
  beforeEach(async () => {
    await Blog.deleteMany({});
    await Portfolio.deleteMany({});
    await GalleryItem.deleteMany({});
    await Service.deleteMany({});
    await Order.deleteMany({});
  });

  it('creates, reads, updates and deletes a blog post', async () => {
    const token = await registerAdminAndGetToken(app);

    const created = await request(app)
      .post('/api/blogs')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'A Studio Note',
        excerpt: 'What we learned this season.',
        category: 'Studio Notes',
        coverImage: '/media/photos/fabric-ivory.jpg',
        coverAlt: 'Fabric',
      });
    expect(created.status).toBe(201);
    expect(created.body.data.title).toBe('A Studio Note');

    const fetched = await request(app)
      .get(`/api/blogs/${created.body.data.slug}`)
      .set('Authorization', `Bearer ${token}`);
    expect(fetched.status).toBe(200);
    expect(fetched.body.data.excerpt).toContain('season');

    const updated = await request(app)
      .put(`/api/blogs/${created.body.data.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'A Renamed Studio Note' });
    expect(updated.status).toBe(200);
    expect(updated.body.data.title).toBe('A Renamed Studio Note');

    const removed = await request(app)
      .delete(`/api/blogs/${created.body.data.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(removed.status).toBe(200);
    expect(await Blog.countDocuments({})).toBe(0);
  });

  it('hides an unpublished post from the public and shows it to the desk', async () => {
    const token = await registerAdminAndGetToken(app);
    const created = await request(app)
      .post('/api/blogs')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'A Draft',
        excerpt: 'Not ready yet.',
        category: 'Studio Notes',
        coverImage: '/media/photos/fabric-ivory.jpg',
        coverAlt: 'Fabric',
        published: false,
      });

    const publicList = await request(app).get('/api/blogs');
    expect(publicList.body.data.items).toHaveLength(0);

    const adminList = await request(app)
      .get('/api/blogs')
      .set('Authorization', `Bearer ${token}`);
    expect(adminList.body.data.items).toHaveLength(1);

    const publicItem = await request(app).get(`/api/blogs/${created.body.data.slug}`);
    expect(publicItem.status).toBe(404);
  });

  it('404s for an unknown blog post', async () => {
    const res = await request(app).get('/api/blogs/does-not-exist');
    expect(res.status).toBe(404);
  });

  it('gives a second post with the same title its own slug', async () => {
    const token = await registerAdminAndGetToken(app);
    const payload = {
      title: 'A Studio Note',
      excerpt: 'What we learned this season.',
      category: 'Studio Notes',
      coverImage: '/media/photos/fabric-ivory.jpg',
      coverAlt: 'Fabric',
    };

    const first = await request(app)
      .post('/api/blogs')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);
    const second = await request(app)
      .post('/api/blogs')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(second.status).toBe(201);
    expect(second.body.data.slug).not.toBe(first.body.data.slug);
  });

  it('refuses a duplicate slug when the client asks for one explicitly', async () => {
    const token = await registerAdminAndGetToken(app);
    const payload = {
      title: 'A Studio Note',
      slug: 'a-studio-note',
      excerpt: 'What we learned this season.',
      category: 'Studio Notes',
      coverImage: '/media/photos/fabric-ivory.jpg',
      coverAlt: 'Fabric',
    };

    await request(app)
      .post('/api/blogs')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);
    const second = await request(app)
      .post('/api/blogs')
      .set('Authorization', `Bearer ${token}`)
      .send(payload);

    expect(second.status).toBe(409);
  });

  it('creates, updates and deletes a portfolio project', async () => {
    const token = await registerAdminAndGetToken(app);

    const created = await request(app)
      .post('/api/portfolio')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'A Wedding',
        category: 'Bridal',
        summary: 'A bride in a red lehenga.',
        bannerImage: '/media/photos/saree-jodhpur.jpg',
        bannerAlt: 'Saree',
        coverImage: '/media/photos/saree-jodhpur.jpg',
        coverAlt: 'Saree',
      });
    expect(created.status).toBe(201);

    const updated = await request(app)
      .put(`/api/portfolio/${created.body.data.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ summary: 'A bride in a green lehenga.' });
    expect(updated.status).toBe(200);
    expect(updated.body.data.summary).toContain('green');

    const removed = await request(app)
      .delete(`/api/portfolio/${created.body.data.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(removed.status).toBe(200);
  });

  it('creates, updates and deletes a gallery item', async () => {
    const token = await registerAdminAndGetToken(app);

    const created = await request(app)
      .post('/api/gallery')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'A Piece',
        category: 'Bridal',
        src: '/media/photos/bridal-red-lehenga.jpg',
        alt: 'A bridal piece',
        width: 1200,
        height: 1600,
      });
    expect(created.status).toBe(201);

    const updated = await request(app)
      .put(`/api/gallery/${created.body.data.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ alt: 'A better description' });
    expect(updated.status).toBe(200);
    expect(updated.body.data.alt).toBe('A better description');

    const removed = await request(app)
      .delete(`/api/gallery/${created.body.data.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(removed.status).toBe(200);
  });

  it('creates, updates and deletes a service', async () => {
    const token = await registerAdminAndGetToken(app);

    const created = await request(app)
      .post('/api/services')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Bridal Consultation',
        category: 'Boutique',
        summary: 'An hour of styling.',
        bannerImage: '/media/photos/fabric-embroidery.jpg',
        bannerAlt: 'Embroidery',
        cardImage: '/media/photos/fabric-embroidery.jpg',
      });
    expect(created.status).toBe(201);

    const updated = await request(app)
      .put(`/api/services/${created.body.data.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ summary: 'Ninety minutes of styling.' });
    expect(updated.status).toBe(200);
    expect(updated.body.data.summary).toContain('Ninety');

    const removed = await request(app)
      .delete(`/api/services/${created.body.data.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(removed.status).toBe(200);
  });

  it('refuses to delete a service that an order still uses', async () => {
    const token = await registerAdminAndGetToken(app);
    const service = await Service.create({
      title: 'Bespoke Stitching',
      slug: 'bespoke-stitching',
      category: 'Boutique',
      summary: 'Made to measure.',
      description: [],
      bannerImage: '/media/photos/fabric-embroidery.jpg',
      bannerAlt: 'Embroidery',
      cardImage: '/media/photos/fabric-embroidery.jpg',
      icon: 'boutique',
      gallery: [],
      features: [],
      pricing: { note: '', startingFrom: '', tiers: [] },
      includes: [],
      durationNote: '',
      ctaLabel: 'Enquire',
      published: true,
      sortOrder: 1,
      isFulfillable: true,
      linkedProductTypeIds: [],
      defaultLeadTimeDays: 0,
      basePriceFrom: 0,
      tags: [],
      metaTitle: '',
      metaDescription: '',
      ogTitle: '',
      ogDescription: '',
      ogImage: '',
      twitterTitle: '',
      twitterDescription: '',
      twitterImage: '',
    });

    await Order.create({
      orderNumber: 9100,
      customerId: '64b000000000000000000000',
      status: 'confirmed',
      priority: 'normal',
      title: 'A bespoke order',
      lineItems: [{ name: 'Bespoke Stitching', qty: 1, serviceId: String(service._id) }],
      measurementProfileIds: [],
      assignedStaff: [],
      tags: [],
      notes: [],
      timeline: [],
      paymentSummary: { totalQuoted: 1000, advance: 0, totalPaid: 0, balance: 1000 },
      attachments: [],
    });

    const res = await request(app)
      .delete(`/api/services/${service._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('referenced by existing orders');
  });

  it('filters the CMS lists by category, search and published state', async () => {
    const token = await registerAdminAndGetToken(app);
    await GalleryItem.create({
      title: 'A Bridal Piece',
      slug: 'a-bridal-piece',
      category: 'Bridal',
      alt: 'Bridal',
      mediaType: 'image',
      src: '/media/photos/bridal-red-lehenga.jpg',
      width: 1200,
      height: 1600,
      published: true,
      sortOrder: 1,
    });
    await GalleryItem.create({
      title: 'A Traditional Piece',
      slug: 'a-traditional-piece',
      category: 'Traditional',
      alt: 'Traditional',
      mediaType: 'image',
      src: '/media/photos/saree-jodhpur.jpg',
      width: 1200,
      height: 1600,
      published: false,
      sortOrder: 2,
    });

    const byCategory = await request(app).get('/api/gallery?category=Bridal');
    expect(byCategory.body.data.items).toHaveLength(1);

    const bySearch = await request(app).get('/api/gallery?q=Traditional');
    expect(bySearch.body.data.items).toHaveLength(0); // unpublished

    const adminSearch = await request(app)
      .get('/api/gallery?q=Traditional')
      .set('Authorization', `Bearer ${token}`);
    expect(adminSearch.body.data.items).toHaveLength(1);
  });

  it('keeps the content desk behind authentication for writes', async () => {
    const res = await request(app)
      .post('/api/blogs')
      .send({ title: 'Nope', excerpt: 'Nope', category: 'Studio Notes' });
    expect(res.status).toBe(401);
  });
});
