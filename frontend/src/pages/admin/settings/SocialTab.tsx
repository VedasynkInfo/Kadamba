import type { WebsiteSettings } from '../data';

interface SocialTabProps {
  form: WebsiteSettings;
  patchForm: (updater: (prev: WebsiteSettings) => WebsiteSettings) => void;
}

export function SocialTab({ form, patchForm }: SocialTabProps) {
  const named = form.socialNamed || {
    instagram: '',
    facebook: '',
    youtube: '',
    whatsappLink: '',
    googleBusiness: '',
  };

  function updateNamed(field: keyof typeof named, val: string) {
    patchForm((f) => ({
      ...f,
      socialNamed: {
        ...(f.socialNamed || named),
        [field]: val,
      },
    }));
  }

  return (
    <div className="space-y-6 text-xs">
      {/* Primary Brand Channels */}
      <div
        className="rounded-2xl border p-5 shadow-xs space-y-4 transition-colors bg-surface-raised border-line text-ink-raised"
      >
        <div className="border-b pb-3 border-line">
          <h3 className="font-heading text-sm font-bold tracking-wide">Official Atelier Channels</h3>
          <p className="text-[10px] opacity-60 mt-0.5">
            Key social handles displayed in the public header, lookbook hero, and footer
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold opacity-75 uppercase tracking-wider">
              📸 Instagram Profile
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={named.instagram}
                onChange={(e) => updateNamed('instagram', e.target.value)}
                placeholder="https://www.instagram.com/kadambasdesignerstudio"
                className="flex-1 rounded-xl border py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-brand bg-surface-sunken border-line"
              />
              {named.instagram ? (
                <a
                  href={named.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl border px-3 py-2 text-xs font-semibold hover:bg-current/[0.05] transition border-line"
                >
                  Test ↗
                </a>
              ) : null}
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-semibold opacity-75 uppercase tracking-wider">
              📘 Facebook Page
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={named.facebook}
                onChange={(e) => updateNamed('facebook', e.target.value)}
                placeholder="https://www.facebook.com/kadambasstudio"
                className="flex-1 rounded-xl border py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-brand bg-surface-sunken border-line"
              />
              {named.facebook ? (
                <a
                  href={named.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl border px-3 py-2 text-xs font-semibold hover:bg-current/[0.05] transition border-line"
                >
                  Test ↗
                </a>
              ) : null}
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-semibold opacity-75 uppercase tracking-wider">
              ▶️ YouTube Channel
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={named.youtube}
                onChange={(e) => updateNamed('youtube', e.target.value)}
                placeholder="https://www.youtube.com/@kadambasdesignerstudio"
                className="flex-1 rounded-xl border py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-brand bg-surface-sunken border-line"
              />
              {named.youtube ? (
                <a
                  href={named.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl border px-3 py-2 text-xs font-semibold hover:bg-current/[0.05] transition border-line"
                >
                  Test ↗
                </a>
              ) : null}
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-semibold opacity-75 uppercase tracking-wider">
              📍 Google Business / Maps Listing
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={named.googleBusiness}
                onChange={(e) => updateNamed('googleBusiness', e.target.value)}
                placeholder="https://maps.google.com/?cid=..."
                className="flex-1 rounded-xl border py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-brand bg-surface-sunken border-line"
              />
              {named.googleBusiness ? (
                <a
                  href={named.googleBusiness}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl border px-3 py-2 text-xs font-semibold hover:bg-current/[0.05] transition border-line"
                >
                  Test ↗
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {/* Additional Custom Social Links */}
      <div
        className="rounded-2xl border p-5 shadow-xs space-y-3 transition-colors bg-surface-raised border-line text-ink-raised"
      >
        <div className="flex items-center justify-between border-b pb-3 border-line">
          <div>
            <h3 className="font-heading text-sm font-bold tracking-wide">Additional Media Links</h3>
            <p className="text-[10px] opacity-60 mt-0.5">Pinterest boards, LinkedIn, threads, or boutique portfolio links</p>
          </div>
          <button
            type="button"
            onClick={() =>
              patchForm((f) => ({
                ...f,
                social: [...f.social, { label: 'Pinterest', href: 'https://pinterest.com/' }],
              }))
            }
            className="text-xs font-semibold text-brand hover:underline cursor-pointer"
          >
            + Add Platform
          </button>
        </div>

        <div className="space-y-2">
          {form.social.map((s, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <input
                type="text"
                value={s.label}
                onChange={(e) => {
                  const next = [...form.social];
                  next[idx] = { ...next[idx], label: e.target.value };
                  patchForm((f) => ({ ...f, social: next }));
                }}
                placeholder="Platform Name"
                className="w-36 rounded-xl border py-1.5 px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand bg-surface-sunken border-line"
              />
              <input
                type="url"
                value={s.href}
                onChange={(e) => {
                  const next = [...form.social];
                  next[idx] = { ...next[idx], href: e.target.value };
                  patchForm((f) => ({ ...f, social: next }));
                }}
                placeholder="https://..."
                className="flex-1 rounded-xl border py-1.5 px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand bg-surface-sunken border-line"
              />
              <button
                type="button"
                onClick={() =>
                  patchForm((f) => ({
                    ...f,
                    social: f.social.filter((_, i) => i !== idx),
                  }))
                }
                className="p-1.5 text-xs opacity-50 hover:opacity-100 text-rose-400 cursor-pointer"
                title="Remove platform"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
