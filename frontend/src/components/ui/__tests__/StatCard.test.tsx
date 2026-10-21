import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { ReactElement } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { StatCard } from '@/components/ui';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const renderCard = (card: ReactElement) =>
  render(<MemoryRouter>{card}</MemoryRouter>);

describe('StatCard', () => {
  it('renders a string figure as written, with its label, sub and link', () => {
    renderCard(
      <StatCard label="Revenue (MTD)" value="₹1,23,456" sub="Balance ₹2,000" href="/admin/finance" />,
    );

    expect(screen.getByText('Revenue (MTD)')).toBeTruthy();
    expect(screen.getByText('₹1,23,456')).toBeTruthy();
    expect(screen.getByText('Balance ₹2,000')).toBeTruthy();
    expect(screen.getByRole('link').getAttribute('href')).toBe('/admin/finance');
  });

  it('arrives at a numeric figure instead of printing the raw prop', async () => {
    vi.spyOn(window, 'matchMedia').mockImplementation(
      (query) =>
        ({
          matches: true,
          media: query,
          onchange: null,
          addListener: () => {},
          removeListener: () => {},
          addEventListener: () => {},
          removeEventListener: () => {},
          dispatchEvent: () => false,
        }) as unknown as MediaQueryList,
    );

    renderCard(<StatCard label="Open Leads" value={42} />);

    expect(await screen.findByText('42')).toBeTruthy();
  });

  it('draws a sparkline only when the series has a shape', () => {
    const withLine = renderCard(<StatCard label="Open Leads" value={7} sparkline={[1, 4, 7]} />);
    expect(withLine.container.querySelector('svg')).toBeTruthy();
    withLine.unmount();

    const withoutLine = renderCard(<StatCard label="Open Leads" value={7} sparkline={[7]} />);
    expect(withoutLine.container.querySelector('svg')).toBeNull();
  });
});
