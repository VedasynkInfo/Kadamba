import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { useCreateIntent } from '../useCreateIntent';

afterEach(cleanup);

function Desk() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  useCreateIntent(setOpen);
  return (
    <div>
      <span data-testid="open">{open ? 'open' : 'closed'}</span>
      <span data-testid="search">{location.search}</span>
    </div>
  );
}

describe('useCreateIntent', () => {
  it('opens the create form when the palette asked for it', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/orders?new=1']}>
        <Desk />
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByTestId('open').textContent).toBe('open'));
  });

  it('drops the intent so a refresh does not reopen the form', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/orders?new=1']}>
        <Desk />
      </MemoryRouter>,
    );

    await waitFor(() => expect(screen.getByTestId('search').textContent).toBe(''));
  });

  it('leaves a desk alone when there is no intent', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/orders']}>
        <Desk />
      </MemoryRouter>,
    );

    expect(screen.getByTestId('open').textContent).toBe('closed');
  });
});
