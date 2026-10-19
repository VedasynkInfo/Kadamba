import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';
import { ApiError } from '../utils/ApiError';

/**
 * Validate a request body against a shared contract schema.
 *
 * The schema comes from `shared/schemas.ts`, so the payload the SPA sends is
 * checked against the same definition the SPA itself validates with — a field
 * can no longer be required by the route and optional in the client, or vice
 * versa.
 *
 * The parsed output replaces `req.body`. That is safe because the write schemas
 * are `looseObject`s: fields the contract does not police (a service's
 * `gallery`, `pricing`, …) pass through untouched, while the fields it does
 * police arrive at the service normalised — `"false"` is a boolean, `"1200"` is
 * a number — instead of leaving each service to cast them again.
 *
 * Failures use the same envelope as `express-validator`'s `validateRequest`, so
 * the client's field-error binding is identical whichever middleware caught it.
 */
export function validateBody<T>(schema: ZodType<T>): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join('.') || undefined,
        message: issue.message,
      }));
      return next(ApiError.validationFailed('Validation failed', errors));
    }

    req.body = result.data as Record<string, unknown>;
    return next();
  };
}
