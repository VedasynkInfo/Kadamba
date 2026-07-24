import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Input, Textarea, useToast } from '@/components/ui';
import { settingsApi } from '@/services/settings/settingsService';
import { cn } from '@/utils/cn';
import { useAdminContent } from '../AdminContentContext';
import { AdminHorizonBanner } from '../components/AdminHorizonBanner';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { MediaUpload } from '../components/MediaUpload';
import { adminBanners, defaultWebsiteSettings, type WebsiteSettings } from '../data';

type TabId = 'general' | 'seo' | 'social' | 'media' | 'email' | 'theme' | 'staff';

const TABS: { id: TabId; label: string }[] = [
  { id: 'general', label: 'General' },
  { id: 'seo', label: 'SEO' },
  { id: 'social', label: 'Social' },
  { id: 'media', label: 'Media sizes' },
  { id: 'email', label: 'Email' },
  { id: 'theme', label: 'Theme' },
  { id: 'staff', label: 'Staff & roles' },
];

function isHex(value: string) {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value.trim());
}

export default function SettingsAdminPage() {
  const { settings, saveSettings, resetSettings } = useAdminContent();
  const { toast } = useToast();
  const [tab, setTab] = useState<TabId>('general');
  const [form, setForm] = useState<WebsiteSettings>(() => structuredClone(settings));
  const [dirty, setDirty] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [themeResetOpen, setThemeResetOpen] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [testTo, setTestTo] = useState('');
  const [editingTemplate, setEditingTemplate] = useState<string | null>(null);

  useEffect(() => {
    if (dirty) return;
    setForm(structuredClone(settings));
  }, [settings, dirty]);

  function patchForm(updater: (prev: WebsiteSettings) => WebsiteSettings) {
    setDirty(true);
    setForm(updater);
  }

  async function save() {
    if (!form.studioName.trim()) {
      toast({ tone: 'error', title: 'Company name is required' });
      setTab('general');
      return;
    }
    if (!form.phoneDisplay.trim() || !form.email.trim()) {
      toast({ tone: 'error', title: 'Phone and email are required' });
      setTab('general');
      return;
    }
    if (form.theme.primary && !isHex(form.theme.primary)) {
      toast({ tone: 'error', title: 'Theme primary must be a valid hex color' });
      setTab('theme');
      return;
    }
    if (form.theme.accent && !isHex(form.theme.accent)) {
      toast({ tone: 'error', title: 'Theme accent must be a valid hex color' });
      setTab('theme');
      return;
    }

    try {
      await saveSettings({
        ...form,
        addressLines: form.addressLines.map((l) => l.trim()).filter(Boolean),
        hours: form.hours.filter((h) => h.day.trim() && h.time.trim()),
        social: form.social.filter((s) => s.label.trim() && s.href.trim()),
      });
      setDirty(false);
      toast({ tone: 'success', title: 'Settings saved', description: 'Public site will pick these up on next load.' });
    } catch (err) {
      toast({
        tone: 'error',
        title: 'Could not save settings',
        description: err instanceof Error ? err.message : undefined,
      });
    }
  }

  async function runTestEmail() {
    setTestingEmail(true);
    try {
      // Persist email config first so test uses latest SMTP
      if (dirty) await save();
      const result = await settingsApi.testEmail(testTo || undefined);
      toast({
        tone: 'success',
        title: 'Test email sent',
        description: `Delivered to ${result.to}`,
      });
    } catch (err) {
      toast({
        tone: 'error',
        title: 'SMTP test failed',
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setTestingEmail(false);
    }
  }

  return (
    <>
      <AdminHorizonBanner
        title={adminBanners.settings.title}
        copy={adminBanners.settings.copy}
        actionLabel={dirty ? 'Save changes' : adminBanners.settings.actionLabel}
        onAction={save}
      />

      <section className="mx-auto max-w-4xl space-y-6 px-4 py-10 sm:px-6 md:px-10">
        <nav className="flex gap-1 overflow-x-auto border-b border-black/10 pb-1" aria-label="Settings sections">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                'shrink-0 px-3 py-2 text-xs uppercase tracking-[0.14em] transition',
                tab === t.id
                  ? 'border-b-2 border-black text-black'
                  : 'text-black/45 hover:text-black',
              )}
            >
              {t.label}
            </button>
          ))}
        </nav>

        {tab === 'general' ? (
          <div className="space-y-6">
            <div className="rounded-md border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-950">
              <p className="font-medium">Public site sync</p>
              <p className="mt-1 text-amber-900/80">
                Phone, address, email, WhatsApp, logo, and hours on this tab drive the public footer
                and contact page — no redeploy needed after save.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Company / studio name *"
                value={form.studioName}
                onChange={(e) => patchForm((f) => ({ ...f, studioName: e.target.value }))}
              />
              <Input
                label="Short name"
                value={form.shortName}
                onChange={(e) => patchForm((f) => ({ ...f, shortName: e.target.value }))}
              />
              <Input
                label="Tagline"
                value={form.tagline}
                onChange={(e) => patchForm((f) => ({ ...f, tagline: e.target.value }))}
                className="sm:col-span-2"
              />
              <Input
                label="Location phrase"
                value={form.location}
                onChange={(e) => patchForm((f) => ({ ...f, location: e.target.value }))}
              />
              <Input
                label="Email *"
                type="email"
                value={form.email}
                onChange={(e) => patchForm((f) => ({ ...f, email: e.target.value }))}
              />
              <Input
                label="Phone display *"
                value={form.phoneDisplay}
                onChange={(e) => patchForm((f) => ({ ...f, phoneDisplay: e.target.value }))}
              />
              <Input
                label="Phone tel (dial)"
                value={form.phoneTel}
                onChange={(e) => patchForm((f) => ({ ...f, phoneTel: e.target.value }))}
              />
              <Input
                label="Alternate phone display"
                value={form.phoneAltDisplay}
                onChange={(e) => patchForm((f) => ({ ...f, phoneAltDisplay: e.target.value }))}
              />
              <Input
                label="Alternate phone tel"
                value={form.phoneAltTel}
                onChange={(e) => patchForm((f) => ({ ...f, phoneAltTel: e.target.value }))}
              />
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <MediaUpload
                label="Logo (light backgrounds)"
                value={form.logoUrl}
                folder="brand"
                onChange={(url) => patchForm((f) => ({ ...f, logoUrl: url }))}
                hint="Recommended transparent PNG"
              />
              <MediaUpload
                label="Logo (dark backgrounds)"
                value={form.logoDarkUrl}
                folder="brand"
                onChange={(url) => patchForm((f) => ({ ...f, logoDarkUrl: url }))}
              />
            </div>

            <Textarea
              label="Address lines (one per row)"
              rows={3}
              value={form.addressLines.join('\n')}
              onChange={(e) =>
                patchForm((f) => ({ ...f, addressLines: e.target.value.split('\n') }))
              }
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Landmark"
                value={form.landmark}
                onChange={(e) => patchForm((f) => ({ ...f, landmark: e.target.value }))}
              />
              <Input
                label="Locality"
                value={form.locality}
                onChange={(e) => patchForm((f) => ({ ...f, locality: e.target.value }))}
              />
              <Input
                label="City"
                value={form.city}
                onChange={(e) => patchForm((f) => ({ ...f, city: e.target.value }))}
              />
              <Input
                label="State"
                value={form.state}
                onChange={(e) => patchForm((f) => ({ ...f, state: e.target.value }))}
              />
              <Input
                label="Pincode"
                value={form.pincode}
                onChange={(e) => patchForm((f) => ({ ...f, pincode: e.target.value }))}
              />
              <Input
                label="WhatsApp number"
                value={form.whatsappNumber}
                onChange={(e) => patchForm((f) => ({ ...f, whatsappNumber: e.target.value }))}
              />
              <Input
                label="Map link"
                value={form.mapLink}
                onChange={(e) => patchForm((f) => ({ ...f, mapLink: e.target.value }))}
                className="sm:col-span-2"
              />
              <Input
                label="Map embed URL"
                value={form.mapEmbedUrl}
                onChange={(e) => patchForm((f) => ({ ...f, mapEmbedUrl: e.target.value }))}
                className="sm:col-span-2"
              />
            </div>
            <Textarea
              label="WhatsApp prefill message"
              rows={2}
              value={form.whatsappPrefill}
              onChange={(e) => patchForm((f) => ({ ...f, whatsappPrefill: e.target.value }))}
            />

            <div className="space-y-3">
              <p className="text-sm font-medium text-black">Business hours</p>
              {form.hours.map((row, idx) => (
                <div key={idx} className="grid gap-3 sm:grid-cols-2">
                  <Input
                    label={idx === 0 ? 'Day' : undefined}
                    value={row.day}
                    onChange={(e) =>
                      patchForm((f) => {
                        const hours = [...f.hours];
                        hours[idx] = { ...hours[idx], day: e.target.value };
                        return { ...f, hours };
                      })
                    }
                  />
                  <Input
                    label={idx === 0 ? 'Time' : undefined}
                    value={row.time}
                    onChange={(e) =>
                      patchForm((f) => {
                        const hours = [...f.hours];
                        hours[idx] = { ...hours[idx], time: e.target.value };
                        return { ...f, hours };
                      })
                    }
                  />
                </div>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  patchForm((f) => ({ ...f, hours: [...f.hours, { day: '', time: '' }] }))
                }
              >
                Add hours row
              </Button>
            </div>
          </div>
        ) : null}

        {tab === 'seo' ? (
          <div className="space-y-4">
            <p className="text-sm text-black/60">
              Defaults for Module 12 SEO generators and page meta fallbacks.
            </p>
            <Input
              label="Site name"
              value={form.seo.siteName}
              onChange={(e) =>
                patchForm((f) => ({ ...f, seo: { ...f.seo, siteName: e.target.value } }))
              }
            />
            <Input
              label="Title template"
              value={form.seo.titleTemplate}
              onChange={(e) =>
                patchForm((f) => ({ ...f, seo: { ...f.seo, titleTemplate: e.target.value } }))
              }
              hint="Use {{title}} and {{siteName}}"
            />
            <Textarea
              label="Default meta description"
              rows={3}
              value={form.seo.defaultDescription}
              onChange={(e) =>
                patchForm((f) => ({
                  ...f,
                  seo: { ...f.seo, defaultDescription: e.target.value },
                }))
              }
            />
            <MediaUpload
              label="Default OG image"
              value={form.seo.defaultOgImage}
              folder="seo"
              onChange={(url) =>
                patchForm((f) => ({ ...f, seo: { ...f.seo, defaultOgImage: url } }))
              }
            />
            <Input
              label="Locality phrase"
              value={form.seo.localityPhrase}
              onChange={(e) =>
                patchForm((f) => ({ ...f, seo: { ...f.seo, localityPhrase: e.target.value } }))
              }
            />
            <label className="flex items-center gap-2 text-sm text-black/80">
              <input
                type="checkbox"
                checked={form.seo.robotsIndex}
                onChange={(e) =>
                  patchForm((f) => ({
                    ...f,
                    seo: { ...f.seo, robotsIndex: e.target.checked },
                  }))
                }
              />
              Allow search indexing (robots)
            </label>
          </div>
        ) : null}

        {tab === 'social' ? (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {(
                [
                  ['instagram', 'Instagram'],
                  ['facebook', 'Facebook'],
                  ['youtube', 'YouTube'],
                  ['whatsappLink', 'WhatsApp link'],
                  ['googleBusiness', 'Google Business'],
                ] as const
              ).map(([key, label]) => (
                <Input
                  key={key}
                  label={label}
                  value={form.socialNamed[key]}
                  onChange={(e) =>
                    patchForm((f) => ({
                      ...f,
                      socialNamed: { ...f.socialNamed, [key]: e.target.value },
                    }))
                  }
                />
              ))}
            </div>
            <div className="space-y-3">
              <p className="text-sm font-medium text-black">Extra footer links</p>
              {form.social.map((row, idx) => (
                <div key={idx} className="grid gap-3 sm:grid-cols-2">
                  <Input
                    label={idx === 0 ? 'Label' : undefined}
                    value={row.label}
                    onChange={(e) =>
                      patchForm((f) => {
                        const social = [...f.social];
                        social[idx] = { ...social[idx], label: e.target.value };
                        return { ...f, social };
                      })
                    }
                  />
                  <Input
                    label={idx === 0 ? 'URL' : undefined}
                    value={row.href}
                    onChange={(e) =>
                      patchForm((f) => {
                        const social = [...f.social];
                        social[idx] = { ...social[idx], href: e.target.value };
                        return { ...f, social };
                      })
                    }
                  />
                </div>
              ))}
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  patchForm((f) => ({
                    ...f,
                    social: [...f.social, { label: '', href: '' }],
                  }))
                }
              >
                Add social link
              </Button>
            </div>
          </div>
        ) : null}

        {tab === 'media' ? (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="mb-1.5 block font-medium text-black/80">Default measurement unit</span>
                <select
                  className="w-full rounded-sm border border-black/15 bg-cream px-3 py-2"
                  value={form.media.defaultUnit}
                  onChange={(e) =>
                    patchForm((f) => ({
                      ...f,
                      media: {
                        ...f.media,
                        defaultUnit: e.target.value as 'in' | 'cm',
                      },
                    }))
                  }
                >
                  <option value="in">Inches (in)</option>
                  <option value="cm">Centimetres (cm)</option>
                </select>
              </label>
              <Input
                label="Max upload size (bytes)"
                type="number"
                value={String(form.media.maxUploadBytes)}
                onChange={(e) =>
                  patchForm((f) => ({
                    ...f,
                    media: {
                      ...f.media,
                      maxUploadBytes: Number(e.target.value) || f.media.maxUploadBytes,
                    },
                  }))
                }
              />
            </div>
            <div>
              <p className="text-sm font-medium text-black">Banner size presets</p>
              <p className="mt-1 text-xs text-black/50">
                Shown as guidance when uploading CMS / gallery imagery.
              </p>
              <ul className="mt-4 divide-y divide-black/10 border border-black/10 rounded-md">
                {form.media.bannerPresets.map((p, idx) => (
                  <li key={`${p.label}-${idx}`} className="grid gap-2 px-4 py-3 sm:grid-cols-4">
                    <Input
                      label={idx === 0 ? 'Label' : undefined}
                      value={p.label}
                      onChange={(e) =>
                        patchForm((f) => {
                          const bannerPresets = [...f.media.bannerPresets];
                          bannerPresets[idx] = { ...bannerPresets[idx], label: e.target.value };
                          return { ...f, media: { ...f.media, bannerPresets } };
                        })
                      }
                    />
                    <Input
                      label={idx === 0 ? 'Width' : undefined}
                      type="number"
                      value={String(p.width)}
                      onChange={(e) =>
                        patchForm((f) => {
                          const bannerPresets = [...f.media.bannerPresets];
                          bannerPresets[idx] = {
                            ...bannerPresets[idx],
                            width: Number(e.target.value) || 0,
                          };
                          return { ...f, media: { ...f.media, bannerPresets } };
                        })
                      }
                    />
                    <Input
                      label={idx === 0 ? 'Height' : undefined}
                      type="number"
                      value={String(p.height)}
                      onChange={(e) =>
                        patchForm((f) => {
                          const bannerPresets = [...f.media.bannerPresets];
                          bannerPresets[idx] = {
                            ...bannerPresets[idx],
                            height: Number(e.target.value) || 0,
                          };
                          return { ...f, media: { ...f.media, bannerPresets } };
                        })
                      }
                    />
                    <Input
                      label={idx === 0 ? 'Aspect' : undefined}
                      value={p.aspect || ''}
                      onChange={(e) =>
                        patchForm((f) => {
                          const bannerPresets = [...f.media.bannerPresets];
                          bannerPresets[idx] = { ...bannerPresets[idx], aspect: e.target.value };
                          return { ...f, media: { ...f.media, bannerPresets } };
                        })
                      }
                    />
                  </li>
                ))}
              </ul>
              <Button
                variant="ghost"
                size="sm"
                className="mt-3"
                onClick={() =>
                  patchForm((f) => ({
                    ...f,
                    media: {
                      ...f.media,
                      bannerPresets: [
                        ...f.media.bannerPresets,
                        { label: 'Custom', width: 1200, height: 800, aspect: '' },
                      ],
                    },
                  }))
                }
              >
                Add preset
              </Button>
            </div>
          </div>
        ) : null}

        {tab === 'email' ? (
          <div className="space-y-6">
            <p className="text-sm text-black/60">
              SMTP used for notifications. Password is never returned in plain text — leave blank
              to keep the current secret.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="SMTP host"
                value={form.emailConfig?.host || ''}
                onChange={(e) =>
                  patchForm((f) => ({
                    ...f,
                    emailConfig: { ...f.emailConfig!, host: e.target.value },
                  }))
                }
              />
              <Input
                label="Port"
                type="number"
                value={String(form.emailConfig?.port ?? 587)}
                onChange={(e) =>
                  patchForm((f) => ({
                    ...f,
                    emailConfig: {
                      ...f.emailConfig!,
                      port: Number(e.target.value) || 587,
                    },
                  }))
                }
              />
              <Input
                label="Auth user"
                value={form.emailConfig?.user || ''}
                onChange={(e) =>
                  patchForm((f) => ({
                    ...f,
                    emailConfig: { ...f.emailConfig!, user: e.target.value },
                  }))
                }
              />
              <Input
                label={
                  form.emailConfig?.passSet
                    ? 'Password (set — enter new to change)'
                    : 'Password'
                }
                type="password"
                value={
                  form.emailConfig?.pass === '••••••••' ? '' : form.emailConfig?.pass || ''
                }
                onChange={(e) =>
                  patchForm((f) => ({
                    ...f,
                    emailConfig: { ...f.emailConfig!, pass: e.target.value },
                  }))
                }
                autoComplete="new-password"
              />
              <Input
                label="From name"
                value={form.emailConfig?.fromName || ''}
                onChange={(e) =>
                  patchForm((f) => ({
                    ...f,
                    emailConfig: { ...f.emailConfig!, fromName: e.target.value },
                  }))
                }
              />
              <Input
                label="From email"
                type="email"
                value={form.emailConfig?.fromEmail || ''}
                onChange={(e) =>
                  patchForm((f) => ({
                    ...f,
                    emailConfig: { ...f.emailConfig!, fromEmail: e.target.value },
                  }))
                }
              />
              <Input
                label="Admin inbox (notifications)"
                type="email"
                value={form.emailConfig?.adminTo || ''}
                onChange={(e) =>
                  patchForm((f) => ({
                    ...f,
                    emailConfig: { ...f.emailConfig!, adminTo: e.target.value },
                  }))
                }
                className="sm:col-span-2"
              />
              <label className="flex items-center gap-2 text-sm sm:col-span-2">
                <input
                  type="checkbox"
                  checked={Boolean(form.emailConfig?.secure)}
                  onChange={(e) =>
                    patchForm((f) => ({
                      ...f,
                      emailConfig: { ...f.emailConfig!, secure: e.target.checked },
                    }))
                  }
                />
                Use TLS/SSL (secure)
              </label>
            </div>

            <div className="flex flex-wrap items-end gap-3 border border-black/10 bg-black/[0.02] p-4">
              <Input
                label="Test recipient (optional)"
                type="email"
                value={testTo}
                onChange={(e) => setTestTo(e.target.value)}
                className="min-w-[220px] flex-1"
              />
              <Button variant="secondary" onClick={() => void runTestEmail()} disabled={testingEmail}>
                {testingEmail ? 'Sending…' : 'Send test email'}
              </Button>
            </div>

            <div>
              <p className="text-sm font-medium text-black">Email templates</p>
              <ul className="mt-3 divide-y divide-black/10 border border-black/10">
                {(form.emailConfig?.templates || []).map((tpl, idx) => (
                  <li key={tpl.key} className="px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="font-mono text-xs text-black/45">{tpl.key}</p>
                        <p className="text-sm text-black">{tpl.subject}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setEditingTemplate(editingTemplate === tpl.key ? null : tpl.key)
                        }
                      >
                        {editingTemplate === tpl.key ? 'Close' : 'Edit'}
                      </Button>
                    </div>
                    {editingTemplate === tpl.key ? (
                      <div className="mt-3 space-y-3">
                        <Input
                          label="Subject"
                          value={tpl.subject}
                          onChange={(e) =>
                            patchForm((f) => {
                              const templates = [...(f.emailConfig?.templates || [])];
                              templates[idx] = { ...templates[idx], subject: e.target.value };
                              return {
                                ...f,
                                emailConfig: { ...f.emailConfig!, templates },
                              };
                            })
                          }
                        />
                        <Textarea
                          label="Body (text)"
                          rows={4}
                          value={tpl.bodyText}
                          onChange={(e) =>
                            patchForm((f) => {
                              const templates = [...(f.emailConfig?.templates || [])];
                              templates[idx] = { ...templates[idx], bodyText: e.target.value };
                              return {
                                ...f,
                                emailConfig: { ...f.emailConfig!, templates },
                              };
                            })
                          }
                        />
                        <Textarea
                          label="Body (HTML)"
                          rows={4}
                          value={tpl.bodyHtml}
                          onChange={(e) =>
                            patchForm((f) => {
                              const templates = [...(f.emailConfig?.templates || [])];
                              templates[idx] = { ...templates[idx], bodyHtml: e.target.value };
                              return {
                                ...f,
                                emailConfig: { ...f.emailConfig!, templates },
                              };
                            })
                          }
                        />
                      </div>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}

        {tab === 'theme' ? (
          <div className="space-y-4">
            <p className="text-sm text-black/60">
              Limited tokens only. Fonts stay on the established Kadamba pairing — do not introduce
              generic purple themes.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Primary (hex)"
                value={form.theme.primary}
                onChange={(e) =>
                  patchForm((f) => ({ ...f, theme: { ...f.theme, primary: e.target.value } }))
                }
              />
              <Input
                label="Accent / gold (hex)"
                value={form.theme.accent}
                onChange={(e) =>
                  patchForm((f) => ({ ...f, theme: { ...f.theme, accent: e.target.value } }))
                }
              />
            </div>
            <div className="flex items-center gap-4">
              <span
                className="h-10 w-10 rounded-sm border border-black/10"
                style={{ background: form.theme.primary }}
              />
              <span
                className="h-10 w-10 rounded-sm border border-black/10"
                style={{ background: form.theme.accent }}
              />
            </div>
            <Button variant="ghost" onClick={() => setThemeResetOpen(true)}>
              Reset to brand defaults
            </Button>
          </div>
        ) : null}

        {tab === 'staff' ? (
          <div className="space-y-4">
            <p className="text-sm text-black/65">
              Staff roster and role permissions live in their own modules — open them from here.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/admin/staff"
                className="rounded-sm border border-black/15 px-4 py-2 text-sm font-medium transition hover:border-black"
              >
                Open Staff Management →
              </Link>
              <Link
                to="/admin/profile"
                className="rounded-sm border border-black/15 px-4 py-2 text-sm font-medium transition hover:border-black"
              >
                Admin profile / access →
              </Link>
            </div>
            <p className="text-xs text-black/45">
              Full User Roles desk expands in a later pass — use Staff + auth roles for now.
            </p>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3 border-t border-black/10 pt-6">
          <Button variant="primary" onClick={() => void save()}>
            Save settings
          </Button>
          <Button variant="ghost" onClick={() => setResetOpen(true)}>
            Reset all defaults
          </Button>
          {dirty ? (
            <span className="self-center text-xs text-amber-700">Unsaved changes</span>
          ) : null}
        </div>
      </section>

      <ConfirmDialog
        open={resetOpen}
        title="Reset all settings?"
        description="This restores Kadamba brand defaults for contact, SEO, social, media, email templates, and theme. SMTP password will be cleared."
        confirmLabel="Reset defaults"
        variant="danger"
        onCancel={() => setResetOpen(false)}
        onConfirm={async () => {
          try {
            await resetSettings();
            setDirty(false);
            setForm(structuredClone(defaultWebsiteSettings));
            setResetOpen(false);
            toast({ tone: 'info', title: 'Reset to defaults' });
          } catch (err) {
            toast({
              tone: 'error',
              title: 'Reset failed',
              description: err instanceof Error ? err.message : undefined,
            });
          }
        }}
      />

      <ConfirmDialog
        open={themeResetOpen}
        title="Reset theme tokens?"
        description="Restores primary black (#000000) and gold accent (#b59410). Fonts are unchanged."
        confirmLabel="Reset theme"
        variant="warning"
        onCancel={() => setThemeResetOpen(false)}
        onConfirm={() => {
          patchForm((f) => ({
            ...f,
            theme: { ...defaultWebsiteSettings.theme },
          }));
          setThemeResetOpen(false);
          toast({ tone: 'info', title: 'Theme reset — save to apply' });
        }}
      />
    </>
  );
}
