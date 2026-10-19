import { useCallback, useEffect, useId, useRef, useState, type ChangeEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';
import { mediaUrl } from '@/utils/mediaUrl';
import { uploadMedia } from '@/services/upload/uploadService';
import { mediaApi, type MediaAsset } from '@/services/media/mediaLibraryService';
import { CROP_PRESETS, type CropPreset } from '@/utils/cropImage';
import { ImageCropModal } from '@/components/media/ImageCropModal';
import { OptimizedImage } from '@/components/media/OptimizedImage';

export interface MediaUploadProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  /** Logical folder recorded against the asset (media library grouping). */
  folder?: string;
  accept?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  /** Show video preview when value looks like video. */
  allowVideo?: boolean;
  /**
   * Offer the crop dialog before uploading an image. On by default for wide
   * formats (banners, covers); switch it off for anything where the whole frame
   * matters, such as a logo or a product photo.
   */
  enableCrop?: boolean;
  /** Aspect locked when the crop dialog opens. */
  cropAspect?: number | null;
  /** Override the shape list offered in the crop dialog. */
  cropPresets?: CropPreset[];
  /** Offer a picker over files already uploaded to the library. */
  enableLibrary?: boolean;
}

function isVideoUrl(url: string, mimeHint?: string): boolean {
  if (mimeHint?.startsWith('video/')) return true;
  return /\.(mp4|webm|mov)(\?|$)/i.test(url);
}

interface PendingCrop {
  url: string;
  file: File;
}

/**
 * Media picker — uploads via `/api/upload` and stores the returned URL.
 *
 * Three ways in: upload a new file, crop-then-upload (real drag/zoom framing
 * rather than a fixed size), or pick something already in the media library.
 * Existing URLs still preview, and the clear action keeps forms editable.
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
  enableCrop = false,
  cropAspect = null,
  cropPresets = CROP_PRESETS,
  enableLibrary = true,
}: MediaUploadProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [pendingCrop, setPendingCrop] = useState<PendingCrop | null>(null);

  const resolvedAccept = allowVideo
    ? `${accept},video/mp4,video/webm,video/quicktime`
    : accept;

  // Release the object URL whenever the dialog closes, in any way.
  useEffect(() => {
    const url = pendingCrop?.url;
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [pendingCrop]);

  const upload = useCallback(
    async (file: File | Blob, fileName?: string) => {
      setLocalError(null);
      setUploading(true);
      try {
        const named =
          file instanceof File ? file : new File([file], fileName ?? 'upload.jpg', { type: file.type });
        const result = await uploadMedia(named, folder);
        onChange(result.url);
      } catch (err) {
        setLocalError(err instanceof Error ? err.message : 'Upload failed. Try again.');
      } finally {
        setUploading(false);
      }
    },
    [folder, onChange],
  );

  async function onFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const isVideo = file.type.startsWith('video/');
    if (enableCrop && !isVideo) {
      setLocalError(null);
      setPendingCrop({ url: URL.createObjectURL(file), file });
      return;
    }

    await upload(file);
  }

  const showVideo = value ? isVideoUrl(value) : false;
  const previewSrc = mediaUrl(value);

  return (
    <div className="flex w-full flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-medium text-ink">
        {label}
        {required ? (
          <span className="ml-0.5 text-gold" aria-hidden>
            *
          </span>
        ) : null}
      </label>

      {value ? (
        <div className="overflow-hidden rounded-md border border-line bg-black/[0.03]">
          {showVideo ? (
            <video
              src={previewSrc}
              className="max-h-48 w-full object-cover"
              controls
              muted
              playsInline
              // Metadata only: a poster frame plus dimensions without pulling
              // the whole video down just to show a thumbnail.
              preload="metadata"
            />
          ) : (
            <OptimizedImage src={previewSrc} alt="" sizes="320px" className="max-h-48 w-full object-cover" />
          )}
        </div>
      ) : (
        <div
          className={cn(
            'flex min-h-28 items-center justify-center rounded-md border border-dashed border-line bg-surface-sunken px-3 py-6 text-center text-sm text-ink/45',
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
        {enableLibrary ? (
          <LibraryPickerButton
            disabled={disabled || uploading}
            onPick={(url) => {
              setLocalError(null);
              onChange(mediaUrl(url));
            }}
          />
        ) : null}
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
        <p className="text-xs text-ink/50">{hint}</p>
      ) : null}
      {(error || localError) && (
        <p role="alert" className="text-xs text-red-700">
          {error || localError}
        </p>
      )}

      {pendingCrop ? (
        <ImageCropModal
          src={pendingCrop.url}
          fileName={pendingCrop.file.name}
          sourceType={pendingCrop.file.type}
          presets={cropPresets}
          initialAspect={cropAspect}
          onCancel={() => setPendingCrop(null)}
          onConfirm={(cropped) => {
            setPendingCrop(null);
            void upload(cropped);
          }}
        />
      ) : null}
    </div>
  );
}

/**
 * Picker over files already in the library, so the same hero photo is not
 * uploaded three times for three different sections.
 */
function LibraryPickerButton({
  disabled,
  onPick,
}: {
  disabled?: boolean;
  onPick: (url: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);
    setLoadError(null);
    mediaApi
      .list({ limit: 24, q: query || undefined, kind: 'image' })
      .then((result) => {
        if (active) setItems(result.items);
      })
      .catch(() => {
        if (active) setLoadError('Could not load the media library.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [open, query]);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        disabled={disabled}
        onClick={() => setOpen(true)}
      >
        Library
      </Button>

      {open ? (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
          <div
            className="max-h-[85vh] w-full max-w-3xl overflow-y-auto rounded-2xl border p-5 bg-surface-raised border-line text-ink-raised"
          >
            <div className="flex items-start justify-between gap-4">
              <h2 className="font-heading text-base font-bold">Choose from library</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-xs opacity-60 hover:opacity-100"
              >
                Close
              </button>
            </div>

            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by name or alt text"
              className="mt-4 w-full rounded-xl border px-3 py-2 text-xs bg-surface-sunken border-line"
            />

            {loadError ? (
              <p className="mt-4 text-xs text-rose-400">{loadError}</p>
            ) : loading ? (
              <p className="mt-6 text-center text-xs opacity-60">Loading…</p>
            ) : items.length === 0 ? (
              <p className="mt-6 text-center text-xs opacity-60">Nothing uploaded yet.</p>
            ) : (
              <ul className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-4">
                {items.map((asset) => (
                  <li key={asset._id}>
                    <button
                      type="button"
                      onClick={() => {
                        onPick(asset.originalUrl);
                        setOpen(false);
                      }}
                      className="group w-full overflow-hidden rounded-xl border transition hover:border-gold/60 border-line"
                    >
                      <OptimizedImage
                        src={mediaUrl(asset.originalUrl)}
                        alt={asset.alt || asset.originalName || ''}
                        sizes="(max-width: 640px) 33vw, 160px"
                        className="aspect-[4/3] w-full object-cover"
                      />
                      <span className="block truncate px-2 py-1.5 text-left text-[10px] opacity-70">
                        {asset.originalName || asset.hash.slice(0, 10)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
