import type { FieldErrors, FieldValues, Resolver } from 'react-hook-form';
import type { ZodType } from 'zod';

interface ResolverError {
  message: string;
  type: string;
}

function placeError(target: Record<string, unknown>, path: PropertyKey[], error: ResolverError) {
  let cursor = target;

  for (let index = 0; index < path.length - 1; index += 1) {
    const key = path[index];
    const next = path[index + 1];
    if (typeof cursor[key as string] !== 'object' || cursor[key as string] === null) {
      cursor[key as string] = typeof next === 'number' ? [] : {};
    }
    cursor = cursor[key as string] as Record<string, unknown>;
  }

  const last = path[path.length - 1];
  // One message per field: the first issue is the one the user should fix.
  if (cursor[last as string] === undefined) cursor[last as string] = error;
}

/**
 * A zod schema as a react-hook-form resolver.
 *
 * `@hookform/resolvers` does this in one import, but it is a dependency for a
 * single adapter, and the adapter is twenty lines: run the schema, then rebuild
 * zod's `path` arrays into the nested `errors` object RHF reads. Keeping it here
 * also keeps the zod version and the form layer in lockstep.
 */
export function zodResolver<T extends FieldValues>(schema: ZodType<T>): Resolver<T> {
  return async (values) => {
    const result = await schema.safeParseAsync(values);

    if (result.success) {
      return { values: result.data, errors: {} };
    }

    const errors: Record<string, unknown> = {};
    for (const issue of result.error.issues) {
      const path = issue.path.length > 0 ? issue.path : ['root'];
      placeError(errors, path, { message: issue.message, type: issue.code });
    }

    return { values: {}, errors: errors as FieldErrors<T> };
  };
}
