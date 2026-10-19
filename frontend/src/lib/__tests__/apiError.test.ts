import { describe, expect, it } from 'vitest';
import {
  isAuthError,
  isOfflineError,
  isRetryable,
  toAppError,
  type AppError,
} from '@/lib/apiError';

/** Shape-check-compatible with what axios actually throws. */
function axiosErrorWithResponse(status: number, data: unknown): unknown {
  return Object.assign(new Error('Request failed'), {
    isAxiosError: true,
    config: {},
    response: { status, data, statusText: '', headers: {}, config: {} },
  });
}

function axiosErrorWithoutResponse(code: string): unknown {
  return Object.assign(new Error('Network Error'), {
    isAxiosError: true,
    code,
    config: {},
  });
}

describe('toAppError', () => {
  it('prefers the server error code over the status fallback', () => {
    const error = toAppError(
      axiosErrorWithResponse(400, {
        success: false,
        code: 'VALIDATION_FAILED',
        message: 'Title is required',
      }),
    );

    expect(error.code).toBe('VALIDATION_FAILED');
    expect(error.status).toBe(400);
    expect(error.message).toBe('Title is required');
  });

  it('falls back to the status when the body carries no code', () => {
    expect(toAppError(axiosErrorWithResponse(409, { success: false })).code).toBe('CONFLICT');
    expect(toAppError(axiosErrorWithResponse(404, { success: false })).code).toBe('NOT_FOUND');
    expect(toAppError(axiosErrorWithResponse(500, { success: false })).code).toBe('INTERNAL');
  });

  it('ignores a code that is not part of the shared contract', () => {
    const error = toAppError(
      axiosErrorWithResponse(403, { success: false, code: 'NOT_A_REAL_CODE' }),
    );
    expect(error.code).toBe('FORBIDDEN');
  });

  it('supplies a user-facing message when the server sent none', () => {
    const error = toAppError(axiosErrorWithResponse(429, { success: false }));
    expect(error.code).toBe('RATE_LIMITED');
    expect(error.message).toMatch(/too many requests/i);
  });

  it('flattens field-level errors from the envelope', () => {
    const error = toAppError(
      axiosErrorWithResponse(400, {
        success: false,
        code: 'VALIDATION_FAILED',
        message: 'Validation failed',
        errors: [{ message: 'Name is required' }, 'Phone is required', { other: true }, null],
      }),
    );

    expect(error.fieldErrors).toEqual(['Name is required', 'Phone is required']);
  });

  it('captures the request id so a failure can be traced', () => {
    const error = toAppError(
      axiosErrorWithResponse(500, { success: false, code: 'INTERNAL', requestId: 'req-42' }),
    );
    expect(error.requestId).toBe('req-42');
  });

  it('reports a transport failure as NETWORK, never as a server error', () => {
    const error = toAppError(axiosErrorWithoutResponse('ERR_NETWORK'));
    expect(error.code).toBe('NETWORK');
    expect(error.status).toBe(0);
    expect(isOfflineError(error)).toBe(true);
  });

  it('distinguishes a timeout from a plain connection failure', () => {
    const error = toAppError(axiosErrorWithoutResponse('ECONNABORTED'));
    expect(error.code).toBe('NETWORK');
    expect(error.message).toMatch(/too long to respond/i);
  });

  it('normalises a non-axios throw', () => {
    const error = toAppError(new Error('boom'));
    expect(error.code).toBe('UNKNOWN');
    expect(error.message).toBe('boom');
  });

  it('never throws on a null-ish value', () => {
    expect(() => toAppError(null)).not.toThrow();
    expect(toAppError(undefined).code).toBe('UNKNOWN');
  });
});

describe('retry policy', () => {
  const error = (patch: Partial<AppError>): AppError => ({
    code: 'INTERNAL',
    status: 500,
    message: '',
    fieldErrors: [],
    ...patch,
  });

  it('retries server faults', () => {
    expect(isRetryable(error({ code: 'INTERNAL', status: 500 }))).toBe(true);
  });

  it('retries transport failures', () => {
    expect(isRetryable(error({ code: 'NETWORK', status: 0 }))).toBe(true);
  });

  it('never retries a rejected request — that would delay the real error', () => {
    expect(isRetryable(error({ code: 'VALIDATION_FAILED', status: 400 }))).toBe(false);
    expect(isRetryable(error({ code: 'CONFLICT', status: 409 }))).toBe(false);
  });

  it('never retries a rate limit — the next attempt would fail too', () => {
    expect(isRetryable(error({ code: 'RATE_LIMITED', status: 429 }))).toBe(false);
  });

  it('never retries an expired session; the client re-authenticates instead', () => {
    expect(isRetryable(error({ code: 'TOKEN_EXPIRED', status: 401 }))).toBe(false);
    expect(isAuthError(error({ code: 'UNAUTHENTICATED', status: 401 }))).toBe(true);
    expect(isAuthError(error({ code: 'UNAUTHENTICATED', status: 401 }))).toBe(true);
  });
});
