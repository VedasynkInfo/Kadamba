import { describe, expect, it } from 'vitest';
import { getLocality, LOCALITIES, serviceLabels } from '../data';

const SERVICE_SLUGS = new Set([
  'bridal-wear',
  'traditional-wear',
  'custom-tailoring',
  'boutique-styling',
]);

describe('locality content', () => {
  it('has a unique slug for every place', () => {
    const slugs = LOCALITIES.map((locality) => locality.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it('gives every locality the copy its page renders', () => {
    for (const locality of LOCALITIES) {
      expect(locality.name.trim()).not.toBe('');
      expect(locality.tagline.trim()).not.toBe('');
      expect(locality.intro.length).toBeGreaterThan(0);
      expect(locality.intro.every((paragraph) => paragraph.trim().length > 0)).toBe(true);
      expect(locality.visit.trim()).not.toBe('');
      expect(locality.covers.length).toBeGreaterThan(0);
      expect(locality.image.startsWith('/media/')).toBe(true);
      expect(locality.imageAlt.trim()).not.toBe('');
    }
  });

  it('only links to services that exist', () => {
    for (const locality of LOCALITIES) {
      for (const slug of locality.serviceSlugs) {
        expect(SERVICE_SLUGS.has(slug), `${locality.slug} links to ${slug}`).toBe(true);
        expect(serviceLabels[slug], `${slug} needs a label`).toBeTruthy();
      }
    }
  });

  it('gives every FAQ a unique id and a real answer', () => {
    for (const locality of LOCALITIES) {
      const ids = locality.faqs.map((faq) => faq.id);
      expect(new Set(ids).size, `${locality.slug} has duplicate FAQ ids`).toBe(ids.length);
      for (const faq of locality.faqs) {
        expect(faq.question.trim().length).toBeGreaterThan(8);
        expect(faq.answer.trim().length).toBeGreaterThan(20);
      }
    }
  });

  it('looks a locality up by slug', () => {
    expect(getLocality('adoni')?.name).toBe('Adoni');
    expect(getLocality('missing')).toBeUndefined();
    expect(getLocality(undefined)).toBeUndefined();
  });
});
