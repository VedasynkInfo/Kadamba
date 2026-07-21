/**
 * Escape a string for safe use inside a RegExp.
 */
export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Build a case-insensitive contains regex from a search string.
 */
export function searchRegex(q: string | undefined): RegExp | undefined {
  const trimmed = q?.trim();
  if (!trimmed) return undefined;
  return new RegExp(escapeRegex(trimmed), 'i');
}

/**
 * Parse optional boolean query (`true`/`false`/`1`/`0`).
 */
export function parseBooleanQuery(value: unknown): boolean | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  if (value === true || value === 'true' || value === '1') return true;
  if (value === false || value === 'false' || value === '0') return false;
  return undefined;
}
