import { useCallback, useState } from 'react';
import Cropper, { type Area } from 'react-easy-crop';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';
import { CROP_PRESETS, cropImageToBlob, type CropPreset } from '@/utils/cropImage';

export interface ImageCropModalProps {
  /** Object URL of the file being cropped. */
  src: string;
  fileName: string;
  /** Source MIME type, used to pick the output format. */
  sourceType: string;
  presets?: CropPreset[];
  /** Preset selected when the dialog opens. */
  initialAspect?: number | null;
  onCancel: () => void;
  onConfirm: (file: File) => void;
}

/**
 * Crop dialog for uploads.
 *
 * Uses `react-easy-crop` so the framing is a real drag/zoom interaction rather
 * than a set of fixed dimensions, with aspect presets that match the studio's
 * banner presets. The crop is applied in the browser and uploaded as a new
 * file; the original never leaves the user's machine.
 */
export function ImageCropModal({
  src,
  fileName,
  sourceType,
  presets = CROP_PRESETS,
  initialAspect = null,
  onCancel,
  onConfirm,
}: ImageCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspect, setAspect] = useState<number | null>(initialAspect);
  const [areaPixels, setAreaPixels] = useState<Area | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onCropComplete = useCallback((_area: Area, pixels: Area) => {
    setAreaPixels(pixels);
  }, []);

  async function confirm() {
    if (!areaPixels) return;
    setBusy(true);
    setError(null);
    try {
      const { blob } = await cropImageToBlob(src, areaPixels, { sourceType });
      const extension = blob.type === 'image/png' ? 'png' : blob.type === 'image/webp' ? 'webp' : 'jpg';
      const baseName = fileName.replace(/\.[^.]+$/, '') || 'crop';
      const file = new File([blob], `${baseName}-crop.${extension}`, { type: blob.type });
      onConfirm(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not crop that image');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
      <div
        className="w-full max-w-3xl overflow-hidden rounded-2xl border bg-surface-raised border-line text-ink-raised"
      >
        <div className="flex items-start justify-between gap-4 p-4 pb-0">
          <div>
            <h2 className="font-heading text-base font-bold">Crop image</h2>
            <p className="text-[11px] opacity-60">
              Drag to reposition, scroll or pinch to zoom, then choose a shape.
            </p>
          </div>
          <button type="button" onClick={onCancel} className="text-xs opacity-60 hover:opacity-100">
            Cancel
          </button>
        </div>

        <div className="mt-3 flex flex-wrap gap-2 px-4">
          {presets.map((preset) => {
            const active = preset.aspect === aspect;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  setAspect(preset.aspect);
                  setCrop({ x: 0, y: 0 });
                }}
                className={cn(
                  'rounded-full border px-3 py-1 text-[11px] transition',
                  active ? 'border-gold text-gold' : 'opacity-70 hover:opacity-100',
                  active ? undefined : 'border-line',
                )}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        <div className="relative mt-3 h-[52vh] min-h-64 w-full bg-black">
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            aspect={aspect ?? 4 / 3}
            cropShape="rect"
            showGrid
            minZoom={1}
            maxZoom={4}
            restrictPosition
            zoomSpeed={1}
            zoomWithScroll
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 p-4">
          <label className="flex items-center gap-2 text-[11px] opacity-70">
            Zoom
            <input
              type="range"
              min={1}
              max={4}
              step={0.02}
              value={zoom}
              onChange={(event) => setZoom(Number(event.target.value))}
              className="accent-current"
            />
          </label>

          <div className="flex items-center gap-2">
            {error ? (
              <p role="alert" className="text-[11px] text-rose-400">
                {error}
              </p>
            ) : null}
            <Button type="button" variant="ghost" size="sm" onClick={onCancel} disabled={busy}>
              Cancel
            </Button>
            <Button
              type="button"
              variant="luxury"
              size="sm"
              loading={busy}
              disabled={busy || !areaPixels}
              onClick={() => void confirm()}
            >
              Apply crop &amp; upload
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
