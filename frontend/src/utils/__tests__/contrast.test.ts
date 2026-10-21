import { describe, expect, it } from 'vitest';
import { contrastRatio, hexToRgb, mixHex, readableOn, relativeLuminance } from '@/utils/contrast';

describe('contrastRatio', () => {
  it('knows the extremes', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0);
    expect(contrastRatio('#123456', '#123456')).toBeCloseTo(1, 5);
  });

  it('expands short hex and ignores case', () => {
    expect(hexToRgb('#fff')).toEqual({ r: 255, g: 255, b: 255 });
    expect(contrastRatio('#FFF', '#000')).toBeCloseTo(21, 0);
  });

  it('puts mid grey around 4.6:1 against black and 4.5:1 against white', () => {
    expect(contrastRatio('#777777', '#000000')).toBeGreaterThan(4.4);
    expect(contrastRatio('#777777', '#ffffff')).toBeLessThan(4.7);
  });
});

describe('relativeLuminance', () => {
  it('is 0 for black and 1 for white', () => {
    expect(relativeLuminance('#000000')).toBe(0);
    expect(relativeLuminance('#ffffff')).toBeCloseTo(1, 5);
  });
});

describe('mixHex', () => {
  it('returns the endpoints at 0 and 1', () => {
    expect(mixHex('#000000', '#ffffff', 0)).toBe('#000000');
    expect(mixHex('#000000', '#ffffff', 1)).toBe('#ffffff');
  });

  it('walks the middle', () => {
    expect(mixHex('#000000', '#ffffff', 0.5)).toBe('#808080');
  });
});

describe('readableOn', () => {
  it('leaves a passing colour alone', () => {
    expect(readableOn('#fffdd0', '#8a6d2f')).toBe('#8a6d2f');
  });

  it('darkens a bright accent on a light surface until it passes', () => {
    const result = readableOn('#fffdd0', '#ffd700');

    expect(result).not.toBe('#ffd700');
    expect(contrastRatio(result, '#fffdd0')).toBeGreaterThanOrEqual(4.5);
  });

  it('lightens a dark accent on a dark surface until it passes', () => {
    const result = readableOn('#0b0f17', '#8a6d2f');

    expect(result).not.toBe('#8a6d2f');
    expect(contrastRatio(result, '#0b0f17')).toBeGreaterThanOrEqual(4.5);
  });

  it('always finds an answer, even for a mid-grey surface', () => {
    const result = readableOn('#777777', '#777777');

    expect(contrastRatio(result, '#777777')).toBeGreaterThanOrEqual(4.5);
  });
});
