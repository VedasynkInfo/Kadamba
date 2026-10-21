import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { OrderCreateModal } from '@/pages/admin/orders/OrderCreateModal';
import { createBlankOrderForm } from '@/pages/admin/orders/types';

const defaults = createBlankOrderForm();

afterEach(cleanup);

function renderWizard(onSave = vi.fn().mockResolvedValue(undefined)) {
  render(
    <OrderCreateModal
      open
      onClose={() => {}}
      defaultValues={defaults}
      onSave={onSave}
      submitting={false}
      customerSearch=""
      onCustomerSearchChange={() => {}}
      customerResults={[]}
      searchingCustomers={false}
    />,
  );
  return onSave;
}

const continueButton = () => screen.getByRole('button', { name: /^continue$/i });

describe('OrderCreateModal wizard', () => {
  it('will not leave the client step until the title and customer are valid', async () => {
    renderWizard();

    fireEvent.click(continueButton());

    expect(await screen.findByText(/Give the order a title of at least 3 characters/)).toBeTruthy();
    expect(screen.getByText(/Step 1 of 3/)).toBeTruthy();
  });

  it('walks the three steps and submits the validated order', async () => {
    const onSave = renderWizard();

    fireEvent.change(screen.getByLabelText(/Order Project Title/), {
      target: { value: 'Sravani Bridal Lehenga' },
    });
    fireEvent.click(screen.getByRole('button', { name: /\+ new customer/i }));
    fireEvent.change(screen.getByLabelText(/Client Name/), {
      target: { value: 'Sravani Reddy' },
    });
    fireEvent.change(screen.getByLabelText(/Phone Number/), {
      target: { value: '9876543210' },
    });

    fireEvent.click(continueButton());
    expect(await screen.findByText(/Step 2 of 3/)).toBeTruthy();

    fireEvent.change(screen.getByLabelText(/Garment Description/), {
      target: { value: 'Bridal Lehenga' },
    });
    fireEvent.click(continueButton());
    expect(await screen.findByText(/Step 3 of 3/)).toBeTruthy();

    fireEvent.change(screen.getByLabelText(/Total Quoted Price/), {
      target: { value: '50000' },
    });
    fireEvent.change(screen.getByLabelText(/Advance Received/), {
      target: { value: '10000' },
    });

    fireEvent.click(screen.getByRole('button', { name: /create production order/i }));

    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave.mock.calls[0][0]).toMatchObject({
      title: 'Sravani Bridal Lehenga',
      customerMode: 'create',
      newCustName: 'Sravani Reddy',
      totalQuoted: '50000',
      advance: '10000',
      lineItems: [{ name: 'Bridal Lehenga', qty: 1 }],
    });
  });

  it('does not allow jumping ahead over an invalid step', async () => {
    renderWizard();

    fireEvent.click(screen.getByRole('button', { name: /3\. pricing/i }));

    expect(await screen.findByText(/Give the order a title of at least 3 characters/)).toBeTruthy();
    expect(screen.getByText(/Step 1 of 3/)).toBeTruthy();
  });
});
