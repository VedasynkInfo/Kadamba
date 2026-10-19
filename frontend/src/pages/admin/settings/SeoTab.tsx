import type { WebsiteSettings } from '../data';
import { MediaUpload } from '../components/MediaUpload';

interface SeoTabProps {
  form: WebsiteSettings;
  patchForm: (updater: (prev: WebsiteSettings) => WebsiteSettings) => void;
}

export function SeoTab({ form, patchForm }: SeoTabProps) {
  const previewTitle = form.seo.titleTemplate
    .replace('{{title}}', 'Bridal Couture & Handcrafted Lehengas')
    .replace('{{siteName}}', form.seo.siteName || form.studioName);

  return (
    <div className="space-y-6 text-xs">
      {/* Live Google Search Snippet Preview */}
      <div
        className="rounded-2xl border p-5 shadow-xs transition-colors"
        style={{
          backgroundColor: 'var(--admin-card, #141b26)',
          borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.18))',
          color: 'var(--admin-card-text, var(--admin-text, #f3f4f6))',
        }}
      >
        <div className="border-b pb-3 mb-4" style={{ borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.15))' }}>
          <h3 className="font-heading text-sm font-bold tracking-wide">Google Search Snippet Simulation</h3>
          <p className="text-[10px] opacity-60 mt-0.5">Real-time preview of how your atelier appears in search engine results</p>
        </div>

        <div
          className="rounded-xl border p-4 max-w-xl space-y-1.5"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.25)',
            borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.2))',
          }}
        >
          <div className="flex items-center gap-2">
            <span className="h-4 w-4 rounded-full bg-[var(--admin-primary,#b59410)] flex items-center justify-center text-[9px] text-white font-bold">
              K
            </span>
            <span className="text-[11px] opacity-60 font-mono">
              https://kadambasdesignerstudio.com › couture
            </span>
          </div>
          <h4 className="text-sm font-bold text-blue-400 hover:underline cursor-pointer truncate">
            {previewTitle}
          </h4>
          <p className="text-[11px] opacity-75 line-clamp-2 leading-relaxed">
            {form.seo.defaultDescription || 'Bespoke bridal lehengas, maggam work blouses, and handcrafted couture designed to perfection at Kadamba Studio.'}
          </p>
        </div>
      </div>

      {/* Meta Configuration */}
      <div
        className="rounded-2xl border p-5 shadow-xs space-y-4 transition-colors"
        style={{
          backgroundColor: 'var(--admin-card, #141b26)',
          borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.18))',
          color: 'var(--admin-card-text, var(--admin-text, #f3f4f6))',
        }}
      >
        <div className="border-b pb-3" style={{ borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.15))' }}>
          <h3 className="font-heading text-sm font-bold tracking-wide">Search Engine Metadata</h3>
          <p className="text-[10px] opacity-60 mt-0.5">Global title templates, default descriptions, and crawl directives</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold opacity-75 uppercase tracking-wider">
              Site Brand Name (for SEO)
            </label>
            <input
              type="text"
              value={form.seo.siteName}
              onChange={(e) =>
                patchForm((f) => ({
                  ...f,
                  seo: { ...f.seo, siteName: e.target.value },
                }))
              }
              placeholder="Kadamba's Designer Studio"
              className="w-full rounded-xl border py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--admin-primary,#b59410)]"
              style={{
                backgroundColor: 'rgba(128, 128, 128, 0.05)',
                borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.25))',
                color: 'inherit',
              }}
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-semibold opacity-75 uppercase tracking-wider">
              Title Template
            </label>
            <input
              type="text"
              value={form.seo.titleTemplate}
              onChange={(e) =>
                patchForm((f) => ({
                  ...f,
                  seo: { ...f.seo, titleTemplate: e.target.value },
                }))
              }
              placeholder="{{title}} | {{siteName}}"
              className="w-full rounded-xl border py-2 px-3 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[var(--admin-primary,#b59410)]"
              style={{
                backgroundColor: 'rgba(128, 128, 128, 0.05)',
                borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.25))',
                color: 'inherit',
              }}
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="block text-[11px] font-semibold opacity-75 uppercase tracking-wider">
            Default Meta Description
          </label>
          <textarea
            rows={3}
            value={form.seo.defaultDescription}
            onChange={(e) =>
              patchForm((f) => ({
                ...f,
                seo: { ...f.seo, defaultDescription: e.target.value },
              }))
            }
            placeholder="Luxury bespoke atelier specializing in bridal lehengas, hand embroidery, maggam art, and couture tailoring."
            className="w-full rounded-xl border py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--admin-primary,#b59410)]"
            style={{
              backgroundColor: 'rgba(128, 128, 128, 0.05)',
              borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.25))',
              color: 'inherit',
            }}
          />
        </div>

        <div className="pt-2 border-t" style={{ borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.15))' }}>
          <MediaUpload
            label="Default OpenGraph / Social Share Image"
            value={form.seo.defaultOgImage}
            folder="seo"
            onChange={(url) =>
              patchForm((f) => ({
                ...f,
                seo: { ...f.seo, defaultOgImage: url },
              }))
            }
            hint="Recommended 1200x630px JPG or PNG for WhatsApp, iMessage, and Twitter previews"
          />
        </div>

        <div className="pt-2 border-t flex items-center justify-between" style={{ borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.15))' }}>
          <div>
            <span className="font-semibold text-xs block">Allow Search Engine Indexing (robots.txt)</span>
            <span className="text-[11px] opacity-60 block mt-0.5">
              Disable this only if the atelier site is in private staging or maintenance mode
            </span>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={form.seo.robotsIndex}
              onChange={(e) =>
                patchForm((f) => ({
                  ...f,
                  seo: { ...f.seo, robotsIndex: e.target.checked },
                }))
              }
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--admin-primary,#b59410)]" />
          </label>
        </div>
      </div>
    </div>
  );
}
