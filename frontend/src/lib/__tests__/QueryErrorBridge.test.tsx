import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { ToastProvider } from '@/components/ui';
import { QueryErrorBridge } from '../QueryErrorBridge';
import { reportQueryError } from '../queryClient';
import type { AppError } from '../apiError';

afterEach(cleanup);

function errorWith(overrides: Partial<AppError>): AppError {
  return {
    code: 'INTERNAL',
    status: 500,
    message: 'Something broke on the server.',
    fieldErrors: [],
    ...overrides,
  };
}

function renderBridge() {
  render(
    <ToastProvider>
      <QueryErrorBridge />
    </ToastProvider>,
  );
}

describe('QueryErrorBridge', () => {
  it('reports an ordinary failure once', async () => {
    renderBridge();

    reportQueryError({ error: errorWith({}), queryKey: ['leads'] });

    await waitFor(() => expect(screen.getByText('Something went wrong')).toBeTruthy());
  });

  it('says what a conflict is, and offers a way out', async () => {
    renderBridge();

    reportQueryError({
      error: errorWith({ code: 'CONFLICT', status: 409, message: 'That change conflicts.' }),
      queryKey: ['orders', '42'],
    });

    await waitFor(() => expect(screen.getByText('Someone else changed this')).toBeTruthy());
    expect(screen.getByText('Refresh')).toBeTruthy();
  });

  it('collapses two identical failures into one', async () => {
    renderBridge();

    const error = errorWith({ code: 'NETWORK', status: 0, message: 'You appear to be offline.' });
    reportQueryError({ error, queryKey: ['a'] });
    reportQueryError({ error, queryKey: ['b'] });

    await waitFor(() => expect(screen.getAllByText('Something went wrong')).toHaveLength(1));
  });
});
