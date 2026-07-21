import { useCallback, useEffect, useState } from 'react';

function loadCollection<T>(key: string, seed: T[]): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return structuredClone(seed);
    const parsed = JSON.parse(raw) as T[];
    if (!Array.isArray(parsed)) return structuredClone(seed);
    return parsed;
  } catch {
    return structuredClone(seed);
  }
}

/**
 * Local collection helpers — uid still used by admin drawers for new client-side ids.
 * Persistence is now API-backed (Phase 13); this hook remains for offline/demo paths.
 */
export function useLocalCollection<T extends { id: string }>(key: string, seed: T[]) {
  const [items, setItems] = useState<T[]>(() => loadCollection(key, seed));

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(items));
  }, [items, key]);

  const upsert = useCallback((item: T) => {
    setItems((prev) => {
      const idx = prev.findIndex((row) => row.id === item.id);
      if (idx === -1) return [item, ...prev];
      const next = [...prev];
      next[idx] = item;
      return next;
    });
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((row) => row.id !== id));
  }, []);

  const reset = useCallback(() => {
    const next = structuredClone(seed);
    setItems(next);
    localStorage.setItem(key, JSON.stringify(next));
  }, [key, seed]);

  return { items, setItems, upsert, remove, reset };
}

export function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}
