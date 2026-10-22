import { Input, Textarea } from '@/components/ui';
import { cn } from '@/utils/cn';
import { MediaUpload } from './MediaUpload';

export interface SeoFieldsValue {
  metaTitle: string;
  metaDescription: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
}

export interface SeoFieldsProps {
  value: SeoFieldsValue;
  onChange: (next: SeoFieldsValue, lockedField?: keyof SeoFieldsValue) => void;
  onRegenerate?: () => void;
  className?: string;
  /** Cream admin drawers use light theme */
  tone?: 'light' | 'dark';
}

function CharHint({ value, max }: { value: string; max: number }) {
  const len = value.length;
  const over = len > max;
  return (
    <span className={cn('text-[0.65rem]', over ? 'text-rose-500 font-semibold' : 'opacity-70')}>
      {len}/{max}
    </span>
  );
}

/**
 * Shared CMS SEO fields with character counters + regenerate.
 */
export function SeoFields({
  value,
  onChange,
  onRegenerate,
  className,
  tone: _tone = 'light',
}: SeoFieldsProps) {
  const heading = 'text-inherit font-bold';
  const muted = 'opacity-65';

  function patch<K extends keyof SeoFieldsValue>(key: K, val: string) {
    onChange({ ...value, [key]: val }, key);
  }

  return (
    <div className={cn('space-y-5 text-inherit', className)}>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 className={cn('text-sm uppercase tracking-[0.14em]', heading)}>
            SEO
          </h3>
          <p className={cn('mt-1 text-xs', muted)}>
            Auto-filled from title — edit any field to lock it.
          </p>
        </div>
        {onRegenerate ? (
          <button
            type="button"
            onClick={onRegenerate}
            className="text-xs font-semibold uppercase tracking-[0.12em] opacity-80 hover:opacity-100 underline"
          >
            Regenerate from title
          </button>
        ) : null}
      </div>

      <div className="space-y-1">
        <Input
          label="Meta title"
          value={value.metaTitle}
          onChange={(e) => patch('metaTitle', e.target.value)}
        />
        <CharHint value={value.metaTitle} max={60} />
      </div>
      <div className="space-y-1">
        <Textarea
          label="Meta description"
          rows={3}
          value={value.metaDescription}
          onChange={(e) => patch('metaDescription', e.target.value)}
        />
        <CharHint value={value.metaDescription} max={160} />
      </div>

      <p className={cn('text-xs font-medium uppercase tracking-[0.14em]', muted)}>Open Graph</p>
      <Input
        label="OG title"
        value={value.ogTitle || ''}
        onChange={(e) => patch('ogTitle', e.target.value)}
      />
      <Textarea
        label="OG description"
        rows={2}
        value={value.ogDescription || ''}
        onChange={(e) => patch('ogDescription', e.target.value)}
      />
      <MediaUpload
        label="OG image"
        value={value.ogImage || ''}
        onChange={(url) => patch('ogImage', url)}
        folder="seo"
        enableCrop={false}
        hint="Upload a 1200×630 image, or choose one from the library."
      />

      <p className={cn('text-xs font-medium uppercase tracking-[0.14em]', muted)}>Twitter</p>
      <Input
        label="Twitter title"
        value={value.twitterTitle || ''}
        onChange={(e) => patch('twitterTitle', e.target.value)}
      />
      <Textarea
        label="Twitter description"
        rows={2}
        value={value.twitterDescription || ''}
        onChange={(e) => patch('twitterDescription', e.target.value)}
      />
      <MediaUpload
        label="Twitter image"
        value={value.twitterImage || ''}
        onChange={(url) => patch('twitterImage', url)}
        folder="seo"
        enableCrop={false}
        hint="Upload a 1200×675 image, or choose one from the library."
      />
    </div>
  );
}
