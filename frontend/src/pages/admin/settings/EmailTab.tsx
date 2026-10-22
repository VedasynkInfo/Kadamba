import { useState } from 'react';
import { Icon } from '@/components/icons';
import { useToast } from '@/components/ui';
import { settingsApi } from '@/services/settings/settingsService';
import type { WebsiteSettings } from '../data';

interface EmailTabProps {
  form: WebsiteSettings;
  patchForm: (updater: (prev: WebsiteSettings) => WebsiteSettings) => void;
}

export function EmailTab({ form, patchForm }: EmailTabProps) {
  const { toast } = useToast();
  const [testingEmail, setTestingEmail] = useState(false);
  const [testTo, setTestTo] = useState('');
  const [editingTemplateKey, setEditingTemplateKey] = useState<string | null>(null);

  const cfg = form.emailConfig || {
    host: '',
    port: 587,
    secure: false,
    user: '',
    pass: '',
    passSet: false,
    fromName: form.studioName,
    fromEmail: '',
    adminTo: '',
    templates: [],
  };

  async function handleSendTest() {
    if (!testTo.trim()) {
      toast({ tone: 'error', title: 'Enter a recipient email address' });
      return;
    }
    setTestingEmail(true);
    try {
      await settingsApi.testEmail(testTo.trim());
      toast({ tone: 'success', title: 'Test email sent successfully' });
    } catch (err: any) {
      toast({
        tone: 'error',
        title: 'Could not send test email',
        description: err?.response?.data?.message || err?.message || 'Check SMTP credentials',
      });
    } finally {
      setTestingEmail(false);
    }
  }

  const currentTemplate = cfg.templates?.find((t) => t.key === editingTemplateKey);

  return (
    <div className="space-y-6 text-xs">
      {/* SMTP Transport Server Settings */}
      <div
        className="rounded-2xl border p-5 shadow-xs space-y-4 transition-colors bg-surface-raised border-line text-ink-raised"
      >
        <div className="border-b pb-3 border-line">
          <h3 className="font-heading text-sm font-bold tracking-wide">SMTP Email Relay</h3>
          <p className="text-[10px] opacity-60 mt-0.5">
            Transport service used to deliver client consultations, invoice links, and tailor notifications
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1 sm:col-span-2">
            <label className="block text-[11px] font-semibold opacity-75 uppercase tracking-wider">
              SMTP Host Server
            </label>
            <input
              type="text"
              value={cfg.host}
              onChange={(e) =>
                patchForm((f) => ({
                  ...f,
                  emailConfig: { ...cfg, host: e.target.value },
                }))
              }
              placeholder="smtp.gmail.com or smtp.sendgrid.net"
              className="w-full rounded-xl border py-2 px-3 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-focus bg-surface-sunken border-line"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-semibold opacity-75 uppercase tracking-wider">
              Port
            </label>
            <input
              type="number"
              value={cfg.port}
              onChange={(e) =>
                patchForm((f) => ({
                  ...f,
                  emailConfig: { ...cfg, port: Number(e.target.value) || 587 },
                }))
              }
              placeholder="587"
              className="w-full rounded-xl border py-2 px-3 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-focus bg-surface-sunken border-line"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold opacity-75 uppercase tracking-wider">
              SMTP Username / API Key
            </label>
            <input
              type="text"
              value={cfg.user}
              onChange={(e) =>
                patchForm((f) => ({
                  ...f,
                  emailConfig: { ...cfg, user: e.target.value },
                }))
              }
              placeholder="apikey or concierge@kadamba.com"
              className="w-full rounded-xl border py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-focus bg-surface-sunken border-line"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-semibold opacity-75 uppercase tracking-wider">
              {cfg.passSet ? 'SMTP Password (Configured — enter new to change)' : 'SMTP Password'}
            </label>
            <input
              type="password"
              autoComplete="new-password"
              value={cfg.pass === '••••••••' ? '' : cfg.pass}
              onChange={(e) =>
                patchForm((f) => ({
                  ...f,
                  emailConfig: { ...cfg, pass: e.target.value },
                }))
              }
              placeholder={cfg.passSet ? '••••••••••••' : 'Enter app password'}
              className="w-full rounded-xl border py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-focus bg-surface-sunken border-line"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-line">
          <div className="space-y-1">
            <label className="block text-[11px] font-semibold opacity-75 uppercase tracking-wider">
              From Sender Name
            </label>
            <input
              type="text"
              value={cfg.fromName}
              onChange={(e) =>
                patchForm((f) => ({
                  ...f,
                  emailConfig: { ...cfg, fromName: e.target.value },
                }))
              }
              placeholder="Kadamba's Designer Studio"
              className="w-full rounded-xl border py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-focus bg-surface-sunken border-line"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-semibold opacity-75 uppercase tracking-wider">
              From Email Address
            </label>
            <input
              type="email"
              value={cfg.fromEmail}
              onChange={(e) =>
                patchForm((f) => ({
                  ...f,
                  emailConfig: { ...cfg, fromEmail: e.target.value },
                }))
              }
              placeholder="notifications@kadambadesigner.com"
              className="w-full rounded-xl border py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-focus bg-surface-sunken border-line"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-semibold opacity-75 uppercase tracking-wider">
              Admin Inbox (Alerts)
            </label>
            <input
              type="email"
              value={cfg.adminTo}
              onChange={(e) =>
                patchForm((f) => ({
                  ...f,
                  emailConfig: { ...cfg, adminTo: e.target.value },
                }))
              }
              placeholder="owner@kadambadesigner.com"
              className="w-full rounded-xl border py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-focus bg-surface-sunken border-line"
            />
          </div>
        </div>

        {/* Live Test Mail Dispatcher */}
        <div className="pt-3 border-t flex flex-col sm:flex-row items-center gap-3 border-line">
          <input
            type="email"
            value={testTo}
            onChange={(e) => setTestTo(e.target.value)}
            placeholder="Send verification test email to..."
            className="flex-1 rounded-xl border py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-focus bg-surface-sunken border-line"
          />
          <button
            type="button"
            onClick={handleSendTest}
            disabled={testingEmail}
            className="rounded-xl px-4 py-2 text-xs font-bold border hover:bg-current/[0.05] transition disabled:opacity-50 cursor-pointer border-line"
          >
            {testingEmail ? (
              'Sending Test...'
            ) : (
              <span className="inline-flex items-center gap-1">
                Send Test Email
                <Icon name="arrowUpRight" size={12} />
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Transactional Notification Templates */}
      <div
        className="rounded-2xl border p-5 shadow-xs space-y-4 transition-colors bg-surface-raised border-line text-ink-raised"
      >
        <div className="border-b pb-3 border-line">
          <h3 className="font-heading text-sm font-bold tracking-wide">Transactional Notification Templates</h3>
          <p className="text-[10px] opacity-60 mt-0.5">Customize client copy sent during the order lifecycle</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(cfg.templates || []).map((t) => {
            const isEditing = editingTemplateKey === t.key;
            return (
              <div
                key={t.key}
                onClick={() => setEditingTemplateKey(isEditing ? null : t.key)}
                className={`rounded-xl border p-3.5 cursor-pointer transition hover:border-brand ${isEditing ? 'border-brand bg-brand/[0.06]' : 'border-line bg-surface-sunken'}`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase font-bold text-brand-strong">
                    {t.key.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[11px] opacity-60">{isEditing ? 'Close ▲' : 'Edit ▼'}</span>
                </div>
                <p className="font-semibold text-xs mt-1 truncate">{t.subject}</p>
              </div>
            );
          })}
        </div>

        {/* Active Template Editor */}
        {currentTemplate ? (
          <div
            className="rounded-xl border p-4 space-y-3 mt-2 bg-espresso/20 border-line"
          >
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold opacity-75 uppercase tracking-wider">
                Subject Line
              </label>
              <input
                type="text"
                value={currentTemplate.subject}
                onChange={(e) => {
                  const updated = (cfg.templates || []).map((tpl) =>
                    tpl.key === currentTemplate.key ? { ...tpl, subject: e.target.value } : tpl,
                  );
                  patchForm((f) => ({
                    ...f,
                    emailConfig: { ...cfg, templates: updated },
                  }));
                }}
                className="w-full rounded-xl border py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-focus bg-surface-sunken border-line"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-semibold opacity-75 uppercase tracking-wider">
                Body Copy (Text or HTML)
              </label>
              <textarea
                rows={4}
                value={currentTemplate.bodyText || currentTemplate.bodyHtml || ''}
                onChange={(e) => {
                  const updated = (cfg.templates || []).map((tpl) =>
                    tpl.key === currentTemplate.key
                      ? { ...tpl, bodyText: e.target.value, bodyHtml: e.target.value }
                      : tpl,
                  );
                  patchForm((f) => ({
                    ...f,
                    emailConfig: { ...cfg, templates: updated },
                  }));
                }}
                placeholder="Template text. Supported placeholders: {{referenceId}}, {{clientName}}, {{totalAmount}}"
                className="w-full rounded-xl border py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-focus bg-surface-sunken border-line"
              />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
