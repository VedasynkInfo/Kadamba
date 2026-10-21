import { describe, expect, it } from 'vitest';
import { orderFormSchema } from '@/pages/admin/orders/orderFormSchema';
import { createBlankOrderForm, type OrderFormData } from '@/pages/admin/orders/types';

function validForm(): OrderFormData {
  return {
    ...createBlankOrderForm(),
    title: 'Sravani Bridal Lehenga',
    customerMode: 'create',
    newCustName: 'Sravani Reddy',
    newCustPhone: '98765 43210',
    newCustCity: 'Kurnool',
    totalQuoted: '50000',
    advance: '10000',
    lineItems: [{ name: 'Bridal Lehenga', qty: 1, notes: '', productTypeCode: '' }],
  };
}

function messages(form: unknown) {
  const result = orderFormSchema.safeParse(form);
  return result.success ? [] : result.error.issues.map((issue) => issue.message);
}

describe('orderFormSchema', () => {
  it('accepts a complete new-customer order', () => {
    expect(orderFormSchema.safeParse(validForm()).success).toBe(true);
  });

  it('accepts an existing customer in search mode', () => {
    const form = validForm();
    form.customerMode = 'search';
    form.selectedCustomer = {
      id: 'c1',
      name: 'Sravani',
      phone: '9876543210',
      createdAt: '2026-01-01T00:00:00.000Z',
    };

    expect(orderFormSchema.safeParse(form).success).toBe(true);
  });

  it('requires a title of at least three characters', () => {
    const form = validForm();
    form.title = 'ab';
    expect(messages(form)).toContain('Give the order a title of at least 3 characters');
  });

  it('requires a customer in search mode', () => {
    const form = validForm();
    form.customerMode = 'search';
    form.selectedCustomer = null;

    expect(messages(form)).toContain('Choose a customer, or switch to “New Customer”');
  });

  it('validates a new customer phone and optional email', () => {
    const form = validForm();
    form.newCustPhone = '123';
    form.newCustEmail = 'not-an-email';

    const issues = messages(form);
    expect(issues).toContain('Enter a 10-digit mobile number');
    expect(issues).toContain('Enter a valid email address');
  });

  it('refuses an advance larger than the quote', () => {
    const form = validForm();
    form.advance = '60000';

    expect(messages(form)).toContain('The advance cannot be more than the quote');
  });

  it('refuses a delivery date before the trial', () => {
    const form = validForm();
    form.expectedTrialAt = '2026-11-20';
    form.expectedDeliveryAt = '2026-11-10';

    expect(messages(form)).toContain('Delivery cannot be before the trial');
  });

  it('requires every garment row to be named', () => {
    const form = validForm();
    form.lineItems = [{ name: '', qty: 1, notes: '', productTypeCode: '' }];

    expect(messages(form)).toContain('Name the garment');
  });

  it('rejects a non-numeric quote', () => {
    const form = validForm();
    form.totalQuoted = '';

    expect(messages(form)).toContain('Enter an amount of zero or more');
  });
});
