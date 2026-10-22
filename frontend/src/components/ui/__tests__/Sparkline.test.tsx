import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { Sparkline } from '@/components/ui/Sparkline';
import { trendOf } from '@/utils/trend';

afterEach(cleanup);

const svgOf = (container: HTMLElement) => container.querySelector('svg');

describe('Sparkline', () => {
  it('draws nothing for a series too short to have a shape', () => {
    const { container } = render(<Sparkline values={[3]} />);
    expect(svgOf(container)).toBeNull();
  });

  it('draws one point per value, plus a closed area under the line', () => {
    const { container } = render(<Sparkline values={[0, 5, 10]} />);
    const paths = container.querySelectorAll('path');

    expect(paths).toHaveLength(2);
    expect(paths[0].getAttribute('d')).toBe(
      'M 0.00,24.00 L 50.00,14.00 L 100.00,4.00 L 100,26 L 0,26 Z',
    );
    expect(paths[1].getAttribute('d')).toBe('M 0.00,24.00 L 50.00,14.00 L 100.00,4.00');
  });

  it('reads the trend from the series and colours the line', () => {
    const up = render(<Sparkline values={[1, 2, 3]} />);
    expect(svgOf(up.container)?.getAttribute('class')).toContain('text-emerald-400');
    up.unmount();

    const down = render(<Sparkline values={[3, 2, 1]} />);
    expect(svgOf(down.container)?.getAttribute('class')).toContain('text-rose-700');
    down.unmount();

    const flat = render(<Sparkline values={[2, 2, 2]} />);
    expect(svgOf(flat.container)?.getAttribute('class')).toContain('text-brand-strong');
  });

  it('keeps an explicit trend override', () => {
    const { container } = render(<Sparkline values={[1, 2, 3]} trend="down" />);
    expect(svgOf(container)?.getAttribute('class')).toContain('text-rose-700');
  });

  it('hides the decoration from assistive technology', () => {
    const { container } = render(<Sparkline values={[1, 2]} />);
    expect(svgOf(container)?.getAttribute('aria-hidden')).toBe('true');
  });

  describe('trendOf', () => {
    it('is flat for a short or steady series', () => {
      expect(trendOf([1])).toBe('flat');
      expect(trendOf([])).toBe('flat');
      expect(trendOf([0, 0, 0])).toBe('flat');
    });

    it('ignores a change too small to be a trend', () => {
      expect(trendOf([1000, 1001])).toBe('flat');
    });

    it('reports direction, not size', () => {
      expect(trendOf([2, 3])).toBe('up');
      expect(trendOf([3, 2])).toBe('down');
      expect(trendOf([0, 50])).toBe('up');
    });
  });
});
