import type { WebsiteSettings } from '../data';
import { Select } from '@/components/ui';

interface MediaTabProps {
  form: WebsiteSettings;
  patchForm: (updater: (prev: WebsiteSettings) => WebsiteSettings) => void;
}

export function MediaTab({ form, patchForm }: MediaTabProps) {
  const maxMb = Math.round((form.media?.maxUploadBytes || 5242880) / (1024 * 1024));

  return (
    <div className="space-y-6 text-xs">
      {/* Upload Limits & Processing */}
      <div
        className="rounded-2xl border p-5 shadow-xs space-y-4 transition-colors bg-surface-raised border-line text-ink-raised"
      >
        <div className="border-b pb-3 border-line">
          <h3 className="font-heading text-sm font-bold tracking-wide">Media & Storage Rules</h3>
          <p className="text-[10px] opacity-70 mt-0.5">Asset upload limits, CDN compression, and format requirements</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold opacity-75 uppercase tracking-wider">
              Max Upload Size (MB)
            </label>
            <input
              type="number"
              min="1"
              max="50"
              value={maxMb}
              onChange={(e) => {
                const mb = Number(e.target.value) || 5;
                patchForm((f) => ({
                  ...f,
                  media: { ...f.media, maxUploadBytes: mb * 1024 * 1024 },
                }));
              }}
              className="w-full rounded-xl border py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-focus bg-surface-sunken border-line"
            />
            <span className="text-[10px] opacity-70 block mt-0.5">
              Applies to lookbook pictures, gallery items, and customer fit photos
            </span>
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-semibold opacity-75 uppercase tracking-wider">
              Default Dimension Unit
            </label>
            <Select
              value={form.media?.defaultUnit || 'in'}
              onChange={(value) =>
                patchForm((f) => ({
                  ...f,
                  media: { ...f.media, defaultUnit: value as 'in' | 'cm' },
                }))
              }
              options={[{ value: 'in', label: 'Inches (Standard Indian Couture)' }, { value: 'cm', label: 'Centimeters (Metric)' }]}
            />
          </div>
        </div>
      </div>

      {/* Preset Aspect Ratios */}
      <div
        className="rounded-2xl border p-5 shadow-xs space-y-4 transition-colors bg-surface-raised border-line text-ink-raised"
      >
        <div className="border-b pb-3 border-line">
          <h3 className="font-heading text-sm font-bold tracking-wide">Lookbook & Banner Presets</h3>
          <p className="text-[10px] opacity-70 mt-0.5">Target canvas resolutions used for responsive atelier media</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {(form.media?.bannerPresets || []).map((preset, idx) => (
            <div
              key={idx}
              className="rounded-xl border p-3.5 space-y-1 border-line bg-surface-sunken"
            >
              <span className="font-bold text-xs block">{preset.label}</span>
              <div className="flex justify-between text-[11px] opacity-65 font-mono">
                <span>{preset.width} × {preset.height} px</span>
                <span>{preset.aspect}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
