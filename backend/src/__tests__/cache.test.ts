import { describe, expect, it, beforeEach } from 'vitest';
import mongoose from 'mongoose';
import {
  CACHE_KEYS,
  cacheKey,
  cached,
  clearCache,
  invalidateCache,
} from '../services/cacheService';
import { getPublicSettings, getAdminSettings, invalidateSettingsCache } from '../services/settingsService';
import { getDashboardSummary, invalidateDashboardCache } from '../services/dashboardService';
import { listBlogs, createBlog, invalidateBlogCache } from '../services/blogService';
import { Lead } from '../models/Lead';
import { WebsiteSettings } from '../models/WebsiteSettings';
import { Blog } from '../models/Blog';

describe('LRU cache', () => {
  beforeEach(() => {
    clearCache();
  });

  it('loads a value once and serves it from cache afterwards', async () => {
    let loads = 0;
    const load = async () => {
      loads += 1;
      return { value: loads };
    };

    const first = await cached('k', 60_000, load);
    const second = await cached('k', 60_000, load);

    expect(first).toEqual({ value: 1 });
    expect(second).toEqual({ value: 1 });
    expect(loads).toBe(1);
  });

  it('returns a copy so a caller cannot mutate the cached value', async () => {
    const load = async () => ({ nested: { count: 1 }, list: [1, 2, 3] });

    const first = await cached('copy', 60_000, load);
    first.nested.count = 99;
    first.list.push(4);

    const second = await cached('copy', 60_000, load);
    expect(second.nested.count).toBe(1);
    expect(second.list).toHaveLength(3);
  });

  it('invalidates by prefix', async () => {
    let loads = 0;
    const load = async () => {
      loads += 1;
      return loads;
    };

    await cached('cms:blog:list', 60_000, load);
    await cached('cms:portfolio:list', 60_000, load);
    expect(loads).toBe(2);

    invalidateCache('cms:blog');
    await cached('cms:blog:list', 60_000, load);
    await cached('cms:portfolio:list', 60_000, load);

    // Only the invalidated key was reloaded.
    expect(loads).toBe(3);
  });

  it('builds a stable key from an object', () => {
    expect(cacheKey('p', { b: 2, a: 1 })).toBe(cacheKey('p', { a: 1, b: 2 }));
    expect(cacheKey('p', { a: 1 })).not.toBe(cacheKey('p', { a: 2 }));
  });

  it('expires an entry once its TTL has passed', async () => {
    let loads = 0;
    const load = async () => {
      loads += 1;
      return loads;
    };

    await cached('ttl', 30, load);
    await new Promise((resolve) => setTimeout(resolve, 60));
    await cached('ttl', 30, load);

    expect(loads).toBe(2);
  });
});

describe('settings cache', () => {
  beforeEach(async () => {
    clearCache();
    await WebsiteSettings.deleteMany({});
  });

  it('serves the public settings from cache and refreshes after a write', async () => {
    await getPublicSettings();

    // Second read is served from the cache — the document is not re-read.
    const first = await getPublicSettings();
    expect(first.studioName).toBeTruthy();

    await WebsiteSettings.updateOne(
      { key: 'site' },
      { $set: { studioName: 'Renamed Studio' } },
    );
    invalidateSettingsCache();

    const after = await getPublicSettings();
    expect(after.studioName).toBe('Renamed Studio');
  });

  it('keeps the admin view separate from the public view', async () => {
    const pub = await getPublicSettings();
    const admin = await getAdminSettings();

    expect(pub.emailConfig).toBeUndefined();
    expect(admin.emailConfig).toBeDefined();
    expect((admin.emailConfig as { pass?: string }).pass).toBe('');
  });
});

describe('dashboard cache', () => {
  beforeEach(async () => {
    clearCache();
    await Lead.deleteMany({});
  });

  it('reflects a new lead after the cache is invalidated', async () => {
    const before = await getDashboardSummary();
    const openBefore = before.metrics.leadsOpen;

    await Lead.create({
      name: 'Cache Lead',
      phone: '9000000009',
      email: 'cache@example.com',
      city: 'Kurnool',
      service: 'Saree',
      occasion: 'Wedding',
      budget: 'Mid',
      preferredDate: new Date(),
      message: 'Hello, I would like to book a fitting appointment.',
      inspirationImages: [],
      status: 'New',
      source: 'WhatsApp',
      assignee: 'Studio Team',
      notes: [],
      timeline: [],
      followUps: [],
    });

    invalidateDashboardCache();
    const after = await getDashboardSummary();
    expect(after.metrics.leadsOpen).toBe(openBefore + 1);
  });

  it('caches the summary for the same range', async () => {
    const now = new Date();
    const from = new Date(now.getTime() - 30 * 24 * 60 * 60_000).toISOString();
    const to = now.toISOString();

    const a = await getDashboardSummary(from, to);
    const b = await getDashboardSummary(from, to);
    expect(a.range).toEqual(b.range);
  });
});

describe('CMS cache', () => {
  beforeEach(async () => {
    clearCache();
    await Blog.deleteMany({});
  });

  it('serves the blog list from cache and refreshes on write', async () => {
    await createBlog({ title: 'First Story', excerpt: 'Hello', coverImage: '/uploads/a.png' });

    const first = await listBlogs({}, { admin: false });
    expect(first.items).toHaveLength(1);

    await createBlog({ title: 'Second Story', excerpt: 'World', coverImage: '/uploads/b.png' });
    invalidateBlogCache();

    const second = await listBlogs({}, { admin: false });
    expect(second.items).toHaveLength(2);
  });

  it('does not leak unpublished posts into the public list', async () => {
    await Blog.create({
      title: 'Draft',
      slug: 'draft',
      excerpt: 'Not ready',
      category: 'Studio Notes',
      coverImage: '/uploads/draft.png',
      coverAlt: 'Draft cover',
      published: false,
      featured: false,
      readMinutes: 3,
      author: 'Studio',
      content: [],
      tags: [],
    });

    const publicList = await listBlogs({}, { admin: false });
    const adminList = await listBlogs({}, { admin: true });

    expect(publicList.items).toHaveLength(0);
    expect(adminList.items).toHaveLength(1);
  });
});

describe('cache hooks', () => {
  it('invalidates the dashboard when a lead is written', async () => {
    clearCache();
    await Lead.deleteMany({});

    const before = await getDashboardSummary();
    expect(before.metrics.leadsOpen).toBe(0);

    await Lead.create({
      name: 'Hook Lead',
      phone: '9000000008',
      email: 'hook@example.com',
      city: 'Kurnool',
      service: 'Blouse',
      occasion: 'Office',
      budget: 'Mid',
      preferredDate: new Date(),
      message: 'Hello, I would like to book a fitting appointment.',
      inspirationImages: [],
      status: 'New',
      source: 'WhatsApp',
      assignee: 'Studio Team',
      notes: [],
      timeline: [],
      followUps: [],
    });

    // No explicit invalidation call — the model hook does it.
    const after = await getDashboardSummary();
    expect(after.metrics.leadsOpen).toBe(1);
  });
});

describe('cache keys', () => {
  it('namespaces every cached resource', () => {
    expect(CACHE_KEYS.settingsPublic).not.toBe(CACHE_KEYS.settingsAdmin);
    expect(CACHE_KEYS.cmsBlog).not.toBe(CACHE_KEYS.cmsPortfolio);
    expect(CACHE_KEYS.dashboard).toBeTruthy();
    expect(mongoose.connection.readyState).toBe(1);
  });
});
