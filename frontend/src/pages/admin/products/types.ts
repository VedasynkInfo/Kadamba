import type {
  ProductGalleryImage,
  ProductPayload,
  ProductSeo,
  ProductType,
  ProductVariant,
} from '@/services/products/productService';
import type { SeoFieldsValue } from '../components/SeoFields';

export interface ProductFormState {
  code: string;
  name: string;
  slug: string;
  categoryId: string;
  description: string;
  publicDescription: string;
  measurementTemplateId: string;
  indicativePriceRange: string;
  leadTimeDays: string;
  leadTimeNote: string;
  tags: string[];
  featured: boolean;
  active: boolean;
  sortOrder: number;
  image: string;
  gallery: ProductGalleryImage[];
  variants: ProductVariant[];
  seo: SeoFieldsValue;
}

export type ProductEditorTab = 'story' | 'gallery' | 'variants' | 'seo';

export function blankProduct(categoryId = '', sortOrder = 0): ProductFormState {
  return {
    code: '',
    name: '',
    slug: '',
    categoryId,
    description: '',
    publicDescription: '',
    measurementTemplateId: '',
    indicativePriceRange: '',
    leadTimeDays: '',
    leadTimeNote: '',
    tags: [],
    featured: false,
    active: true,
    sortOrder,
    image: '',
    gallery: [],
    variants: [],
    seo: {
      metaTitle: '',
      metaDescription: '',
      ogTitle: '',
      ogDescription: '',
      ogImage: '',
      twitterTitle: '',
      twitterDescription: '',
      twitterImage: '',
    },
  };
}

function emptySeo(seo?: ProductSeo): SeoFieldsValue {
  return {
    metaTitle: seo?.metaTitle ?? '',
    metaDescription: seo?.metaDescription ?? '',
    ogTitle: seo?.ogTitle ?? '',
    ogDescription: seo?.ogDescription ?? '',
    ogImage: seo?.ogImage ?? '',
    twitterTitle: seo?.twitterTitle ?? '',
    twitterDescription: seo?.twitterDescription ?? '',
    twitterImage: seo?.twitterImage ?? '',
  };
}

export function productToForm(product: ProductType): ProductFormState {
  const gallery = [...(product.gallery ?? [])];
  // A cover uploaded before gallery support lived only in `image`. Keep it
  // visible in the gallery editor so setting another cover cannot lose it.
  if (product.image && !gallery.some((image) => image.url === product.image)) {
    gallery.unshift({ id: 'legacy-cover', url: product.image, alt: '' });
  }

  return {
    code: product.code,
    name: product.name,
    slug: product.slug ?? '',
    categoryId: product.categoryId?.id ?? '',
    description: product.description ?? '',
    publicDescription: product.publicDescription ?? '',
    measurementTemplateId: product.measurementTemplateId ?? '',
    indicativePriceRange: product.indicativePriceRange ?? '',
    leadTimeDays: product.leadTimeDays == null ? '' : String(product.leadTimeDays),
    leadTimeNote: product.leadTimeNote ?? '',
    tags: product.tags ?? [],
    featured: Boolean(product.featured),
    active: product.active,
    sortOrder: product.sortOrder ?? 0,
    image: product.image ?? gallery[0]?.url ?? '',
    gallery,
    variants: (product.variants ?? []).map((variant) => ({ ...variant })),
    seo: emptySeo(product.seo),
  };
}

export function formToPayload(form: ProductFormState): ProductPayload {
  const seo = form.seo;
  const hasSeo = Object.values(seo).some((value) => value.trim() !== '');
  return {
    code: form.code.trim().toUpperCase(),
    name: form.name.trim(),
    slug: form.slug.trim() || undefined,
    categoryId: form.categoryId,
    description: form.description.trim() || null,
    publicDescription: form.publicDescription.trim() || null,
    measurementTemplateId: form.measurementTemplateId || null,
    indicativePriceRange: form.indicativePriceRange.trim() || null,
    leadTimeDays: form.leadTimeDays.trim() === '' ? null : Number(form.leadTimeDays),
    leadTimeNote: form.leadTimeNote.trim() || null,
    tags: form.tags,
    featured: form.featured,
    active: form.active,
    sortOrder: form.sortOrder,
    image: form.image || null,
    gallery: form.gallery,
    variants: form.variants,
    seo: hasSeo ? seo : null,
  };
}

export function validateProductForm(form: ProductFormState): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!form.code.trim()) errors.code = 'Workshop code is required.';
  else if (!/^[A-Z0-9-]+$/.test(form.code.trim().toUpperCase())) {
    errors.code = 'Use uppercase letters, numbers and dashes only.';
  }
  if (!form.name.trim()) errors.name = 'A public product name is required.';
  if (!form.categoryId) errors.categoryId = 'Choose a category.';
  if (form.leadTimeDays.trim() !== '') {
    const days = Number(form.leadTimeDays);
    if (!Number.isFinite(days) || days < 0) {
      errors.leadTimeDays = 'Lead time must be a positive number of days.';
    }
  }
  return errors;
}

export function templateChanged(form: ProductFormState, product: ProductType | null): boolean {
  return (product?.measurementTemplateId ?? '') !== form.measurementTemplateId;
}

export function nextGalleryId(images: ProductGalleryImage[]): string {
  const ids = new Set(images.map((image) => image.id));
  let index = images.length + 1;
  while (ids.has(`img-${index}`)) index += 1;
  return `img-${index}`;
}

export function nextVariantId(variants: ProductVariant[]): string {
  const ids = new Set(variants.map((variant) => variant.id));
  let index = variants.length + 1;
  while (ids.has(`variant-${index}`)) index += 1;
  return `variant-${index}`;
}

export function coverImage(product: ProductType): string | undefined {
  return product.image || product.gallery?.[0]?.url;
}
