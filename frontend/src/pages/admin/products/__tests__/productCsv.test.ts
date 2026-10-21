import { describe, expect, it } from 'vitest';
import type { ProductType } from '@/services/products/productService';
import { parseProductCsv, productsToCsv } from '../productCsv';

describe('product CSV', () => {
  it('parses quoted commas, newlines and doubled quotes', () => {
    const csv = [
      'code,name,category,description',
      'BR-LH,"Bridal, Lehenga",BRIDAL,"Line one',
      'Line two with a ""quoted"" word"',
      '',
      'BL-MG,Maggam Blouse,BLOUSES,Hand work',
    ].join('\r\n');

    const parsed = parseProductCsv(csv);

    expect(parsed.headers).toEqual(['code', 'name', 'category', 'description']);
    expect(parsed.rows).toHaveLength(2);
    expect(parsed.rows[0].row).toBe(2);
    expect(parsed.rows[0].values).toEqual({
      code: 'BR-LH',
      name: 'Bridal, Lehenga',
      category: 'BRIDAL',
      description: 'Line one\nLine two with a "quoted" word',
    });
    expect(parsed.rows[1].values.code).toBe('BL-MG');
  });

  it('normalises friendly spreadsheet headers', () => {
    const parsed = parseProductCsv(
      'Code,Title,Category Code,Template Code,Price Range,Lead Time Days\nBR-LH,Bridal Lehenga,BRIDAL,BR-LH,"Rs 45,000",45',
    );

    expect(parsed.rows[0].values).toMatchObject({
      code: 'BR-LH',
      name: 'Bridal Lehenga',
      category: 'BRIDAL',
      template: 'BR-LH',
      priceRange: 'Rs 45,000',
      leadTimeDays: '45',
    });
  });

  it('rejects an unterminated quoted field', () => {
    expect(() => parseProductCsv('code,name\nBR-LH,"unfinished')).toThrow(
      'unterminated quoted field',
    );
  });

  it('exports every editable product field with escaped values', () => {
    const product = {
      id: 'p1',
      code: 'BR-LH',
      slug: 'bridal-lehenga',
      name: 'Bridal, Lehenga',
      categoryId: { id: 'c1', code: 'BRIDAL', name: 'Bridal' },
      description: 'Internal',
      publicDescription: 'A "made to measure" piece',
      measurementTemplateId: 't1',
      measurementTemplate: {
        id: 't1',
        code: 'BR-LH',
        name: 'Bridal Lehenga',
        category: 'Bridal',
        active: true,
        version: 1,
        fieldDefs: [],
      },
      gallery: [{ id: 'img-1', url: '/uploads/a.jpg', alt: 'Front' }],
      variants: [{ id: 'v1', name: 'Sleeve', active: true }],
      leadTimeDays: 45,
      leadTimeNote: 'After fitting',
      tags: ['bridal', 'handwork'],
      featured: true,
      seo: { metaTitle: 'Bridal lehenga' },
      active: true,
      sortOrder: 2,
      indicativePriceRange: 'Rs 45,000',
      defaultStages: [],
      image: '/uploads/a.jpg',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    } as ProductType;

    const csv = productsToCsv([product]);
    const parsed = parseProductCsv(csv);

    expect(parsed.rows).toHaveLength(1);
    expect(parsed.rows[0].values).toMatchObject({
      code: 'BR-LH',
      name: 'Bridal, Lehenga',
      category: 'BRIDAL',
      template: 'BR-LH',
      publicDescription: 'A "made to measure" piece',
      tags: 'bridal;handwork',
      featured: 'true',
      active: 'true',
      leadTimeDays: '45',
    });
    expect(JSON.parse(parsed.rows[0].values.gallery)).toHaveLength(1);
    expect(JSON.parse(parsed.rows[0].values.variants)[0].name).toBe('Sleeve');
    expect(JSON.parse(parsed.rows[0].values.seo).metaTitle).toBe('Bridal lehenga');
  });
});
