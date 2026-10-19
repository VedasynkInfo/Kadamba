/**
 * Client-side id helper for newly created admin records before the API
 * assigns a real `_id`. Persistence is API-backed; no local storage hook is
 * needed any more.
 */
export function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
