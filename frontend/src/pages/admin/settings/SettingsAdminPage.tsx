import { useEffect, useState } from 'react';
import { type GlyphName } from '@/components/icons';
import { TabStrip, useToast } from '@/components/ui';
import { PageMeta, staticPageMeta } from '@/seo';
import { useAdminContent } from '../AdminContentContext';
import { useTheme } from '@/context/ThemeContext';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { defaultWebsiteSettings, type WebsiteSettings } from '../data';
import { SettingsHeader } from './SettingsHeader';
import { GeneralTab } from './GeneralTab';
import { SeoTab } from './SeoTab';
import { SocialTab } from './SocialTab';
import { MediaTab } from './MediaTab';
import { EmailTab } from './EmailTab';
import { ThemeTab } from './ThemeTab';
import { StaffRolesTab } from './StaffRolesTab';

type TabId = 'general' | 'theme' | 'seo' | 'social' | 'media' | 'email' | 'staff';

const TABS: { id: TabId; label: string; icon: GlyphName }[] = [
  { id: 'general', label: 'Studio Identity', icon: 'studio' },
  { id: 'theme', label: 'Theme Studio', icon: 'palette' },
  { id: 'seo', label: 'SEO & Meta', icon: 'seo' },
  { id: 'social', label: 'Social Channels', icon: 'globe' },
  { id: 'media', label: 'Media Rules', icon: 'media' },
  { id: 'email', label: 'SMTP & Email', icon: 'email' },
  { id: 'staff', label: 'Roles & Access', icon: 'users' },
];

function isHex(value: string) {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value.trim());
}

export default function SettingsAdminPage() {
  const { settings, saveSettings, resetSettings } = useAdminContent();
  const { updateThemeTokens } = useTheme();
  const { toast } = useToast();
  const [tab, setTab] = useState<TabId>('general');
  const [form, setForm] = useState<WebsiteSettings>(() => structuredClone(settings));
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [themeResetOpen, setThemeResetOpen] = useState(false);

  useEffect(() => {
    if (dirty) return;
    setForm(structuredClone(settings));
  }, [settings, dirty]);

  function patchForm(updater: (prev: WebsiteSettings) => WebsiteSettings) {
    setDirty(true);
    setForm(updater);
  }

  async function handleSave() {
    if (!form.studioName.trim()) {
      toast({ tone: 'error', title: 'Company / Studio name is required' });
      setTab('general');
      return;
    }
    if (!form.phoneDisplay.trim() || !form.email.trim()) {
      toast({ tone: 'error', title: 'Phone and email are required' });
      setTab('general');
      return;
    }

    // Validate theme hexes if populated
    const hexKeys: (keyof typeof form.theme)[] = [
      'primary', 'accent', 'publicBg', 'publicText', 'publicCard', 'publicCardText',
      'primaryText', 'adminBg', 'adminText', 'adminSidebar', 'adminSidebarText',
      'adminCard', 'adminCardText', 'adminPrimary', 'adminPrimaryText', 'adminAccent',
    ];
    for (const key of hexKeys) {
      const val = form.theme[key];
      if (val && !isHex(val)) {
        toast({ tone: 'error', title: `Invalid hex color for ${String(key)}` });
        setTab('theme');
        return;
      }
    }

    setSaving(true);
    try {
      await saveSettings({
        ...form,
        addressLines: form.addressLines.map((l) => l.trim()).filter(Boolean),
        hours: form.hours.filter((h) => h.day.trim() && h.time.trim()),
        social: form.social.filter((s) => s.label.trim() && s.href.trim()),
      });
      updateThemeTokens(form.theme, form.logoUrl, form.logoDarkUrl);
      setDirty(false);
      toast({
        tone: 'success',
        title: 'Settings saved successfully',
        description: 'Theme tokens and studio settings applied live!',
      });
    } catch (err: any) {
      toast({
        tone: 'error',
        title: 'Failed to save settings',
        description: err?.message || 'Server communication error',
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageMeta {...staticPageMeta.admin} path="/admin/settings" title="Website Settings" />

      <div className="space-y-6">
        {/* Compact Header */}
        <SettingsHeader
          dirty={dirty}
          saving={saving}
          onSave={handleSave}
          onResetOpen={() => setResetOpen(true)}
        />

        {/* Tab Navigation */}
        <TabStrip
          items={TABS}
          value={tab}
          onChange={(id) => setTab(id as TabId)}
          layoutId="settings-tab-indicator"
          className="overflow-x-auto"
        />

        {/* Tab Content Panes */}
        {tab === 'general' ? <GeneralTab form={form} patchForm={patchForm} /> : null}
        {tab === 'theme' ? (
          <ThemeTab
            form={form}
            patchForm={patchForm}
            onResetTheme={() => setThemeResetOpen(true)}
          />
        ) : null}
        {tab === 'seo' ? <SeoTab form={form} patchForm={patchForm} /> : null}
        {tab === 'social' ? <SocialTab form={form} patchForm={patchForm} /> : null}
        {tab === 'media' ? <MediaTab form={form} patchForm={patchForm} /> : null}
        {tab === 'email' ? <EmailTab form={form} patchForm={patchForm} /> : null}
        {tab === 'staff' ? <StaffRolesTab /> : null}
      </div>

      {/* Reset Confirmation Dialogs */}
      <ConfirmDialog
        open={resetOpen}
        title="Reset all settings to factory default?"
        description="This will restore all contact information, addresses, and SEO templates to initial defaults."
        confirmLabel="Reset Everything"
        onConfirm={async () => {
          await resetSettings();
          setForm(structuredClone(defaultWebsiteSettings));
          setDirty(false);
          setResetOpen(false);
          toast({ tone: 'success', title: 'Settings restored to defaults' });
        }}
        onCancel={() => setResetOpen(false)}
      />

      <ConfirmDialog
        open={themeResetOpen}
        title="Reset studio color theme?"
        description="This will restore the standard Midnight Gold atelier theme tokens."
        confirmLabel="Reset Theme"
        onConfirm={() => {
          patchForm((f) => ({
            ...f,
            theme: structuredClone(defaultWebsiteSettings.theme),
          }));
          setThemeResetOpen(false);
          toast({ tone: 'success', title: 'Theme colors restored' });
        }}
        onCancel={() => setThemeResetOpen(false)}
      />
    </>
  );
}
