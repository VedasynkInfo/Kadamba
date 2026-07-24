import { useId, useRef, useState, type ChangeEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';
import { mediaUrl } from '@/utils/mediaUrl';
import { uploadMedia } from '@/services/upload/uploadService';

export interface MediaUploadProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  /** Cloudinary / local folder segment. */
  folder?: string;
  accept?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  /** Show video preview when value looks like video. */
  allowVideo?: boolean;
}

function isDemoToken(): boolean {
  return localStorage.getItem('kadamba_token') === 'demo-admin-token';
}

function isVideoUrl(url: string, mimeHint?: string): boolean {
  if (mimeHint?.startsWith('video/')) return true;
  return /\.(mp4|webm|mov)(\?|$)/i.test(url);
}

/**
 * Manual media picker — uploads via `/api/upload` and stores the returned URL.
 * Existing URLs still preview; optional clear keeps forms editable.
 */
export function MediaUpload({
  label,
  value,
  onChange,
  folder = 'general',
  accept = 'image/jpeg,image/png,image/webp,image/gif',
  hint,
  error,
  required,
  disabled,
  allowVideo = false,
}: MediaUploadProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const resolvedAccept = allowVideo
    ? `${accept},video/mp4,video/webm,video/quicktime`
    : accept;

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setLocalError(null);
    setUploading(true);

    try {
      if (isDemoToken() && import.meta.env.DEV) {
        // Offline demo unlock — keep a local object URL so drawers still work.
        const objectUrl = URL.createObjectURL(file);
        onChange(objectUrl);
        return;
      }

      const result = await uploadMedia(file, folder);
      onChange(result.url);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Upload failed. Try again.';
      setLocalError(message);
    } finally {
      setUploading(false);
    }
  }

  const showVideo = value && isVideoUrl(value);
  const previewSrc = mediaUrl(value);

  return (
    <div className="flex w-full flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-black">
        {label}
        {required ? (
          <span className="ml-0.5 text-gold" aria-hidden>
            *
          </span>
        ) : null}
      </label>

      {value ? (
        <div className="overflow-hidden rounded-md border border-black/15 bg-black/[0.03]">
          {showVideo ? (
            <video
              src={previewSrc}
              className="max-h-48 w-full object-cover"
              controls
              muted
              playsInline
            />
          ) : (
            <img
              src={previewSrc}
              alt=""
              className="max-h-48 w-full object-cover"
            />
          )}
        </div>
      ) : (
        <div
          className={cn(
            'flex min-h-28 items-center justify-center rounded-md border border-dashed border-black/20 bg-cream px-3 py-6 text-center text-sm text-black/45',
          )}
        >
          No media selected
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={resolvedAccept}
          className="sr-only"
          disabled={disabled || uploading}
          onChange={onFile}
        />
        <Button
          type="button"
          variant="luxury"
          size="sm"
          loading={uploading}
          disabled={disabled || uploading}
          onClick={() => inputRef.current?.click()}
        >
          {value ? 'Replace file' : 'Upload file'}
        </Button>
        {value ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={disabled || uploading}
            onClick={() => {
              setLocalError(null);
              onChange('');
            }}
          >
            Clear
          </Button>
        ) : null}
      </div>

      {hint && !error && !localError ? (
        <p className="text-xs text-black/50">{hint}</p>
      ) : null}
      {(error || localError) && (
        <p role="alert" className="text-xs text-red-700">
          {error || localError}
        </p>
      )}
    </div>
  );
}
