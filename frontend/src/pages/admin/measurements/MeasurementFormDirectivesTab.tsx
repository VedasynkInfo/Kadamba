import { MediaUpload } from '../components/MediaUpload';
import { OptimizedImage } from '@/components/media/OptimizedImage';
import type { ProfileFormData } from './types';

interface MeasurementFormDirectivesTabProps {
  form: ProfileFormData;
  onUpdateField: <K extends keyof ProfileFormData>(field: K, val: ProfileFormData[K]) => void;
}

export function MeasurementFormDirectivesTab({
  form,
  onUpdateField,
}: MeasurementFormDirectivesTabProps) {
  return (
    <div className="space-y-5">
      {/* Reference Images Media Upload */}
      <div className="space-y-2">
        <label className="block text-[11px] font-semibold opacity-75 uppercase tracking-wider">
          Reference Sketches & Silhouette Drawings
        </label>
        <div className="flex flex-wrap gap-2.5 items-center">
          {(form.referenceImages ?? []).map((url, idx) => (
            <div
              key={idx}
              className="relative h-20 w-20 rounded-xl overflow-hidden border shadow-xs group border-line"
            >
              <OptimizedImage src={url} alt="Fitting Reference" sizes="80px" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() =>
                  onUpdateField(
                    'referenceImages',
                    form.referenceImages.filter((_, i) => i !== idx),
                  )
                }
                className="on-dark absolute right-1 top-1 h-5 w-5 rounded-full bg-espresso/75 text-white text-xs flex items-center justify-center opacity-80 hover:opacity-100 hover:bg-rose-600 transition cursor-pointer"
                title="Remove sketch"
              >
                ×
              </button>
            </div>
          ))}

          <div className="w-48">
            <MediaUpload
              label=""
              folder="measurements"
              value=""
              onChange={(url) =>
                onUpdateField('referenceImages', [...(form.referenceImages ?? []), url])
              }
              hint="Upload sketches or fitting photos"
            />
          </div>
        </div>
      </div>

      {/* Master Craftsman & Posture Directives */}
      <div className="space-y-1">
        <label className="block text-[11px] font-semibold opacity-75 uppercase tracking-wider">
          Master Craftsman & Posture Directives
        </label>
        <textarea
          rows={4}
          value={form.notes}
          onChange={(e) => onUpdateField('notes', e.target.value)}
          placeholder="e.g. Sloping left shoulder, deep back illusion net preference, padded bust cups with princess seam, 2-inch hem allowance..."
          className="w-full rounded-xl border py-2.5 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-focus bg-surface-sunken border-line"
        />
      </div>

      {/* Measured By */}
      <div className="space-y-1">
        <label className="block text-[11px] font-semibold opacity-75 uppercase tracking-wider">
          Recorded By (Tailor / Master)
        </label>
        <input
          type="text"
          value={form.measuredBy}
          onChange={(e) => onUpdateField('measuredBy', e.target.value)}
          placeholder="e.g. Master Tailor Desk"
          className="w-full rounded-xl border py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-focus bg-surface-sunken border-line"
        />
      </div>
    </div>
  );
}
