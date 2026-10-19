import type { PortfolioCategory, PortfolioProject } from '@/pages/portfolio/data';
import { uid } from '../hooks/useLocalCollection';

export const PORTFOLIO_CATEGORIES: PortfolioCategory[] = [
  'Bridal',
  'Traditional',
  'Before/After',
  'Fashion',
  'Client Stories',
];

export function createBlankPortfolio(): PortfolioProject {
  return {
    id: uid('pf'),
    slug: '',
    title: '',
    category: 'Bridal',
    summary: '',
    story: [''],
    year: String(new Date().getFullYear()),
    location: 'Kurnool',
    bannerImage: '',
    bannerAlt: '',
    coverImage: '',
    coverAlt: '',
    gallery: [],
    tags: [],
    ctaLabel: 'Request similar look',
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

export interface PortfolioMetricsData {
  total: number;
  published: number;
  drafts: number;
  clientStories: number;
}
