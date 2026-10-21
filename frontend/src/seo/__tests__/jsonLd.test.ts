import { describe, expect, it } from 'vitest';
import { faqJsonLd, itemListJsonLd, productJsonLd } from '../JsonLd';

describe('structured data', () => {
  const product = {
    name: 'Bridal Lehenga',
    description: 'Hand-finished bridal lehenga.',
    path: '/products/bridal-lehenga',
    priceRange: '₹45,000 - ₹90,000',
  };

  it('turns an indicative price range into a valid aggregate offer', () => {
    const data = productJsonLd(product);
    const offers = data.offers as Record<string, unknown>;

    expect(offers['@type']).toBe('AggregateOffer');
    expect(offers.lowPrice).toBe(45_000);
    expect(offers.highPrice).toBe(90_000);
    expect(offers.priceCurrency).toBe('INR');
    expect(data.url).toContain('/products/bridal-lehenga');
  });

  it('omits offers when the range has no numeric price', () => {
    const data = productJsonLd({ ...product, priceRange: 'On request' });
    expect(data).not.toHaveProperty('offers');
  });

  it('mirrors the FAQ copy rendered on the page', () => {
    const data = faqJsonLd([{ question: 'Are pieces ready to wear?', answer: 'No.' }]);
    const questions = data.mainEntity as Array<Record<string, unknown>>;

    expect(questions).toHaveLength(1);
    expect(questions[0].name).toBe('Are pieces ready to wear?');
    expect((questions[0].acceptedAnswer as Record<string, unknown>).text).toBe('No.');
  });

  it('lists catalogue entries in order', () => {
    const data = itemListJsonLd({
      name: 'Kadamba collection',
      items: [
        { name: 'Bridal Lehenga', path: '/products/bridal-lehenga' },
        { name: 'Festive Kurti', path: '/products/festive-kurti' },
      ],
    });
    const items = data.itemListElement as Array<Record<string, unknown>>;

    expect(data.numberOfItems).toBe(2);
    expect(items[1].position).toBe(2);
    expect(items[1].url).toContain('/products/festive-kurti');
  });
});
