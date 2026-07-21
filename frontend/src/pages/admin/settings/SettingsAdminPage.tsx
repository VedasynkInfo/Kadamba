import { useEffect, useState } from 'react';
import { Button, Input, Textarea, useToast } from '@/components/ui';
import { useAdminContent } from '../AdminContentContext';
import { AdminHorizonBanner } from '../components/AdminHorizonBanner';
import { adminBanners, defaultWebsiteSettings, type WebsiteSettings } from '../data';

export default function SettingsAdminPage() {
  const { settings, saveSettings, resetSettings } = useAdminContent();
  const { toast } = useToast();
  const [form, setForm] = useState<WebsiteSettings>(() => structuredClone(settings));
  const [dirty, setDirty] = useState(false);

  // Sync from server only when settings change and the user isn't mid-edit
  useEffect(() => {
    if (dirty) return;
    setForm(structuredClone(settings));
  }, [settings, dirty]);

  function patchForm(updater: (prev: WebsiteSettings) => WebsiteSettings) {
    setDirty(true);
    setForm(updater);
  }

  async function save() {
    try {
      await saveSettings({
        ...form,
        addressLines: form.addressLines.map((l) => l.trim()).filter(Boolean),
        hours: form.hours.filter((h) => h.day.trim() && h.time.trim()),
        social: form.social.filter((s) => s.label.trim() && s.href.trim()),
      });
      setDirty(false);
      toast({ tone: 'success', title: 'Settings saved' });
    } catch (err) {
      toast({
        tone: 'error',
        title: 'Could not save settings',
        description: err instanceof Error ? err.message : undefined,
      });
    }
  }

  return (
    <>
      <AdminHorizonBanner
        title={adminBanners.settings.title}
        copy={adminBanners.settings.copy}
        actionLabel={adminBanners.settings.actionLabel}
        onAction={save}
      />

      <section className="mx-auto max-w-3xl space-y-8 px-4 py-10 sm:px-6 md:px-10">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Studio name"
            value={form.studioName}
            onChange={(e) => patchForm((f) => ({ ...f, studioName: e.target.value }))}
          />
          <Input
            label="Location"
            value={form.location}
            onChange={(e) => patchForm((f) => ({ ...f, location: e.target.value }))}
          />
          <Input
            label="Phone display"
            value={form.phoneDisplay}
            onChange={(e) => patchForm((f) => ({ ...f, phoneDisplay: e.target.value }))}
          />
          <Input
            label="Phone tel"
            value={form.phoneTel}
            onChange={(e) => patchForm((f) => ({ ...f, phoneTel: e.target.value }))}
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => patchForm((f) => ({ ...f, email: e.target.value }))}
            className="sm:col-span-2"
          />
        </div>

        <Textarea
          label="Address (one line per row)"
          rows={3}
          value={form.addressLines.join('\n')}
          onChange={(e) =>
            patchForm((f) => ({ ...f, addressLines: e.target.value.split('\n') }))
          }
        />

        <div className="space-y-3">
          <p className="text-sm font-medium text-black">Hours</p>
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

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="WhatsApp number"
            value={form.whatsappNumber}
            onChange={(e) => patchForm((f) => ({ ...f, whatsappNumber: e.target.value }))}
          />
          <Input
            label="Map link"
            value={form.mapLink}
            onChange={(e) => patchForm((f) => ({ ...f, mapLink: e.target.value }))}
          />
        </div>
        <Textarea
          label="WhatsApp prefill"
          rows={2}
          value={form.whatsappPrefill}
          onChange={(e) => patchForm((f) => ({ ...f, whatsappPrefill: e.target.value }))}
        />
        <Input
          label="Map embed URL"
          value={form.mapEmbedUrl}
          onChange={(e) => patchForm((f) => ({ ...f, mapEmbedUrl: e.target.value }))}
        />

        <div className="space-y-3">
          <p className="text-sm font-medium text-black">Social links</p>
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
        </div>

        <div className="flex flex-wrap gap-3 pt-2">
          <Button variant="primary" onClick={save}>
            Save settings
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              void resetSettings()
                .then(() => {
                  setDirty(false);
                  setForm(structuredClone(defaultWebsiteSettings));
                  toast({ tone: 'info', title: 'Reset to defaults' });
                })
                .catch((err) =>
                  toast({
                    tone: 'error',
                    title: 'Reset failed',
                    description: err instanceof Error ? err.message : undefined,
                  }),
                );
            }}
          >
            Reset defaults
          </Button>
        </div>
      </section>
    </>
  );
}
