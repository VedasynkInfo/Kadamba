import type { ServiceCategory, ServiceDetail, ServiceIcon } from '@/pages/services/data';
import { uid } from '../hooks/useLocalCollection';

export const SERVICE_CATEGORIES: ServiceCategory[] = ['Bridal', 'Traditional', 'Tailoring', 'Boutique'];
export const SERVICE_ICONS: ServiceIcon[] = ['bridal', 'traditional', 'tailoring', 'boutique'];

export function createBlankService(): ServiceDetail {
  return {
    id: uid('svc'),
    slug: '',
    title: '',
    category: 'Bridal',
    summary: '',
    description: [''],
    bannerImage: '',
    bannerAlt: '',
    cardImage: '',
    icon: 'bridal',
    gallery: [],
    features: [],
    pricing: {
      note: 'Quoted after consultation.',
      startingFrom: '',
      tiers: [],
    },
    includes: [],
    durationNote: '',
    ctaLabel: 'Request consultation',
    published: true,
    isFulfillable: false,
    linkedProductTypeIds: [],
    defaultLeadTimeDays: undefined,
    basePriceFrom: undefined,
    tags: [],
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

export interface ServicesMetricsData {
  total: number;
  published: number;
  drafts: number;
  fulfillable: number;
}
