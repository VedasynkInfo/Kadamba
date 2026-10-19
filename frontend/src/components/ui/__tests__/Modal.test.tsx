import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Modal } from '@/components/ui/Modal';

afterEach(cleanup);

/**
 * `cleanup` is explicit because this suite runs without testing globals, so
 * Testing Library cannot register its own auto-cleanup.
 */
describe('Modal', () => {
  it('calls onClose when Escape is pressed', async () => {
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose} title="Delete order">
        Body
      </Modal>,
    );

    fireEvent.keyDown(document.body, { key: 'Escape' });

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it('moves focus inside the dialog when it opens', async () => {
    render(
      <Modal open onClose={() => {}} title="Delete order">
        Body
      </Modal>,
    );

    const dialog = screen.getByRole('dialog');
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));
  });

  it('labels the dialog with its title', () => {
    render(
      <Modal open onClose={() => {}} title="Delete order">
        Body
      </Modal>,
    );

    const dialog = screen.getByRole('dialog');
    const labelledBy = dialog.getAttribute('aria-labelledby');

    expect(labelledBy).toBeTruthy();
    expect(document.getElementById(labelledBy as string)?.textContent).toBe('Delete order');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
  });

  it('closes from the close button and renders nothing while closed', () => {
    const onClose = vi.fn();
    const { rerender } = render(
      <Modal open onClose={onClose} title="Delete order">
        Body
      </Modal>,
    );

    fireEvent.click(screen.getByRole('button', { name: /close dialog/i }));
    expect(onClose).toHaveBeenCalledTimes(1);

    rerender(
      <Modal open={false} onClose={onClose} title="Delete order">
        Body
      </Modal>,
    );
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('returns focus to the element that opened it', async () => {
    function Harness() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            Open
          </button>
          <Modal open={open} onClose={() => setOpen(false)} title="Delete order">
            Body
          </Modal>
        </>
      );
    }

    render(<Harness />);

    const opener = screen.getByRole('button', { name: 'Open' });
    opener.focus();
    fireEvent.click(opener);

    await screen.findByRole('button', { name: /close dialog/i });
    fireEvent.keyDown(document.body, { key: 'Escape' });

    await waitFor(() => expect(document.activeElement).toBe(opener));
  });
});
