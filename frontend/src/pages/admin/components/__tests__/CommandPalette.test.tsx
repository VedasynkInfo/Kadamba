import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CommandPalette } from '../CommandPalette';

const user = {
  role: 'admin',
  permissions: ['orders:read', 'leads:read', 'customers:read', 'content:write'],
};

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user, logout: () => {} }),
}));

afterEach(cleanup);

function LocationProbe() {
  const location = useLocation();
  return <span data-testid="path">{location.pathname}</span>;
}

function renderPalette() {
  return render(
    <MemoryRouter initialEntries={['/admin']}>
      <LocationProbe />
      <CommandPalette open onOpenChange={() => {}} />
    </MemoryRouter>,
  );
}

describe('CommandPalette', () => {
  it('lists the desks a user may open', async () => {
    renderPalette();

    await waitFor(() => expect(screen.getByText('Dashboard')).toBeTruthy());
    expect(screen.getByText('Leads')).toBeTruthy();
    expect(screen.getByText('Customers')).toBeTruthy();
  });

  it('offers the four things a studio makes', async () => {
    renderPalette();

    await waitFor(() => expect(screen.getByText('New order')).toBeTruthy());
    expect(screen.getByText('New lead')).toBeTruthy();
    expect(screen.getByText('New customer')).toBeTruthy();
    expect(screen.getByText('New fitting')).toBeTruthy();
  });

  it('is a dialog with a name, so a screen reader announces it', async () => {
    renderPalette();

    const dialog = await screen.findByRole('dialog');
    expect(dialog.getAttribute('aria-label') ?? dialog.getAttribute('aria-labelledby')).toBeTruthy();
  });
});
