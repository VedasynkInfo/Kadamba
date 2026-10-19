import type { ZodType } from 'zod';
import { apiSuccessResponseSchema } from '@/shared/schemas';
import { ApiContractError } from './apiError';

/**
 * Validate an API success response against a shared contract schema.
 *
 * The services used to assert a response shape with `data.data!` — a
 * non-null assertion that a 200-with-`success:false`, a renamed field or a
 * missing `data` would sail straight through, to be rendered later as an empty
 * string or `undefined`. Parsing here means a contract violation fails at the
 * boundary, attributed to the surface that asked (`what`), instead of
 * halfway down a component tree.
 *
 * Only failures of *shape* are handled here. A 4xx/5xx never reaches this
 * function: axios rejects, and `toAppError` turns that into a coded `AppError`.
 */
export function parseApiData<T>(schema: ZodType<T>, payload: unknown, what: string): T {
  const envelope = apiSuccessResponseSchema(schema).safeParse(payload);

  if (!envelope.success) {
    const issues = envelope.error.issues.map(
      (issue) => `${issue.path.join('.') || '(response)'}: ${issue.message}`,
    );
    throw new ApiContractError(what, issues);
  }

  return envelope.data.data;
}
