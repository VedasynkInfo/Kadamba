import type { BlogCategory, BlogPost } from '@/pages/blogs/data';
import { uid } from '../hooks/useLocalCollection';

export const BLOG_CATEGORIES: BlogCategory[] = ['Bridal', 'Traditional', 'Tailoring', 'Studio Notes'];

export function createBlankBlog(): BlogPost {
  return {
    id: uid('blog'),
    slug: '',
    title: '',
    excerpt: '',
    content: [''],
    category: 'Studio Notes',
    tags: [],
    coverImage: '',
    coverAlt: '',
    date: new Date().toISOString().slice(0, 10),
    readMinutes: 4,
    author: "Kadamba's Designer Studio",
    featured: false,
    published: true,
    metaTitle: '',
    metaDescription: '',
    ogTitle: '',
    ogDescription: '',
    ogImage: '',
    twitterTitle: '',
    twitterDescription: '',
    twitterImage: '',
  };
}

export interface BlogsMetricsData {
  total: number;
  published: number;
  drafts: number;
  featured: number;
}
