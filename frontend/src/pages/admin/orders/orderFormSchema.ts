import { z } from 'zod';
import type { FieldPath } from 'react-hook-form';
import type { GlyphName } from '@/components/icons';
import type { OrderFormData } from './types';

const dateField = z
  .string()
  .refine((value) => value === '' || !Number.isNaN(Date.parse(value)), 'Enter a real date');

const moneyField = z
  .string()
  .refine(
    (value) => value.trim() !== '' && Number.isFinite(Number(value)) && Number(value) >= 0,
    'Enter an amount of zero or more',
  );

const lineItemSchema = z.object({
  name: z.string().trim().min(2, 'Name the garment').max(120, 'Keep the name under 120 characters'),
  productTypeCode: z.string(),
  notes: z.string().max(2000, 'Keep the notes under 2000 characters'),
  qty: z.coerce.number().int('Use a whole number').min(1, 'At least one').max(50, 'Fifty at most'),
});

const selectedCustomerSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    phone: z.string(),
    email: z.string().optional(),
    city: z.string().optional(),
    notes: z.string().optional(),
    createdAt: z.string(),
  })
  .nullable();

export const orderFormSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, 'Give the order a title of at least 3 characters')
      .max(200, 'Keep the title under 200 characters'),
    priority: z.enum(['normal', 'high', 'rush']),
    status: z.string(),
    expectedTrialAt: dateField,
    expectedDeliveryAt: dateField,
    totalQuoted: moneyField,
    advance: moneyField,
    initialNotes: z.string().max(2000, 'Keep the notes under 2000 characters'),
    tagsInput: z.string().max(300, 'Keep the tags under 300 characters'),
    lineItems: z.array(lineItemSchema).min(1, 'Add at least one garment'),
    customerMode: z.enum(['search', 'create']),
    selectedCustomer: selectedCustomerSchema,
    newCustName: z.string(),
    newCustPhone: z.string(),
    newCustEmail: z.string(),
    newCustCity: z.string(),
    newCustNotes: z.string(),
  })
  .superRefine((form, ctx) => {
    if (form.customerMode === 'search' && !form.selectedCustomer) {
      ctx.addIssue({
        code: 'custom',
        path: ['selectedCustomer'],
        message: 'Choose a customer, or switch to “New Customer”',
      });
    }

    if (form.customerMode === 'create') {
      if (form.newCustName.trim().length < 2) {
        ctx.addIssue({ code: 'custom', path: ['newCustName'], message: 'Enter the client’s name' });
      }
      const digits = form.newCustPhone.replace(/\D/g, '');
      if (digits.length < 10 || digits.length > 12) {
        ctx.addIssue({
          code: 'custom',
          path: ['newCustPhone'],
          message: 'Enter a 10-digit mobile number',
        });
      }
      if (form.newCustEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.newCustEmail.trim())) {
        ctx.addIssue({
          code: 'custom',
          path: ['newCustEmail'],
          message: 'Enter a valid email address',
        });
      }
    }

    if (Number(form.advance) > Number(form.totalQuoted)) {
      ctx.addIssue({
        code: 'custom',
        path: ['advance'],
        message: 'The advance cannot be more than the quote',
      });
    }

    if (
      form.expectedTrialAt &&
      form.expectedDeliveryAt &&
      Date.parse(form.expectedDeliveryAt) < Date.parse(form.expectedTrialAt)
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['expectedDeliveryAt'],
        message: 'Delivery cannot be before the trial',
      });
    }
  });

/**
 * The three questions the intake form asks, in order.
 *
 * The field lists are the gate: a step may only advance once its own fields
 * pass, so the final Create can never fail for something the user could have
 * been told two screens earlier.
 */
export const ORDER_WIZARD_STEPS: Array<{
  id: 'client' | 'items' | 'pricing';
  label: string;
  icon: GlyphName;
  fields: FieldPath<OrderFormData>[];
}> = [
  {
    id: 'client',
    label: 'Client & Dates',
    icon: 'user',
    fields: [
      'title',
      'customerMode',
      'selectedCustomer',
      'newCustName',
      'newCustPhone',
      'newCustEmail',
      'newCustCity',
      'expectedTrialAt',
      'expectedDeliveryAt',
    ],
  },
  {
    id: 'items',
    label: 'Garments',
    icon: 'stitching',
    fields: ['lineItems'],
  },
  {
    id: 'pricing',
    label: 'Pricing & Priority',
    icon: 'premium',
    fields: ['totalQuoted', 'advance', 'priority', 'tagsInput', 'initialNotes'],
  },
];

export type OrderFormValues = z.infer<typeof orderFormSchema>;
