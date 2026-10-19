import { Icon } from '@/components/icons';
import type { WebsiteSettings } from '../data';
import { MediaUpload } from '../components/MediaUpload';

interface GeneralTabProps {
  form: WebsiteSettings;
  patchForm: (updater: (prev: WebsiteSettings) => WebsiteSettings) => void;
}

export function GeneralTab({ form, patchForm }: GeneralTabProps) {
  return (
    <div className="space-y-6 text-xs">
      {/* Sync Notice Card */}
      <div
        className="rounded-xl border p-4 shadow-xs flex items-start gap-3 transition-colors bg-brand/[0.08] border-brand/25 text-ink-raised"
      >
        <span className="text-lg">
          <Icon name="info" size={18} />
        </span>
        <div>
          <h4 className="font-semibold text-xs text-brand">
            Live Public Site Synchronization
          </h4>
          <p className="text-[11px] opacity-75 mt-0.5">
            Studio identity, addresses, phone numbers, WhatsApp, and operating hours set here automatically reflect across the public storefront, contact page, and footer without rebuilds.
          </p>
        </div>
      </div>

      {/* Brand Identity */}
      <div
        className="rounded-2xl border p-5 shadow-xs space-y-4 transition-colors bg-surface-raised border-line text-ink-raised"
      >
        <div className="border-b pb-3 border-line">
          <h3 className="font-heading text-sm font-bold tracking-wide">Brand & Studio Identity</h3>
          <p className="text-[10px] opacity-60 mt-0.5">Primary public boutique branding & descriptive tagline</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold opacity-75 uppercase tracking-wider">
              Studio / Brand Name *
            </label>
            <input
              type="text"
              required
              value={form.studioName}
              onChange={(e) => patchForm((f) => ({ ...f, studioName: e.target.value }))}
              placeholder="Kadamba's Designer Studio"
              className="w-full rounded-xl border py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-brand bg-surface-sunken border-line"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-semibold opacity-75 uppercase tracking-wider">
              Short Name
            </label>
            <input
              type="text"
              value={form.shortName}
              onChange={(e) => patchForm((f) => ({ ...f, shortName: e.target.value }))}
              placeholder="Kadamba"
              className="w-full rounded-xl border py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-brand bg-surface-sunken border-line"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold opacity-75 uppercase tracking-wider">
              Tagline
            </label>
            <input
              type="text"
              value={form.tagline}
              onChange={(e) => patchForm((f) => ({ ...f, tagline: e.target.value }))}
              placeholder="Bespoke Couture & Bridal Atelier"
              className="w-full rounded-xl border py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-brand bg-surface-sunken border-line"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-semibold opacity-75 uppercase tracking-wider">
              Location Phrase
            </label>
            <input
              type="text"
              value={form.location}
              onChange={(e) => patchForm((f) => ({ ...f, location: e.target.value }))}
              placeholder="Kurnool & Hyderabad"
              className="w-full rounded-xl border py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-brand bg-surface-sunken border-line"
            />
          </div>
        </div>

        {/* Logos */}
        <div className="pt-2 border-t grid grid-cols-1 sm:grid-cols-2 gap-4 border-line">
          <MediaUpload
            label="Logo (Light Backgrounds)"
            value={form.logoUrl}
            folder="brand"
            onChange={(url) => patchForm((f) => ({ ...f, logoUrl: url }))}
            hint="Recommended transparent PNG or SVG"
          />
          <MediaUpload
            label="Logo (Dark Backgrounds)"
            value={form.logoDarkUrl}
            folder="brand"
            onChange={(url) => patchForm((f) => ({ ...f, logoDarkUrl: url }))}
            hint="Light typography logo for dark themes"
          />
        </div>
      </div>

      {/* Communications & Phones */}
      <div
        className="rounded-2xl border p-5 shadow-xs space-y-4 transition-colors bg-surface-raised border-line text-ink-raised"
      >
        <div className="border-b pb-3 border-line">
          <h3 className="font-heading text-sm font-bold tracking-wide">Contact & Instant Channels</h3>
          <p className="text-[10px] opacity-60 mt-0.5">Direct phone numbers, client email, and WhatsApp prefill message</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold opacity-75 uppercase tracking-wider">
              Primary Phone (Display) *
            </label>
            <input
              type="text"
              required
              value={form.phoneDisplay}
              onChange={(e) => patchForm((f) => ({ ...f, phoneDisplay: e.target.value }))}
              placeholder="+91 98765 43210"
              className="w-full rounded-xl border py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-brand bg-surface-sunken border-line"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-semibold opacity-75 uppercase tracking-wider">
              Phone Tel Link (Dial)
            </label>
            <input
              type="text"
              value={form.phoneTel}
              onChange={(e) => patchForm((f) => ({ ...f, phoneTel: e.target.value }))}
              placeholder="+919876543210"
              className="w-full rounded-xl border py-2 px-3 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-brand bg-surface-sunken border-line"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-semibold opacity-75 uppercase tracking-wider">
              Official Email *
            </label>
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => patchForm((f) => ({ ...f, email: e.target.value }))}
              placeholder="concierge@kadambadesigner.com"
              className="w-full rounded-xl border py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-brand bg-surface-sunken border-line"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-line">
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold opacity-75 uppercase tracking-wider">
              WhatsApp Business Number
            </label>
            <input
              type="text"
              value={form.whatsappNumber}
              onChange={(e) => patchForm((f) => ({ ...f, whatsappNumber: e.target.value }))}
              placeholder="919876543210 (with country code, no +)"
              className="w-full rounded-xl border py-2 px-3 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-brand bg-surface-sunken border-line"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-semibold opacity-75 uppercase tracking-wider">
              WhatsApp Prefilled Greeting
            </label>
            <input
              type="text"
              value={form.whatsappPrefill}
              onChange={(e) => patchForm((f) => ({ ...f, whatsappPrefill: e.target.value }))}
              placeholder="Hello Kadamba Studio! I would like to book a consultation."
              className="w-full rounded-xl border py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-brand bg-surface-sunken border-line"
            />
          </div>
        </div>
      </div>

      {/* Atelier Address & Operating Hours */}
      <div
        className="rounded-2xl border p-5 shadow-xs space-y-4 transition-colors bg-surface-raised border-line text-ink-raised"
      >
        <div className="border-b pb-3 border-line">
          <h3 className="font-heading text-sm font-bold tracking-wide">Boutique Address & Operating Schedule</h3>
          <p className="text-[10px] opacity-60 mt-0.5">Physical location lines, map coordinates, and daily studio hours</p>
        </div>

        <div className="space-y-1">
          <label className="block text-[11px] font-semibold opacity-75 uppercase tracking-wider">
            Address Lines (One per row)
          </label>
          <textarea
            rows={3}
            value={form.addressLines.join('\n')}
            onChange={(e) => patchForm((f) => ({ ...f, addressLines: e.target.value.split('\n') }))}
            placeholder="Plot 42, Road No 10, Jubilee Hills"
            className="w-full rounded-xl border py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-brand bg-surface-sunken border-line"
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold opacity-75 uppercase tracking-wider">City</label>
            <input
              type="text"
              value={form.city}
              onChange={(e) => patchForm((f) => ({ ...f, city: e.target.value }))}
              className="w-full rounded-xl border py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-brand bg-surface-sunken border-line"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold opacity-75 uppercase tracking-wider">State</label>
            <input
              type="text"
              value={form.state}
              onChange={(e) => patchForm((f) => ({ ...f, state: e.target.value }))}
              className="w-full rounded-xl border py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-brand bg-surface-sunken border-line"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold opacity-75 uppercase tracking-wider">Pincode</label>
            <input
              type="text"
              value={form.pincode}
              onChange={(e) => patchForm((f) => ({ ...f, pincode: e.target.value }))}
              className="w-full rounded-xl border py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-brand bg-surface-sunken border-line"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold opacity-75 uppercase tracking-wider">Landmark</label>
            <input
              type="text"
              value={form.landmark}
              onChange={(e) => patchForm((f) => ({ ...f, landmark: e.target.value }))}
              className="w-full rounded-xl border py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-brand bg-surface-sunken border-line"
            />
          </div>
        </div>

        {/* Operating Hours Editor */}
        <div className="pt-2 border-t space-y-2 border-line">
          <div className="flex justify-between items-center">
            <label className="block text-[11px] font-semibold opacity-75 uppercase tracking-wider">
              Operating Hours
            </label>
            <button
              type="button"
              onClick={() =>
                patchForm((f) => ({
                  ...f,
                  hours: [...f.hours, { day: 'Sunday', time: '11:00 AM - 5:00 PM' }],
                }))
              }
              className="text-xs font-semibold text-brand hover:underline cursor-pointer"
            >
              + Add Day
            </button>
          </div>

          <div className="space-y-2">
            {form.hours.map((h, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  value={h.day}
                  onChange={(e) => {
                    const next = [...form.hours];
                    next[idx] = { ...next[idx], day: e.target.value };
                    patchForm((f) => ({ ...f, hours: next }));
                  }}
                  placeholder="e.g. Mon - Sat"
                  className="w-36 rounded-xl border py-1.5 px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand bg-surface-sunken border-line"
                />
                <input
                  type="text"
                  value={h.time}
                  onChange={(e) => {
                    const next = [...form.hours];
                    next[idx] = { ...next[idx], time: e.target.value };
                    patchForm((f) => ({ ...f, hours: next }));
                  }}
                  placeholder="e.g. 10:00 AM - 8:00 PM"
                  className="flex-1 rounded-xl border py-1.5 px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand bg-surface-sunken border-line"
                />
                <button
                  type="button"
                  onClick={() =>
                    patchForm((f) => ({
                      ...f,
                      hours: f.hours.filter((_, i) => i !== idx),
                    }))
                  }
                  className="p-1.5 text-xs opacity-50 hover:opacity-100 text-rose-400 cursor-pointer"
                  title="Remove row"
                >
                  <Icon name="close" size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
