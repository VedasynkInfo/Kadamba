import { describe, expect, it } from 'vitest';
import { ApiContractError, isRetryable, toAppError } from '@/lib/apiError';
import { parseApiData } from '@/lib/parse';
import { galleryItemSchema, galleryWriteSchema, leadRequestSchema } from '@/shared/schemas';

const galleryItem = {
  id: '507f1f77bcf86cd799439011',
  slug: 'a-piece',
  title: 'A Piece',
  category: 'Bridal',
  alt: 'A piece',
  mediaType: 'image',
  src: '/uploads/a.jpg',
  width: 1200,
  height: 1600,
  published: true,
  sortOrder: 0,
};

/** Capture the thrown `ApiContractError` so its detail can be asserted. */
function capture(fn: () => unknown): ApiContractError {
  try {
    fn();
  } catch (error) {
    if (error instanceof ApiContractError) return error;
    throw error;
  }
  throw new Error('Expected an ApiContractError, but nothing was thrown');
}

describe('parseApiData', () => {
  it('returns the data when the envelope and the payload both match', () => {
    const parsed = parseApiData(
      galleryItemSchema,
      { success: true, data: galleryItem },
      'the gallery list',
    );

    expect(parsed).toEqual(galleryItem);
  });

  it('keeps fields the contract does not name, so a server addition is not dropped', () => {
    const parsed = parseApiData<{ id: string; addedLater?: string }>(
      galleryItemSchema,
      { success: true, data: { ...galleryItem, addedLater: 'kept' } },
      'the gallery list',
    );

    expect(parsed.addedLater).toBe('kept');
  });

  it('refuses a 200 that reports failure instead of trusting the status code', () => {
    const error = capture(() =>
      parseApiData(
        galleryItemSchema,
        { success: false, code: 'NOT_FOUND', message: 'Gone' },
        'the gallery list',
      ),
    );

    expect(error.message).toContain('the gallery list');
  });

  it('names the offending field rather than failing silently', () => {
    const error = capture(() =>
      parseApiData(
        galleryItemSchema,
        { success: true, data: { ...galleryItem, width: 'wide' } },
        'the gallery list',
      ),
    );

    expect(error.issues.join('\n')).toContain('width');
  });

  it('reports a contract violation as its own code, and never retries it', () => {
    const error = capture(() =>
      parseApiData(galleryItemSchema, { success: true, data: {} }, 'the gallery list'),
    );

    const appError = toAppError(error);
    expect(appError.code).toBe('UNEXPECTED_RESPONSE');
    expect(appError.message).toContain('the gallery list');
    expect(isRetryable(appError)).toBe(false);
  });
});

describe('toAppError', () => {
  it('reads field detail from our middleware (`message`)', () => {
    const appError = toAppError({
      isAxiosError: true,
      response: {
        status: 400,
        data: {
          success: false,
          code: 'VALIDATION_FAILED',
          message: 'Validation failed',
          errors: [{ field: 'category', message: 'Invalid category' }],
        },
      },
    });

    expect(appError.code).toBe('VALIDATION_FAILED');
    expect(appError.fieldErrors).toEqual(['Invalid category']);
  });

  it('reads field detail from express-validator too (`msg`)', () => {
    const appError = toAppError({
      isAxiosError: true,
      response: {
        status: 400,
        data: {
          success: false,
          code: 'VALIDATION_FAILED',
          message: 'Validation failed',
          errors: [{ param: 'title', msg: 'Title is required', location: 'body' }],
        },
      },
    });

    expect(appError.fieldErrors).toEqual(['Title is required']);
  });
});

describe('leadRequestSchema', () => {
  const enquiry = {
    name: 'Asha Rao',
    email: 'Asha@Example.com',
    phone: '+91 90000 00000',
    city: 'Kurnool',
    service: 'Bridal Lehenga',
    occasion: 'Wedding',
    budget: '50000',
    preferredDate: '2030-01-01',
    message: 'Please share available consultation slots.',
  };

  it('accepts the payload the enquiry form builds, normalising the email', () => {
    const result = leadRequestSchema.safeParse(enquiry);

    expect(result.success).toBe(true);
    expect(result.success && result.data.email).toBe('asha@example.com');
  });

  it('refuses a phone number that cannot be dialled', () => {
    expect(leadRequestSchema.safeParse({ ...enquiry, phone: '12345' }).success).toBe(false);
  });

  it('refuses a date in the past — the rule the server enforces too', () => {
    expect(leadRequestSchema.safeParse({ ...enquiry, preferredDate: '2000-01-01' }).success).toBe(
      false,
    );
  });

  it('refuses a message below the length the server requires', () => {
    expect(leadRequestSchema.safeParse({ ...enquiry, message: 'too short' }).success).toBe(false);
  });
});

describe('CMS write schemas', () => {
  const payload = { title: 'A Piece', category: 'Bridal', src: '/uploads/a.jpg' };

  it('normalises the string forms a browser can send', () => {
    const result = galleryWriteSchema.safeParse({
      ...payload,
      width: '1200',
      published: 'false',
    });

    expect(result.success).toBe(true);
    expect(result.success && result.data.width).toBe(1200);
    // The whole point of the explicit boolean handling: "false" is not truthy.
    expect(result.success && result.data.published).toBe(false);
  });

  it('keeps fields it does not police, so nothing is silently stripped on save', () => {
    const result = galleryWriteSchema.safeParse({ ...payload, sortOrder: 3, customField: 'kept' });

    expect(result.success).toBe(true);
    expect(result.success && (result.data as Record<string, unknown>).customField).toBe('kept');
  });

  it('accepts a partial update, which is the shape a PUT actually sends', () => {
    expect(galleryWriteSchema.partial().safeParse({ published: true }).success).toBe(true);
  });

  it('refuses a category the model would reject', () => {
    expect(galleryWriteSchema.safeParse({ ...payload, category: 'Nope' }).success).toBe(false);
  });

  it('refuses a title below the length the server requires', () => {
    expect(galleryWriteSchema.safeParse({ ...payload, title: 'A' }).success).toBe(false);
  });
});
