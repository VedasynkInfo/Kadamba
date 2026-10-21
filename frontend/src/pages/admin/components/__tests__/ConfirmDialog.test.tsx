import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ComponentProps } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ConfirmDialog } from '@/pages/admin/components/ConfirmDialog';

afterEach(cleanup);

function renderDialog(overrides: Partial<ComponentProps<typeof ConfirmDialog>> = {}) {
  const onConfirm = vi.fn();
  const onCancel = vi.fn();

  render(
    <ConfirmDialog
      open
      title="Delete this testimonial?"
      description="It will disappear from the public site immediately."
      confirmLabel="Delete"
      onConfirm={onConfirm}
      onCancel={onCancel}
      {...overrides}
    />,
  );

  return { onConfirm, onCancel };
}

describe('ConfirmDialog', () => {
  it('is a real dialog and describes itself to assistive technology', async () => {
    renderDialog();

    const dialog = await screen.findByRole('dialog');
    const describedBy = dialog.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy ?? '')?.textContent).toContain(
      'disappear from the public site',
    );
  });

  it('cancels on Escape — the keyboard contract a hand-rolled overlay lacked', async () => {
    const { onCancel } = renderDialog();
    await screen.findByRole('dialog');

    fireEvent.keyDown(document, { key: 'Escape' });

    await waitFor(() => expect(onCancel).toHaveBeenCalled());
  });

  it('runs the confirmed action', async () => {
    const { onConfirm } = renderDialog();
    await screen.findByRole('dialog');

    fireEvent.click(screen.getByRole('button', { name: /^delete$/i }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });
});
