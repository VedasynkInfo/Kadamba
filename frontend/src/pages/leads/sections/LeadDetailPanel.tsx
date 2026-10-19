import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button, Select, Textarea } from '@/components/ui';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { cn } from '@/utils/cn';
import { whatsappDeepLink } from '@/utils/whatsapp';
import {
  formatLeadDate,
  leadAssignees,
  LEAD_STATUSES,
  statusTone,
  type Lead,
  type LeadStatus,
} from '../data';

interface LeadDetailPanelProps {
  lead: Lead;
  onStatus: (status: LeadStatus) => void;
  onAssignee: (assignee: string) => void;
  onAddNote: (body: string) => void;
  onConvertToOrder?: () => void;
  onScheduleFollowUp?: (payload: {
    scheduledAt: string;
    type?: 'call' | 'whatsapp' | 'email' | 'in_person_consultation';
    notes?: string;
  }) => Promise<any>;
  onCompleteFollowUp?: (followUpId: string) => Promise<any>;
}

/**
 * Lead workspace — status, assignment, notes, and timeline.
 */
export function LeadDetailPanel({
  lead,
  onStatus,
  onAssignee,
  onAddNote,
  onConvertToOrder,
  onScheduleFollowUp,
  onCompleteFollowUp,
}: LeadDetailPanelProps) {
  const navigate = useNavigate();
  const reduced = usePrefersReducedMotion();
  const [note, setNote] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpType, setFollowUpType] = useState<'call' | 'whatsapp' | 'email' | 'in_person_consultation'>('call');
  const [followUpNotes, setFollowUpNotes] = useState('');

  function submitNote(e: FormEvent) {
    e.preventDefault();
    if (!note.trim()) return;
    onAddNote(note);
    setNote('');
  }

  const timeline = [...lead.timeline].sort(
    (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 md:px-10 md:py-14">
      <button
        type="button"
        onClick={() => navigate('/admin/leads/list')}
        className="text-xs uppercase tracking-[0.22em] text-ink/45 transition hover:text-ink"
      >
        ← All leads
      </button>

      <motion.div
        className="mt-6 grid gap-12 lg:grid-cols-[1.1fr_0.9fr]"
        initial={reduced ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <div>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-heading text-4xl text-ink md:text-5xl">{lead.name}</h1>
              <p className="mt-2 text-sm text-ink/55">
                {lead.source} · Created {formatLeadDate(lead.createdAt)}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider',
                  lead.quality === 'hot'
                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                    : lead.quality === 'warm'
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : 'bg-slate-100 text-slate-700 border border-slate-300',
                )}
              >
                {lead.quality === 'hot' ? '🔥 Hot Lead' : lead.quality === 'warm' ? '⚡ Warm Lead' : '❄️ Cold Lead'}
                <span className="font-mono font-extrabold">({lead.score ?? 50}/100)</span>
              </span>
              <span
                className={cn(
                  'border px-3 py-1 text-[0.65rem] uppercase tracking-[0.16em]',
                  statusTone(lead.status),
                )}
              >
                {lead.status}
              </span>
            </div>
          </div>

          <dl className="mt-10 grid gap-5 sm:grid-cols-2">
            {[
              ['Phone', lead.phone],
              ['Email', lead.email],
              ['City', lead.city],
              ['Service', lead.service],
              ['Occasion', lead.occasion || '—'],
              ['Budget', lead.budget || '—'],
              ['Preferred date', lead.preferredDate || '—'],
              [
                'Order',
                lead.orderNumber
                  ? `#${lead.orderNumber}${lead.referenceId ? ` · ${lead.referenceId}` : ' (enquiry)'}`
                  : '—',
              ],
            ].map(([label, value]) => (
              <div key={label} className="border-t border-line pt-3">
                <dt className="text-[0.65rem] uppercase tracking-[0.2em] text-ink/40">{label}</dt>
                <dd className="mt-1 text-base text-ink/85">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-6">
            <a
              href={whatsappDeepLink(
                lead.phone,
                `Hi ${lead.name}, this is Kadamba's Designer Studio (Kurnool) regarding your ${lead.service} enquiry.`,
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-sm border border-emerald-700/30 bg-emerald-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-800 transition hover:bg-emerald-100"
            >
              WhatsApp client
            </a>
          </div>

          {lead.orderId ? (
            <div className="mt-6">
              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={() => navigate(`/admin/orders/${lead.orderId}`)}
              >
                Open linked order #{lead.orderNumber}
              </Button>
            </div>
          ) : null}

          <div className="mt-8 border-t border-line pt-6">
            <p className="text-[0.65rem] uppercase tracking-[0.2em] text-ink/40">Message</p>
            <p className="mt-3 text-base leading-relaxed text-ink/75">{lead.message}</p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            <Select
              id="lead-status"
              label="Pipeline status"
              value={lead.status}
              onChange={(e) => onStatus(e.target.value as LeadStatus)}
              options={LEAD_STATUSES.map((s) => ({ value: s, label: s }))}
            />
            <Select
              id="lead-assignee"
              label="Assigned desk"
              value={lead.assignee}
              onChange={(e) => onAssignee(e.target.value)}
              options={leadAssignees.map((a) => ({ value: a, label: a }))}
            />
          </div>

          {onConvertToOrder && !lead.orderId && lead.status !== 'Qualified' && (
            <div className="mt-6">
              <Button
                type="button"
                onClick={onConvertToOrder}
                className="w-full bg-gold text-ink hover:bg-gold/90 font-semibold cursor-pointer py-3"
              >
                Convert to workshop order
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-10">
          <section className="rounded-lg border border-line bg-black/[0.01] p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-xl text-ink">Follow-Up Schedule</h2>
              <span className="text-xs font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                {lead.followUps?.filter((f) => f.status === 'pending').length || 0} Pending
              </span>
            </div>

            {/* Schedule new follow up */}
            <div className="mt-4 space-y-3 rounded border border-line bg-surface-raised p-3">
              <p className="text-xs font-bold uppercase tracking-wider text-ink/60">Schedule Follow-Up Touchpoint</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  type="datetime-local"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  className="rounded border border-line px-3 py-1.5 text-xs text-ink"
                />
                <select
                  value={followUpType}
                  onChange={(e) => setFollowUpType(e.target.value as any)}
                  className="rounded border border-line px-3 py-1.5 text-xs text-ink"
                >
                  <option value="call">Phone Call</option>
                  <option value="whatsapp">WhatsApp Touchpoint</option>
                  <option value="in_person_consultation">In-Person Consultation</option>
                  <option value="email">Email</option>
                </select>
              </div>
              <input
                type="text"
                value={followUpNotes}
                onChange={(e) => setFollowUpNotes(e.target.value)}
                placeholder="Follow-up notes (e.g. Call to discuss wedding trousseau budget)"
                className="w-full rounded border border-line px-3 py-1.5 text-xs text-ink"
              />
              <Button
                type="button"
                size="sm"
                variant="secondary"
                disabled={!followUpDate}
                onClick={async () => {
                  if (!followUpDate || !onScheduleFollowUp) return;
                  await onScheduleFollowUp({
                    scheduledAt: new Date(followUpDate).toISOString(),
                    type: followUpType,
                    notes: followUpNotes,
                  });
                  setFollowUpNotes('');
                  setFollowUpDate('');
                }}
              >
                Schedule Follow-Up
              </Button>
            </div>

            {/* List existing follow ups */}
            <div className="mt-4 space-y-2">
              {(lead.followUps || []).length === 0 ? (
                <p className="text-xs text-ink/45 py-2">No follow-ups scheduled yet.</p>
              ) : (
                [...(lead.followUps || [])].reverse().map((fu) => (
                  <div
                    key={fu.id}
                    className={cn(
                      'flex items-center justify-between gap-3 rounded border p-3 text-xs',
                      fu.status === 'completed'
                        ? 'border-line bg-black/[0.02] text-ink/50'
                        : 'border-amber-200 bg-amber-50/50 text-ink',
                    )}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold uppercase tracking-wider text-[0.65rem]">
                          {fu.type === 'whatsapp' ? '💬 WhatsApp' : fu.type === 'call' ? '📞 Call' : '📅 Consultation'}
                        </span>
                        <span>·</span>
                        <span className="font-mono">
                          {new Date(fu.scheduledAt).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {fu.status === 'completed' && (
                          <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[0.65rem] font-bold text-emerald-800">
                            Completed
                          </span>
                        )}
                      </div>
                      {fu.notes && <p className="mt-1 text-ink/70">{fu.notes}</p>}
                    </div>

                    {fu.status === 'pending' && onCompleteFollowUp && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="border border-line text-xs shrink-0"
                        onClick={() => onCompleteFollowUp(fu.id)}
                      >
                        Mark Done
                      </Button>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-ink">Notes</h2>
            <form onSubmit={submitNote} className="mt-4 space-y-3">
              <Textarea
                id="lead-note"
                label="Add internal note"
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Fitting preference, follow-up, fabric note…"
              />
              <Button type="submit" variant="primary" size="md" disabled={!note.trim()}>
                Save note
              </Button>
            </form>
            <ul className="mt-6 list-none space-y-4">
              {[...lead.notes].reverse().map((item) => (
                <li key={item.id} className="border-t border-line pt-4">
                  <p className="text-sm leading-relaxed text-ink/80">{item.body}</p>
                  <p className="mt-2 text-[0.65rem] uppercase tracking-[0.18em] text-ink/40">
                    {item.author} · {formatLeadDate(item.createdAt)}
                  </p>
                </li>
              ))}
              {lead.notes.length === 0 ? (
                <li className="text-sm text-ink/45">No notes yet.</li>
              ) : null}
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-ink">Timeline</h2>
            <ol className="relative mt-6 list-none border-l border-gold/40 pl-6">
              {timeline.map((event) => (
                <li key={event.id} className="relative pb-8 last:pb-0">
                  <span
                    className="absolute -left-[1.55rem] top-1 size-2.5 rounded-full bg-gold"
                    aria-hidden
                  />
                  <p className="font-heading text-lg text-ink">{event.label}</p>
                  {event.detail ? (
                    <p className="mt-1 text-sm text-ink/60">{event.detail}</p>
                  ) : null}
                  <p className="mt-2 text-[0.65rem] uppercase tracking-[0.18em] text-ink/40">
                    {formatLeadDate(event.createdAt)}
                  </p>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </motion.div>
    </div>
  );
}
