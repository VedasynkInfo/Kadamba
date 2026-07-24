import { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui';
import api from '@/services/api/client';
import type { ApiResponse } from '@/types';
import { cn } from '@/utils/cn';
import { slugifyTitle } from '@/seo/generateSeo';

type Collection = 'blogs' | 'services' | 'portfolio' | 'gallery';

interface SlugFieldProps {
  collection: Collection;
  value: string;
  onChange: (slug: string, opts?: { locked?: boolean }) => void;
  excludeId?: string;
  /** When true, value tracks title via parent; still editable */
  autoManaged?: boolean;
  titleForAuto?: string;
  className?: string;
}

/**
 * Slug input with live uniqueness check + suggestion.
 */
export function SlugField({
  collection,
  value,
  onChange,
  excludeId,
  autoManaged,
  titleForAuto,
  className,
}: SlugFieldProps) {
  const [status, setStatus] = useState<'idle' | 'checking' | 'ok' | 'taken'>('idle');
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (autoManaged && titleForAuto) {
      const next = slugifyTitle(titleForAuto);
      if (next !== value) onChange(next);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when title drives auto
  }, [autoManaged, titleForAuto]);

  useEffect(() => {
    if (!value.trim()) {
      setStatus('idle');
      setSuggestion(null);
      return;
    }
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      void check(value.trim());
    }, 350);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [value, excludeId, collection]);

  async function check(slug: string) {
    setStatus('checking');
    try {
      const { data } = await api.get<
        ApiResponse<{ available: boolean; suggestion?: string }>
      >(`/admin/${collection}/slug-available`, {
        params: { slug, excludeId },
      });
      const payload = data.data!;
      if (payload.available) {
        setStatus('ok');
        setSuggestion(null);
      } else {
        setStatus('taken');
        setSuggestion(payload.suggestion || null);
      }
    } catch {
      setStatus('idle');
      setSuggestion(null);
    }
  }

  return (
    <div className={cn('space-y-2', className)}>
      <Input
        label="Slug"
        value={value}
        onChange={(e) => onChange(e.target.value.toLowerCase().replace(/\s+/g, '-'), { locked: true })}
        hint={
          status === 'checking'
            ? 'Checking availability…'
            : status === 'ok'
              ? 'Slug is available'
              : status === 'taken'
                ? 'Slug already in use'
                : 'URL path segment'
        }
        error={status === 'taken' ? 'Choose a unique slug' : undefined}
      />
      {status === 'taken' && suggestion ? (
        <button
          type="button"
          className="text-xs font-semibold text-black underline"
          onClick={() => onChange(suggestion, { locked: true })}
        >
          Use suggestion: {suggestion}
        </button>
      ) : null}
    </div>
  );
}
