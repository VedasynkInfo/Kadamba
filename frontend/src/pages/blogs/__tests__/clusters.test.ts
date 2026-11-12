import { describe, expect, it } from 'vitest';
import type { BlogPost } from '../data';
import { getCluster, JOURNAL_CLUSTERS, postsInCluster } from '../clusters';

function post(overrides: Partial<BlogPost>): BlogPost {
  return {
    id: 'p1',
    slug: 'a-post',
    title: 'A post',
    excerpt: 'An excerpt',
    content: [],
    category: 'Bridal',
    tags: [],
    coverImage: '/media/photos/bridal-red-lehenga.jpg',
    coverAlt: 'Cloth',
    date: '2026-01-01',
    readMinutes: 4,
    author: 'Kadamba',
    ...overrides,
  };
}

describe('journal clusters', () => {
  it('has unique slugs', () => {
    const slugs = JOURNAL_CLUSTERS.map((cluster) => cluster.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('places a Kurnool-tagged post in the Kurnool cluster', () => {
    const kurnool = getCluster('kurnool');
    expect(kurnool).toBeDefined();
    const posts = postsInCluster(kurnool!, [
      post({ id: 'k1', tags: ['kurnool', 'summer'] }),
      post({ id: 'k2', category: 'Tailoring', tags: ['blouse'] }),
    ]);
    expect(posts.map((item) => item.id)).toEqual(['k1']);
  });

  it('cuts across categories for a subject cluster', () => {
    const fabric = getCluster('fabric-and-care')!;
    const posts = postsInCluster(fabric, [
      post({ id: 'f1', category: 'Bridal', tags: ['zardozi'] }),
      post({ id: 'f2', category: 'Tailoring', tags: ['silk'] }),
      post({ id: 'f3', category: 'Studio Notes', tags: ['appointments'] }),
    ]);
    expect(posts.map((item) => item.id)).toEqual(['f1', 'f2']);
  });

  it('matches the title when the tag is missing', () => {
    const kurnool = getCluster('kurnool')!;
    const posts = postsInCluster(kurnool, [
      post({ id: 'k1', title: 'A Kurnool wedding in April' }),
    ]);
    expect(posts).toHaveLength(1);
  });

  it('returns undefined for an unknown cluster', () => {
    expect(getCluster('nope')).toBeUndefined();
    expect(getCluster(undefined)).toBeUndefined();
  });
});
