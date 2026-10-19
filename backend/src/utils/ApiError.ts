import type { ErrorCode } from '../shared/enums';

/**
 * An expected, user-facing failure.
 *
 * `statusCode` drives the HTTP response; `code` is the stable machine-readable
 * cause the client switches on. Leaving `code` unset is fine — the error
 * handler derives a sensible default from the status — but naming it explicitly
 * is what lets the UI do something specific (send the user to sign-in, show a
 * lockout countdown, mark a field invalid) instead of printing a message.
 */
export class ApiError extends Error {
  statusCode: number;
  errors?: unknown[];
  code?: ErrorCode;

  constructor(statusCode: number, message: string, errors?: unknown[], code?: ErrorCode) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.code = code;
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  /** 400 — well-formed request that fails a business rule. */
  static badRequest(message: string, errors?: unknown[]) {
    return new ApiError(400, message, errors, 'BAD_REQUEST');
  }

  /** 400 — request body/params failed schema validation. */
  static validationFailed(message: string, errors?: unknown[]) {
    return new ApiError(400, message, errors, 'VALIDATION_FAILED');
  }

  /** 400 — the uploaded file was rejected (type, size, or content sniff). */
  static uploadInvalid(message: string, errors?: unknown[]) {
    return new ApiError(400, message, errors, 'UPLOAD_INVALID');
  }

  /** 401 — no usable session. */
  static unauthenticated(message = 'Authentication required', errors?: unknown[]) {
    return new ApiError(401, message, errors, 'UNAUTHENTICATED');
  }

  /** 401 — an expired (but otherwise valid) session token. */
  static tokenExpired(message = 'Session expired') {
    return new ApiError(401, message, undefined, 'TOKEN_EXPIRED');
  }

  /** 401 — the presented MFA code was wrong. */
  static mfaInvalid(message = 'Invalid authentication code') {
    return new ApiError(401, message, undefined, 'MFA_INVALID');
  }

  /** 403 — the action requires MFA to be enabled first. */
  static mfaRequired(message = 'Multi-factor authentication is required for this action') {
    return new ApiError(403, message, undefined, 'MFA_REQUIRED');
  }

  /** 409 — the change collides with existing state. */
  static conflict(message: string, errors?: unknown[]) {
    return new ApiError(409, message, errors, 'CONFLICT');
  }

  /** 423 — repeated failures have locked the account for a cooling-off period. */
  static accountLocked(message: string) {
    return new ApiError(423, message, undefined, 'ACCOUNT_LOCKED');
  }
}
