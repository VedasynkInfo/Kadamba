import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { createMemoryRouter, RouterProvider, Link } from 'react-router-dom';
import { afterEach, describe, expect, it } from 'vitest';
import { RouterShell } from '@/components/layout/RouterShell';

function Page({ name, next }: { name: string; next?: string }) {
  return (
    <div>
      <main id="main-content" tabIndex={-1}>
        {name}
      </main>
      {next ? <Link to={next}>Go to {next}</Link> : null}
    </div>
  );
}

const router = createMemoryRouter(
  [
    {
      element: <RouterShell />,
      children: [
        { path: '/first', element: <Page name="First" next="/second" /> },
        { path: '/second', element: <Page name="Second" /> },
      ],
    },
  ],
  { initialEntries: ['/first'] },
);

afterEach(cleanup);

describe('route focus', () => {
  it('moves focus to the new main region after a client-side navigation', async () => {
    render(<RouterProvider router={router} />);

    await waitFor(() => expect(screen.getByText('First')).toBeTruthy());

    // The first paint must not steal focus from the page the user loaded.
    expect(document.activeElement).not.toBe(document.getElementById('main-content'));

    await act(async () => {
      screen.getByRole('link', { name: /go to \/second/i }).click();
    });

    await waitFor(() => expect(screen.getByText('Second')).toBeTruthy());
    expect(document.activeElement).toBe(document.getElementById('main-content'));
  });
});
