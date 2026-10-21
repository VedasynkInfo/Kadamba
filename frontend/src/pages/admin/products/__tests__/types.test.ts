import { describe, expect, it } from 'vitest';
import type { ProductType } from '@/services/products/productService';
import {
  blankProduct,
  formToPayload,
  productToForm,
  templateChanged,
  validateProductForm,
} from '../types';

const product = {
  id: 'p1',
  code: 'BR-LH',
  slug: 'bridal-lehenga',
  name: 'Bridal Lehenga',
  categoryId: { id: 'c1', code: 'BRIDAL', name: 'Bridal' },
  measurementTemplateId: 't1',
  measurementTemplate: {
    id: 't1',
    code: 'BR-LH',
    name: 'Bridal Lehenga',
    category: 'Bridal Collection',
    active: true,
    version: 1,
    fieldDefs: [],
  },
  gallery: [{ id: 'img-1', url: '/uploads/one.jpg', alt: 'One' }],
  variants: [],
  tags: ['bridal'],
  featured: true,
  active: true,
  sortOrder: 3,
  defaultStages: [],
  image: '/uploads/cover.jpg',
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
} as ProductType;

describe('product editor form', () => {
  it('keeps a legacy cover visible in the gallery editor', () => {
    const form = productToForm(product);

    expect(form.image).toBe('/uploads/cover.jpg');
    expect(form.gallery[0]).toEqual({ id: 'legacy-cover', url: '/uploads/cover.jpg', alt: '' });
    expect(form.gallery[1].id).toBe('img-1');
  });

  it('does not duplicate a cover already present in the gallery', () => {
    const form = productToForm({ ...product, image: '/uploads/one.jpg' });

    expect(form.gallery).toHaveLength(1);
    expect(form.image).toBe('/uploads/one.jpg');
  });

  it('converts blank optional fields to null instead of stale values', () => {
    const form = blankProduct('c1', 7);
    form.code = ' br-new ';
    form.name = ' New Piece ';
    form.measurementTemplateId = '';
    form.leadTimeDays = '';

    const payload = formToPayload(form);

    expect(payload.code).toBe('BR-NEW');
    expect(payload.name).toBe('New Piece');
    expect(payload.measurementTemplateId).toBeNull();
    expect(payload.leadTimeDays).toBeNull();
    expect(payload.seo).toBeNull();
    expect(payload.image).toBeNull();
    expect(payload.sortOrder).toBe(7);
  });

  it('reports field errors before a save', () => {
    const form = blankProduct();
    form.leadTimeDays = '-2';

    const errors = validateProductForm(form);

    expect(errors.code).toBeTruthy();
    expect(errors.name).toBeTruthy();
    expect(errors.categoryId).toBeTruthy();
    expect(errors.leadTimeDays).toBeTruthy();
  });

  it('detects a fit-card change, including unlinking', () => {
    const form = productToForm(product);
    expect(templateChanged(form, product)).toBe(false);

    form.measurementTemplateId = '';
    expect(templateChanged(form, product)).toBe(true);
  });
});
