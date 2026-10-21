import { useCallback, useEffect, useRef, useState } from 'react';

function readFilters<T extends Record<string, string>>(key: string, defaults: T): T {
  if (typeof window === 'undefined') return defaults;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return defaults;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return defaults;

    const restored = { ...defaults };
    for (const name of Object.keys(defaults) as (keyof T)[]) {
      const value = (parsed as Record<string, unknown>)[String(name)];
      // Only strings: a stored number or object is a corrupted entry from an
      // older shape, not a filter this desk can use.
      if (typeof value === 'string') restored[name] = value as T[keyof T];
    }
    return restored;
  } catch {
    return defaults;
  }
}

/**
 * Filter state that survives a reload.
 *
 * A desk is a place someone returns to; re-picking the same status filter every
 * morning is the console forgetting what it was told. The state is deliberately
 * per-browser and per-desk (`localStorage` keyed by the caller), because a
 * filter is a preference, not studio data.
 */
export function useSavedFilters<T extends Record<string, string>>(storageKey: string, defaults: T) {
  const defaultsRef = useRef(defaults);
  const [filters, setFilters] = useState<T>(() => readFilters(storageKey, defaultsRef.current));

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(filters));
    } catch {
      // Private mode or a full quota: a filter is not worth failing a desk over.
    }
  }, [storageKey, filters]);

  const setFilter = useCallback(<K extends keyof T>(name: K, value: T[K]) => {
    setFilters((current) => (current[name] === value ? current : { ...current, [name]: value }));
  }, []);

  const reset = useCallback(() => setFilters(defaultsRef.current), []);

  return { filters, setFilter, reset, setFilters };
}
