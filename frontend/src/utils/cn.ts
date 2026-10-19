import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Compose a className from any mix of conditions.
 *
 * `clsx` handles the shapes already used across the codebase (`false`, `null`,
 * arrays, `{ 'text-ink': isActive }`). `twMerge` then resolves conflicts *within
 * the same class group*, last one winning — which is what lets a caller override
 * a component's own defaults with a plain `className` instead of reaching for
 * `!important`. That is why the old `text-ink` / `!bg-current` overrides could
 * be deleted.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
