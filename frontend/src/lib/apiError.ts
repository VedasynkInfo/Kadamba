import axios from 'axios';
import { ERROR_CODES, type ApiErrorResponse, type ErrorCode } from '@/shared/enums';

/**
 * Client-side view of a failure.
 *
 * `code` is the contract's machine-readable cause wherever the server supplied
 * one. Two extra members cover the cases the server cannot describe because the
 * request never reached it.
 */
export type ClientErrorCode = ErrorCode | 'NETWORK' | 'UNKNOWN';

export interface AppError {
  code: ClientErrorCode;
  /** HTTP status, or 0 when the request never got a response. */
  status: number;
  message: string;
  /** Flattened field-level messages for form binding. */
  fieldErrors: string[];
  requestId?: string;
  /** The original thrown value, for logging. */
  cause?: unknown;
}

/**
 * Thrown when a response does not match `shared/schemas.ts`.
 *
 * A contract violation is not a network fault and not a server error the user
 * can retry away — it means the SPA and the API disagree about a shape. It is
 * given its own code so it is distinguishable in logs and in the UI, instead of
 * surfacing as a generic `UNKNOWN` or, worse, as a blank field on the page.
 */
export class ApiContractError extends Error {
  readonly code = 'UNEXPECTED_RESPONSE';

  /** `path: message` for each failing field, for the console. */
  readonly issues: string[];

  /** The surface that failed, e.g. "the gallery list". */
  readonly what: string;

  constructor(what: string, issues: string[]) {
    super(`We could not read the server's response for ${what}. Please try again.`);
    this.name = 'ApiContractError';
    this.what = what;
    this.issues = issues;
  }
}

const KNOWN_CODES = new Set<string>(ERROR_CODES);

const fallbackByStatus = (status: number): ClientErrorCode => {
  if (status === 401) return 'UNAUTHENTICATED';
  if (status === 403) return 'FORBIDDEN';
  if (status === 404) return 'NOT_FOUND';
  if (status === 409) return 'CONFLICT';
  if (status === 422) return 'VALIDATION_FAILED';
  if (status === 423) return 'ACCOUNT_LOCKED';
  if (status === 429) return 'RATE_LIMITED';
  if (status >= 500) return 'INTERNAL';
  if (status >= 400) return 'BAD_REQUEST';
  return 'UNKNOWN';
};

/** Human-readable defaults for when a code arrives without a usable message. */
const defaultMessage: Record<ClientErrorCode, string> = {
  UNAUTHENTICATED: 'Please sign in to continue.',
  TOKEN_EXPIRED: 'Your session expired. Please sign in again.',
  FORBIDDEN: "You don't have permission to do that.",
  BAD_REQUEST: 'That request could not be processed.',
  VALIDATION_FAILED: 'Please check the highlighted fields.',
  NOT_FOUND: 'We could not find that record.',
  CONFLICT: 'That change conflicts with existing data.',
  INVALID_TRANSITION: 'That move is not allowed from the order\u2019s current stage.',
  RATE_LIMITED: 'Too many requests. Please wait a moment.',
  UPLOAD_INVALID: 'That file was rejected. Check the format and size.',
  INTERNAL: 'Something went wrong on our side. Please try again.',
  MFA_REQUIRED: 'Multi-factor authentication is required.',
  MFA_INVALID: 'That authentication code is not valid.',
  ACCOUNT_LOCKED: 'Too many failed attempts. Try again later.',
  UNEXPECTED_RESPONSE: "We could not read the server's response. Please try again.",
  NETWORK: 'You appear to be offline. Check your connection.',
  UNKNOWN: 'Something went wrong. Please try again.',
};

/**
 * Pull a flat list of messages out of the server's `errors` array.
 *
 * `express-validator` names the message `msg`; our own handlers and the shared
 * `validateBody` middleware use `message`. Both are read, otherwise a validation
 * failure would arrive with its field detail silently dropped.
 */
function extractFieldErrors(errors: unknown): string[] {
  if (!Array.isArray(errors)) return [];
  return errors
    .map((entry) => {
      if (typeof entry === 'string') return entry;
      if (entry && typeof entry === 'object') {
        const record = entry as { message?: unknown; msg?: unknown };
        if (typeof record.message === 'string') return record.message;
        if (typeof record.msg === 'string') return record.msg;
      }
      return null;
    })
    .filter((value): value is string => Boolean(value));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/**
 * Normalise anything thrown by the API layer into an `AppError`.
 *
 * Never throws, and always returns a message fit to show a user — callers can
 * render `error.message` directly instead of writing their own `catch` mapping.
 */
export function toAppError(error: unknown): AppError {
  if (error instanceof ApiContractError) {
    return {
      code: 'UNEXPECTED_RESPONSE',
      status: 0,
      message: error.message,
      fieldErrors: [],
      cause: error,
    };
  }

  if (axios.isAxiosError(error)) {
    const status = error.response?.status ?? 0;
    const body: unknown = error.response?.data;

    if (!error.response) {
      const timedOut = error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT';
      return {
        code: 'NETWORK',
        status: 0,
        message: timedOut
          ? 'The server took too long to respond. Please try again.'
          : defaultMessage.NETWORK,
        fieldErrors: [],
        cause: error,
      };
    }

    const envelope = isRecord(body) ? (body as Partial<ApiErrorResponse>) : {};
    const rawCode = typeof envelope.code === 'string' ? envelope.code : '';
    const code: ClientErrorCode =
      rawCode && KNOWN_CODES.has(rawCode) ? (rawCode as ErrorCode) : fallbackByStatus(status);

    return {
      code,
      status,
      message:
        (typeof envelope.message === 'string' && envelope.message.trim()) ||
        defaultMessage[code],
      fieldErrors: extractFieldErrors(envelope.errors),
      requestId: typeof envelope.requestId === 'string' ? envelope.requestId : undefined,
      cause: error,
    };
  }

  if (error instanceof Error) {
    return {
      code: 'UNKNOWN',
      status: 0,
      message: error.message || defaultMessage.UNKNOWN,
      fieldErrors: [],
      cause: error,
    };
  }

  return {
    code: 'UNKNOWN',
    status: 0,
    message: defaultMessage.UNKNOWN,
    fieldErrors: [],
    cause: error,
  };
}

/** The session is gone — the caller should not retry, it should re-authenticate. */
export function isAuthError(error: AppError): boolean {
  return (
    error.status === 401 ||
    error.code === 'UNAUTHENTICATED' ||
    error.code === 'TOKEN_EXPIRED'
  );
}

/** The request never reached the server. */
export function isOfflineError(error: AppError): boolean {
  return error.code === 'NETWORK';
}

/**
 * Worth trying again: transport failures and server faults, but never a
 * rejected request. A 4xx means the request itself is wrong, so retrying only
 * wastes the user's time (and can double-apply a write).
 */
export function isRetryable(error: AppError): boolean {
  if (isAuthError(error)) return false;
  // Retrying a malformed response just reproduces it.
  if (error.code === 'UNEXPECTED_RESPONSE') return false;
  if (error.status === 429) return false;
  if (error.status >= 400 && error.status < 500) return false;
  return true;
}
