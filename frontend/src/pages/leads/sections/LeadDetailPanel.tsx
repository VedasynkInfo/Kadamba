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
}: LeadDetailPanelProps) {
  const navigate = useNavigate();
  const reduced = usePrefersReducedMotion();
  const [note, setNote] = useState('');

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
        className="text-xs uppercase tracking-[0.22em] text-black/45 transition hover:text-black"
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
              <h1 className="font-heading text-4xl text-black md:text-5xl">{lead.name}</h1>
              <p className="mt-2 text-sm text-black/55">
                {lead.source} · Created {formatLeadDate(lead.createdAt)}
              </p>
            </div>
            <span
              className={cn(
                'border px-3 py-1.5 text-[0.65rem] uppercase tracking-[0.16em]',
                statusTone(lead.status),
              )}
            >
              {lead.status}
            </span>
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
              <div key={label} className="border-t border-black/10 pt-3">
                <dt className="text-[0.65rem] uppercase tracking-[0.2em] text-black/40">{label}</dt>
                <dd className="mt-1 text-base text-black/85">{value}</dd>
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

          <div className="mt-8 border-t border-black/10 pt-6">
            <p className="text-[0.65rem] uppercase tracking-[0.2em] text-black/40">Message</p>
            <p className="mt-3 text-base leading-relaxed text-black/75">{lead.message}</p>
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
                className="w-full bg-gold text-black hover:bg-gold/90 font-semibold cursor-pointer py-3"
              >
                Convert to workshop order
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-10">
          <section>
            <h2 className="font-heading text-2xl text-black">Notes</h2>
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
                <li key={item.id} className="border-t border-black/10 pt-4">
                  <p className="text-sm leading-relaxed text-black/80">{item.body}</p>
                  <p className="mt-2 text-[0.65rem] uppercase tracking-[0.18em] text-black/40">
                    {item.author} · {formatLeadDate(item.createdAt)}
                  </p>
                </li>
              ))}
              {lead.notes.length === 0 ? (
                <li className="text-sm text-black/45">No notes yet.</li>
              ) : null}
            </ul>
          </section>

          <section>
            <h2 className="font-heading text-2xl text-black">Timeline</h2>
            <ol className="relative mt-6 list-none border-l border-gold/40 pl-6">
              {timeline.map((event) => (
                <li key={event.id} className="relative pb-8 last:pb-0">
                  <span
                    className="absolute -left-[1.55rem] top-1 size-2.5 rounded-full bg-gold"
                    aria-hidden
                  />
                  <p className="font-heading text-lg text-black">{event.label}</p>
                  {event.detail ? (
                    <p className="mt-1 text-sm text-black/60">{event.detail}</p>
                  ) : null}
                  <p className="mt-2 text-[0.65rem] uppercase tracking-[0.18em] text-black/40">
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
