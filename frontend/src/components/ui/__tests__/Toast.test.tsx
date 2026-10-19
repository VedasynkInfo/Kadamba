import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { ToastProvider, useToast } from '../Toast';

afterEach(cleanup);

function Probe() {
  const { toast, promise } = useToast();
  const [value, setValue] = useState('idle');

  return (
    <div>
      <button
        type="button"
        onClick={() =>
          toast({ title: 'Saved', description: 'The order is on the board.', tone: 'success' })
        }
      >
        show
      </button>
      <button
        type="button"
        onClick={() =>
          void promise(
            Promise.resolve('done'),
            { loading: 'Saving…', success: 'Saved', error: 'Failed' },
          ).then(setValue)
        }
      >
        save
      </button>
      <span data-testid="value">{value}</span>
    </div>
  );
}

describe('toast', () => {
  it('shows the title and description it was given', async () => {
    render(
      <ToastProvider>
        <Probe />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByText('show'));

    await waitFor(() => expect(screen.getByText('Saved')).toBeTruthy());
    expect(screen.getByText('The order is on the board.')).toBeTruthy();
  });

  it('resolves the promise it was given', async () => {
    render(
      <ToastProvider>
        <Probe />
      </ToastProvider>,
    );

    fireEvent.click(screen.getByText('save'));

    await waitFor(() => expect(screen.getByTestId('value').textContent).toBe('done'));
  });
});
