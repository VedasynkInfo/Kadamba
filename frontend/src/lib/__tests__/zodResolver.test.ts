import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { zodResolver } from '@/lib/zodResolver';

const schema = z.object({
  name: z.string().min(2, 'too short'),
  items: z.array(z.object({ label: z.string().min(1, 'label required') })),
});

const context = {} as Parameters<ReturnType<typeof zodResolver>>[1];

describe('zodResolver', () => {
  it('returns the parsed values when the schema passes', async () => {
    const result = await zodResolver(schema)(
      { name: 'Sravani', items: [{ label: 'Lehenga' }] },
      context,
      { fields: {}, shouldUseNativeValidation: false },
    );

    expect(result.errors).toEqual({});
    expect(result.values).toEqual({ name: 'Sravani', items: [{ label: 'Lehenga' }] });
  });

  it('nests field errors where react-hook-form reads them', async () => {
    const result = await zodResolver(schema)(
      { name: 'S', items: [{ label: '' }] },
      context,
      { fields: {}, shouldUseNativeValidation: false },
    );

    const errors = result.errors as any;
    expect(errors.name.message).toBe('too short');
    expect(errors.items[0].label.message).toBe('label required');
  });

  it('keeps the first message per field when zod reports several', async () => {
    const multiple = z.object({
      title: z.string().min(3, 'first').regex(/^[A-Z]/, 'second'),
    });

    const result = await zodResolver(multiple)(
      { title: 'ab' },
      context,
      { fields: {}, shouldUseNativeValidation: false },
    );

    expect((result.errors as any).title.message).toBe('first');
  });
});
