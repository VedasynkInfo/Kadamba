/**
 * Create a URL-safe slug from a title.
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'item';
}

type ExistsFn = (slug: string) => Promise<boolean>;

/**
 * Ensure slug uniqueness by appending -2, -3, … when collisions exist.
 */
export async function uniqueSlug(
  base: string,
  exists: ExistsFn,
  preferred?: string,
): Promise<string> {
  const root = slugify(preferred || base);
  let candidate = root;
  let n = 2;
  while (await exists(candidate)) {
    candidate = `${root}-${n}`;
    n += 1;
  }
  return candidate;
}
