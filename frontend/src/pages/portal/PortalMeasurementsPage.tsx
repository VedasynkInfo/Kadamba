import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Input, Spinner, useToast } from '@/components/ui';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import {
  portalApi,
  type PortalFieldDef,
  type PortalMeasurement,
  type PortalTemplateSummary,
} from '@/services/portal/portalService';
import { cn } from '@/utils/cn';

type EditTarget =
  | { kind: 'template'; code: string; name: string; category?: string }
  | { kind: 'profile'; profile: PortalMeasurement };

export default function PortalMeasurementsPage() {
  const { toast } = useToast();
  const reduced = usePrefersReducedMotion();
  const [profiles, setProfiles] = useState<PortalMeasurement[]>([]);
  const [templates, setTemplates] = useState<PortalTemplateSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<EditTarget | null>(null);
  const [fieldDefs, setFieldDefs] = useState<PortalFieldDef[]>([]);
  const [templateName, setTemplateName] = useState('');
  const [values, setValues] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState('');
  const [unit, setUnit] = useState('in');
  const [loadingFields, setLoadingFields] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [query, setQuery] = useState('');

  async function refresh() {
    const [p, t] = await Promise.all([
      portalApi.measurements(),
      portalApi.measurementTemplates(),
    ]);
    setProfiles(p);
    setTemplates(t);
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await refresh();
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredTemplates = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return templates;
    return templates.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.code.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q),
    );
  }, [templates, query]);

  const groupedTemplates = useMemo(() => {
    const map = new Map<string, PortalTemplateSummary[]>();
    for (const t of filteredTemplates) {
      const list = map.get(t.category) || [];
      list.push(t);
      map.set(t.category, list);
    }
    return Array.from(map.entries());
  }, [filteredTemplates]);

  async function openTemplate(t: PortalTemplateSummary) {
    setSelected({ kind: 'template', code: t.code, name: t.name, category: t.category });
    setLoadingFields(true);
    setError('');
    try {
      const tpl = await portalApi.measurementTemplate(t.code);
      setFieldDefs(tpl.fieldDefs || []);
      setTemplateName(tpl.name);
      setValues({});
      setNotes('');
      setUnit('in');
    } catch (err) {
      setSelected(null);
      setError(err instanceof Error ? err.message : 'Could not load fields');
    } finally {
      setLoadingFields(false);
    }
  }

  async function openProfile(profile: PortalMeasurement) {
    setSelected({ kind: 'profile', profile });
    setLoadingFields(true);
    setError('');
    try {
      const tpl = await portalApi.measurementTemplate(profile.productTypeCode);
      setFieldDefs(tpl.fieldDefs || []);
      setTemplateName(tpl.name || profile.profileName);
      const next: Record<string, string> = {};
      for (const [k, v] of Object.entries(profile.values || {})) {
        next[k] = v == null ? '' : String(v);
      }
      setValues(next);
      setNotes(profile.notes || '');
      setUnit(profile.unit || 'in');
    } catch (err) {
      setSelected(null);
      setError(err instanceof Error ? err.message : 'Could not load fields');
    } finally {
      setLoadingFields(false);
    }
  }

  function closeEditor() {
    setSelected(null);
    setFieldDefs([]);
    setValues({});
    setNotes('');
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setSubmitting(true);
    setError('');
    try {
      const code =
        selected.kind === 'template' ? selected.code : selected.profile.productTypeCode;
      const parsed: Record<string, unknown> = {};
      for (const f of fieldDefs) {
        const raw = values[f.key];
        if (raw === undefined || raw === '') continue;
        parsed[f.key] = f.type === 'number' ? Number(raw) : raw;
      }
      await portalApi.submitMeasurement({
        productTypeCode: code,
        profileName:
          selected.kind === 'profile'
            ? `${selected.profile.profileName} (update)`
            : `${templateName} request`,
        unit,
        values: parsed,
        notes: notes.trim() || undefined,
      });
      toast({
        tone: 'success',
        title: 'Submitted for approval',
        description: 'The boutique will review your measurements.',
      });
      closeEditor();
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submit failed');
    } finally {
      setSubmitting(false);
    }
  }

  const fieldsByGroup = useMemo(() => {
    const map = new Map<string, PortalFieldDef[]>();
    for (const f of fieldDefs) {
      const g = f.group || 'Measurements';
      const list = map.get(g) || [];
      list.push(f);
      map.set(g, list);
    }
    return Array.from(map.entries());
  }, [fieldDefs]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner label="Loading measurements" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl text-cream">Measurements</h1>
        <p className="mt-2 text-sm text-cream/55">
          Choose a saved profile or garment type — fields load automatically for updates.
        </p>
      </div>

      {error && !selected ? <p className="text-sm text-rose-300">{error}</p> : null}

      <AnimatePresence mode="wait">
        {selected ? (
          <motion.div
            key="editor"
            initial={reduced ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? undefined : { opacity: 0, y: -8 }}
            className="space-y-6"
          >
            <button
              type="button"
              onClick={closeEditor}
              className="text-xs uppercase tracking-[0.18em] text-cream/50 hover:text-gold"
            >
              ← Back to list
            </button>

            <div className="border border-gold/25 bg-gradient-to-br from-black/50 to-black/20 p-5 sm:p-7">
              <p className="text-[0.62rem] uppercase tracking-[0.28em] text-gold/75">
                {selected.kind === 'profile' ? 'Update profile' : 'New measurement request'}
              </p>
              <h2 className="mt-2 font-heading text-2xl text-cream">
                {selected.kind === 'profile' ? selected.profile.profileName : selected.name}
              </h2>
              <p className="mt-1 font-mono text-xs text-cream/45">
                {selected.kind === 'profile'
                  ? selected.profile.productTypeCode
                  : selected.code}
                {selected.kind === 'template' && selected.category
                  ? ` · ${selected.category}`
                  : ''}
              </p>

              {loadingFields ? (
                <div className="flex justify-center py-12">
                  <Spinner label="Loading fields" />
                </div>
              ) : (
                <form onSubmit={onSubmit} className="mt-6 space-y-6">
                  <div className="flex flex-wrap gap-2">
                    {(['in', 'cm'] as const).map((u) => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => setUnit(u)}
                        className={cn(
                          'rounded-sm border px-3 py-1.5 text-[0.65rem] uppercase tracking-[0.16em]',
                          unit === u
                            ? 'border-gold bg-gold/15 text-gold'
                            : 'border-gold/20 text-cream/50 hover:border-gold/40',
                        )}
                      >
                        {u === 'in' ? 'Inches' : 'Centimetres'}
                      </button>
                    ))}
                  </div>

                  {fieldsByGroup.map(([group, fields]) => (
                    <section key={group}>
                      <h3 className="mb-3 text-[0.65rem] uppercase tracking-[0.2em] text-gold/70">
                        {group}
                      </h3>
                      <div className="grid gap-4 sm:grid-cols-2">
                        {fields.map((f) =>
                          f.type === 'enum' && f.options?.length ? (
                            <label key={f.key} className="block text-sm">
                              <span className="mb-1.5 block text-cream/60">
                                {f.label}
                                {f.required ? ' *' : ''}
                              </span>
                              <select
                                required={f.required}
                                value={values[f.key] || ''}
                                onChange={(e) =>
                                  setValues((prev) => ({ ...prev, [f.key]: e.target.value }))
                                }
                                className="w-full rounded-sm border border-gold/25 bg-black/40 px-3 py-2.5 text-cream outline-none focus:border-gold"
                              >
                                <option value="">Select…</option>
                                {f.options.map((o) => (
                                  <option key={o} value={o}>
                                    {o}
                                  </option>
                                ))}
                              </select>
                              {f.helpText ? (
                                <span className="mt-1 block text-[0.7rem] text-cream/40">
                                  {f.helpText}
                                </span>
                              ) : null}
                            </label>
                          ) : (
                            <Input
                              key={f.key}
                              label={`${f.label}${f.required ? ' *' : ''}`}
                              type={f.type === 'number' ? 'number' : 'text'}
                              value={values[f.key] || ''}
                              onChange={(e) =>
                                setValues((prev) => ({ ...prev, [f.key]: e.target.value }))
                              }
                              required={f.required}
                              hint={f.helpText}
                            />
                          ),
                        )}
                      </div>
                    </section>
                  ))}

                  <Input
                    label="Notes for the boutique"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />

                  {error ? <p className="text-sm text-rose-300">{error}</p> : null}

                  <div className="flex flex-wrap gap-3">
                    <Button type="submit" disabled={submitting || fieldDefs.length === 0}>
                      {submitting ? 'Submitting…' : 'Submit for approval'}
                    </Button>
                    <Button type="button" variant="secondary" onClick={closeEditor}>
                      Cancel
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-10"
          >
            <section>
              <h2 className="font-heading text-xl text-gold">Your profiles</h2>
              <ul className="mt-4 divide-y divide-gold/10 border border-gold/15">
                {profiles.length === 0 ? (
                  <li className="px-4 py-8 text-sm text-cream/50">
                    No saved profiles yet — pick a garment type below to start.
                  </li>
                ) : (
                  profiles.map((m) => (
                    <li key={m.id}>
                      <button
                        type="button"
                        onClick={() => void openProfile(m)}
                        className="flex w-full flex-wrap items-center justify-between gap-3 px-4 py-4 text-left transition hover:bg-white/5"
                      >
                        <div>
                          <p className="text-cream">{m.profileName}</p>
                          <p className="mt-0.5 font-mono text-[0.7rem] text-cream/45">
                            {m.productTypeCode} · {Object.keys(m.values || {}).length} fields
                          </p>
                        </div>
                        <span className="rounded-sm border border-gold/25 px-2 py-1 text-[0.65rem] uppercase tracking-[0.14em] text-gold/90">
                          {m.status.replace('_', ' ')} · Update
                        </span>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </section>

            <section>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <h2 className="font-heading text-xl text-gold">All measurement types</h2>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search blouse, lehenga…"
                  className="w-full max-w-xs rounded-sm border border-gold/20 bg-black/30 px-3 py-2 text-sm text-cream outline-none focus:border-gold sm:w-56"
                />
              </div>

              {groupedTemplates.length === 0 ? (
                <p className="mt-4 border border-gold/15 px-4 py-8 text-sm text-cream/50">
                  No measurement templates available yet.
                </p>
              ) : (
                <div className="mt-5 space-y-8">
                  {groupedTemplates.map(([category, items]) => (
                    <div key={category}>
                      <p className="text-[0.62rem] uppercase tracking-[0.24em] text-cream/40">
                        {category}
                      </p>
                      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                        {items.map((t) => (
                          <li key={t.code}>
                            <button
                              type="button"
                              onClick={() => void openTemplate(t)}
                              className="h-full w-full border border-gold/15 bg-black/25 px-4 py-4 text-left transition hover:border-gold/40 hover:bg-white/5"
                            >
                              <p className="font-heading text-lg text-cream">{t.name}</p>
                              <p className="mt-1 font-mono text-[0.7rem] text-gold/70">{t.code}</p>
                              <p className="mt-2 text-xs text-cream/45">
                                {t.fieldCount} fields · tap to fill
                              </p>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
