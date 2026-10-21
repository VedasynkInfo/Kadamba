import { useState, useEffect } from 'react';
import type {
  MeasurementProfile,
  MeasurementTemplate,
} from '@/services/measurements/measurementsService';
import { getSilhouetteMeta } from './types';
import { Icon } from '@/components/icons';
import { whatsappDeepLink } from '@/utils/whatsapp';
import { cn } from '@/utils/cn';
import { OptimizedImage } from '@/components/media/OptimizedImage';

interface MeasurementPreviewModalProps {
  profile: MeasurementProfile | null;
  templates: MeasurementTemplate[];
  approvingId?: string | null;
  onClose: () => void;
  onEdit: (p: MeasurementProfile) => void;
  onApprove: (p: MeasurementProfile) => void;
}

function formatDate(iso?: string) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

export function MeasurementPreviewModal({
  profile,
  templates,
  approvingId = null,
  onClose,
  onEdit,
  onApprove,
}: MeasurementPreviewModalProps) {
  const [displayUnit, setDisplayUnit] = useState<'inches' | 'cm'>('inches');

  useEffect(() => {
    if (profile?.unit) {
      setDisplayUnit(profile.unit === 'cm' ? 'cm' : 'inches');
    }
  }, [profile]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (profile) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [profile, onClose]);

  if (!profile) return null;

  const silhouette = getSilhouetteMeta(profile.productTypeCode, templates);
  const activeTemplate = templates.find((t) => t.code === profile.productTypeCode);
  const entries = Object.entries(profile.values || {});
  const isPending = profile.status === 'pending_approval';
  const isApproving = approvingId === profile.id;

  // Map keys to friendly labels from template if present
  const fieldLabelMap = new Map<string, string>();
  if (activeTemplate?.fieldDefs) {
    for (const fd of activeTemplate.fieldDefs) {
      fieldLabelMap.set(fd.key, fd.label);
    }
  }

  // Construct WhatsApp specification text
  const dimensionList = entries
    .map(([key, val]) => `• ${fieldLabelMap.get(key) || key.replace(/_/g, ' ').toUpperCase()}: ${val} ${profile.unit || 'in'}`)
    .join('\n');

  const whatsappMsg = `*KADAMBA'S DESIGNER STUDIO — BESPOKE SPECIFICATIONS*\n\n*Client:* ${profile.customerName || 'Walk-in Client'}\n*Garment:* ${silhouette.name} (${profile.profileName})\n*Status:* ${profile.status.toUpperCase()}\n*Date:* ${formatDate(profile.measuredAt)}\n\n*MEASUREMENTS (${profile.unit || 'inches'}):*\n${dimensionList || 'No dimensions logged.'}\n\n*Tailor Notes:* ${profile.notes || 'Standard atelier fitting.'}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Measurement specification preview"
    >
      <div
        className="w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden transition-all text-xs bg-surface-raised border-line text-ink-raised"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between border-b px-5 py-4 border-line"
        >
          <div className="flex items-center gap-3">
            <Icon name={silhouette.icon} size={24} />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading text-base font-bold tracking-wide">
                  {profile.profileName}
                </h3>
                <span
                  className={cn(
                    'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border',
                    profile.status === 'active'
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      : profile.status === 'pending_approval'
                      ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
                      : 'bg-stone-500/15 text-stone-400 border-stone-500/30',
                  )}
                >
                  {profile.status}
                </span>
              </div>
              <p className="text-[11px] opacity-60 mt-0.5">
                Client: <strong>{profile.customerName || 'Walk-in Client'}</strong> • Silhouette:{' '}
                {silhouette.name}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border text-sm opacity-60 hover:opacity-100 transition cursor-pointer border-line"
            aria-label="Close modal"
          >
            <Icon name="close" size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Unit Toggle & Recorded Metadata */}
          <div
            className="flex items-center justify-between rounded-xl border p-3 border-line bg-surface-sunken"
          >
            <div className="flex items-center gap-3">
              <span className="text-[11px] opacity-70">
                Recorded on <strong>{formatDate(profile.measuredAt)}</strong> by{' '}
                <strong>{profile.measuredBy || 'Atelier Master'}</strong>
              </span>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-[10px] opacity-60 uppercase mr-1">Unit:</span>
              <button
                type="button"
                onClick={() => setDisplayUnit('inches')}
                className={cn(
                  'px-2 py-0.5 rounded text-[10px] font-bold border transition cursor-pointer',
                  displayUnit === 'inches'
                    ? 'bg-brand text-ink-on-brand border-transparent'
                    : 'opacity-50 border-current/20',
                )}
              >
                Inches
              </button>
              <button
                type="button"
                onClick={() => setDisplayUnit('cm')}
                className={cn(
                  'px-2 py-0.5 rounded text-[10px] font-bold border transition cursor-pointer',
                  displayUnit === 'cm'
                    ? 'bg-brand text-ink-on-brand border-transparent'
                    : 'opacity-50 border-current/20',
                )}
              >
                CM
              </button>
            </div>
          </div>

          {/* Pending Approval Callout Banner with direct Approve button */}
          {isPending ? (
            <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-3.5 flex items-center justify-between">
              <div>
                <p className="font-bold text-amber-400 text-xs">Pending Tailor Approval</p>
                <p className="text-[10px] opacity-75 mt-0.5">
                  Review specifications before cutting patterns and authorizing fabric consumption.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onApprove(profile)}
                disabled={isApproving}
                className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold bg-amber-500 text-ink hover:bg-amber-400 transition cursor-pointer disabled:opacity-50"
              >
                <span><Icon name="check" size={14} className="mr-1 inline align-middle" /> </span>
                <span>{isApproving ? 'Approving...' : 'Approve Profile'}</span>
              </button>
            </div>
          ) : null}

          {/* Anatomical Dimensions Grid */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold opacity-75 uppercase tracking-wider">
                Anatomical Points ({entries.length})
              </span>
              <span className="text-[10px] opacity-50">
                Values recorded in {profile.unit || 'inches'}
              </span>
            </div>

            {entries.length === 0 ? (
              <p className="text-xs opacity-50 italic py-2">No measurement points logged yet.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {entries.map(([key, val]) => {
                  let numVal = typeof val === 'number' ? val : parseFloat(String(val));
                  let displayVal = String(val);

                  if (!isNaN(numVal) && profile.unit && profile.unit !== displayUnit) {
                    if (displayUnit === 'cm' && profile.unit === 'inches') {
                      displayVal = (numVal * 2.54).toFixed(1);
                    } else if (displayUnit === 'inches' && profile.unit === 'cm') {
                      displayVal = (numVal / 2.54).toFixed(1);
                    }
                  }

                  const friendlyLabel =
                    fieldLabelMap.get(key) || key.replace(/_/g, ' ').toUpperCase();

                  return (
                    <div
                      key={key}
                      className="rounded-xl border p-2.5 transition border-line bg-surface-sunken"
                    >
                      <span className="text-[10px] opacity-60 uppercase block truncate">
                        {friendlyLabel}
                      </span>
                      <div className="flex items-baseline gap-1 mt-0.5">
                        <span className="font-heading text-sm font-bold tracking-tight text-brand-strong">
                          {displayVal}
                        </span>
                        <span className="text-[9px] opacity-50 font-mono">{displayUnit}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Reference Images Gallery */}
          {profile.referenceImages && profile.referenceImages.length > 0 ? (
            <div>
              <span className="text-[11px] font-semibold opacity-75 uppercase tracking-wider block mb-2">
                Reference Sketches & Images ({profile.referenceImages.length})
              </span>
              <div className="flex flex-wrap gap-2.5">
                {profile.referenceImages.map((imgUrl, i) => (
                  <a
                    key={i}
                    href={imgUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative h-20 w-20 rounded-xl overflow-hidden border shadow-xs hover:opacity-90 transition block border-line"
                  >
                    <OptimizedImage src={imgUrl} alt="Reference" sizes="80px" className="h-full w-full object-cover" />
                  </a>
                ))}
              </div>
            </div>
          ) : null}

          {/* Master Posture & Fitting Notes */}
          <div>
            <span className="text-[11px] font-semibold opacity-75 uppercase tracking-wider block mb-1.5">
              Posture Notes & Atelier Directives
            </span>
            <div
              className="rounded-xl border p-3 text-xs leading-relaxed border-line bg-surface-sunken"
            >
              {profile.notes ? (
                <p className="whitespace-pre-line">{profile.notes}</p>
              ) : (
                <p className="opacity-50 italic">No specific posture directives or notes recorded.</p>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div
          className="flex items-center justify-between border-t px-5 py-3.5 border-line"
        >
          <a
            href={whatsappDeepLink(whatsappMsg)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold bg-emerald-600/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/25 transition cursor-pointer"
          >
            <span><Icon name="message" size={14} className="mr-1 inline align-middle" /> </span>
            <span>WhatsApp Spec</span>
          </a>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold border hover:bg-current/[0.05] transition cursor-pointer border-line"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => onEdit(profile)}
              className="rounded-lg px-3.5 py-1.5 text-xs font-bold shadow-xs transition hover:opacity-90 cursor-pointer bg-brand text-ink-on-brand"
            >
              <Icon name="edit" size={14} className="mr-1 inline align-middle" /> Edit Dimensions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
