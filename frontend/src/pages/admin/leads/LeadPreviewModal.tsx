import { Link } from 'react-router-dom';
import type { Lead, LeadStatus } from '@/pages/leads/data';
import { whatsappDeepLink } from '@/utils/whatsapp';
import { LEAD_STATUS_OPTIONS } from './types';
import { cn } from '@/utils/cn';

interface LeadPreviewModalProps {
  lead: Lead | null;
  onClose: () => void;
  onStatusChange: (leadId: string, status: LeadStatus) => void;
}

export function LeadPreviewModal({ lead, onClose, onStatusChange }: LeadPreviewModalProps) {
  if (!lead) return null;

  const waHref = whatsappDeepLink(
    lead.phone,
    `Hi ${lead.name}, this is Kadamba's Designer Studio (Kurnool) regarding your ${lead.service} enquiry.`,
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-xl rounded-2xl border shadow-2xl overflow-hidden animate-fade-in-up text-xs bg-surface-raised border-line text-ink-raised"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between border-b px-6 py-4 border-line"
        >
          <div className="flex items-center gap-2.5">
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider',
                lead.quality === 'hot'
                  ? 'bg-rose-500/15 text-rose-500 border border-rose-500/30'
                  : lead.quality === 'warm'
                  ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                  : 'bg-slate-500/15 text-slate-400 border border-slate-500/30',
              )}
            >
              {lead.quality === 'hot' ? '🔥 Hot' : lead.quality === 'warm' ? '⚡ Warm' : '❄️ Cold'}
            </span>
            <span className="font-mono text-xs opacity-75 font-semibold">
              Score: {lead.score ?? 60}/100
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-lg border flex items-center justify-center text-xs opacity-70 hover:opacity-100 hover:bg-current/[0.06] transition cursor-pointer border-line"
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div>
            <h3 className="text-xl font-bold font-heading text-inherit">{lead.name}</h3>
            <p className="opacity-70 mt-0.5">
              📞 {lead.phone} · 📍 {lead.city} {lead.email ? `· ✉️ ${lead.email}` : ''}
            </p>
          </div>

          {/* Quick Stats Grid */}
          <div
            className="grid grid-cols-2 sm:grid-cols-3 gap-3 rounded-xl p-3.5 border bg-surface-sunken border-line"
          >
            <div>
              <span className="opacity-50 block text-[10px] uppercase font-semibold">Enquired Service</span>
              <span className="font-bold mt-0.5 block">{lead.service}</span>
            </div>
            <div>
              <span className="opacity-50 block text-[10px] uppercase font-semibold">Assigned Desk</span>
              <span className="font-semibold mt-0.5 block">{lead.assignee || 'Unassigned'}</span>
            </div>
            <div>
              <span className="opacity-50 block text-[10px] uppercase font-semibold">Acquisition Source</span>
              <span className="font-medium mt-0.5 block opacity-85 capitalize">{lead.source}</span>
            </div>
          </div>

          {/* Status Quick Switcher */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold opacity-75 block">Update Pipeline Status:</label>
            <div className="flex flex-wrap gap-2">
              {LEAD_STATUS_OPTIONS.map((st) => {
                const isActive = lead.status === st;
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => onStatusChange(lead.id, st)}
                    className={cn(
                      'px-3 py-1 rounded-lg border text-xs font-semibold transition cursor-pointer',
                      isActive
                        ? 'bg-brand text-ink-on-brand border-brand'
                        : 'opacity-70 hover:opacity-100 border-current/20 hover:bg-current/[0.04]',
                    )}
                  >
                    {isActive ? '✓ ' : ''}
                    {st}
                  </button>
                );
              })}
            </div>
          </div>

          {lead.orderNumber ? (
            <div
              className="rounded-lg p-3 border flex items-center justify-between bg-emerald-500/[0.08] border-emerald-500/25"
            >
              <div>
                <span className="font-semibold text-emerald-600 block">Converted to Production Order</span>
                <span className="opacity-75 font-mono text-[11px]">Order #{lead.orderNumber}</span>
              </div>
              <Link
                to={`/admin/orders/${lead.orderNumber}`}
                className="text-xs font-bold text-emerald-500 hover:underline"
              >
                View Order →
              </Link>
            </div>
          ) : null}
        </div>

        {/* Footer Actions */}
        <div
          className="flex flex-wrap items-center justify-between gap-3 border-t px-6 py-4 border-line"
        >
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border px-3.5 py-1.5 font-bold text-emerald-500 hover:bg-emerald-500/10 transition cursor-pointer border-emerald-500/30"
          >
            <span>💬 WhatsApp Concierge</span>
          </a>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border px-3 py-1.5 text-xs font-semibold opacity-80 hover:opacity-100 hover:bg-current/[0.05] transition cursor-pointer border-line"
            >
              Close
            </button>
            <Link
              to={`/admin/leads/${lead.id}`}
              className="inline-flex items-center gap-1 rounded-lg px-4 py-1.5 font-bold shadow-xs transition hover:opacity-95 bg-brand text-ink-on-brand"
            >
              <span>Full Lead Dossier</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
