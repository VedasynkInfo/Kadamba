import { useEffect, useState, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button, Input, Select, Spinner, Textarea, useToast } from '@/components/ui';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { brand } from '@/pages/home/data';
import { portalApi, type PortalCatalogItem } from '@/services/portal/portalService';

const budgetOptions = [
  { value: 'under-10k', label: 'Under ₹10,000' },
  { value: '10k-25k', label: '₹10,000 – ₹25,000' },
  { value: '25k-50k', label: '₹25,000 – ₹50,000' },
  { value: '50k-1L', label: '₹50,000 – ₹1 Lakh' },
  { value: 'above-1L', label: 'Above ₹1 Lakh' },
  { value: 'discuss', label: 'Prefer to discuss' },
];

const fabricOptions = [
  { value: 'have_fabric', label: 'I already have fabric' },
  { value: 'need_sourcing', label: 'Need fabric sourcing' },
  { value: 'undecided', label: 'Not sure yet' },
];

const timeOptions = [
  { value: '10:00', label: '10:00 AM' },
  { value: '11:30', label: '11:30 AM' },
  { value: '13:00', label: '1:00 PM' },
  { value: '15:00', label: '3:00 PM' },
  { value: '17:00', label: '5:00 PM' },
  { value: '18:30', label: '6:30 PM' },
];

function todayIso(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

export default function PortalRequestsPage() {
  const { toast } = useToast();
  const reduced = usePrefersReducedMotion();
  const [catalog, setCatalog] = useState<PortalCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<PortalCatalogItem | null>(null);
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [budget, setBudget] = useState('');
  const [occasion, setOccasion] = useState('');
  const [fabricStatus, setFabricStatus] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [doneId, setDoneId] = useState<string | null>(null);
  const [doneOrderNumber, setDoneOrderNumber] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const items = await portalApi.catalog();
        if (!cancelled) setCatalog(items);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load catalog');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function resetForm() {
    setPreferredDate('');
    setPreferredTime('');
    setBudget('');
    setOccasion('');
    setFabricStatus('');
    setMessage('');
  }

  function selectItem(item: PortalCatalogItem) {
    setSelected(item);
    setDoneId(null);
    resetForm();
    setPreferredDate(todayIso());
  }

  function backToList() {
    setSelected(null);
    setDoneId(null);
    setDoneOrderNumber(null);
    resetForm();
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selected) return;
    setSubmitting(true);
    try {
      const res = await portalApi.request({
        productTypeCode: selected.code,
        productName: selected.name,
        message: message.trim(),
        preferredDate,
        preferredTime: preferredTime || undefined,
        budget,
        occasion: occasion.trim() || undefined,
        fabricStatus: fabricStatus || undefined,
      });
      toast({ tone: 'success', title: 'Request sent', description: res.message });
      setDoneId(res.id);
      setDoneOrderNumber(res.orderNumber ?? null);
      resetForm();
    } catch (err) {
      toast({
        tone: 'error',
        title: 'Request failed',
        description: err instanceof Error ? err.message : 'Try again',
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner label="Loading catalog" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl text-cream">Browse & request</h1>
        <p className="mt-2 max-w-xl text-sm text-cream/55">
          Choose a garment from {brand.shortName}&apos;s catalog — we&apos;ll open a linked enquiry
          for your next fitting in {brand.location}.
        </p>
      </div>

      {error && !selected ? <p className="text-sm text-rose-300">{error}</p> : null}

      <AnimatePresence mode="wait">
        {selected ? (
          <motion.div
            key="form"
            initial={reduced ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduced ? undefined : { opacity: 0, y: -10 }}
            className="relative overflow-hidden border border-gold/25 bg-[radial-gradient(ellipse_at_top_left,_rgba(255,215,0,0.08),_transparent_55%),_#0c0a08]"
          >
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent" />

            <div className="p-5 sm:p-8">
              <button
                type="button"
                onClick={backToList}
                className="text-xs uppercase tracking-[0.18em] text-cream/50 hover:text-gold"
              >
                ← All garments
              </button>

              {doneId ? (
                <div className="mt-8 space-y-4 text-center sm:py-10">
                  <p className="text-[0.62rem] uppercase tracking-[0.35em] text-gold/80">Received</p>
                  <h2 className="font-heading text-3xl text-cream">We have your request</h2>
                  <p className="mx-auto max-w-md text-sm text-cream/60">
                    The boutique will follow up about <span className="text-gold">{selected.name}</span>.
                    {doneOrderNumber ? (
                      <>
                        {' '}
                        Your enquiry is Order <span className="text-gold">#{doneOrderNumber}</span> —
                        track it under Orders.
                      </>
                    ) : (
                      <> You can track updates in Chat.</>
                    )}
                  </p>
                  <div className="flex flex-wrap justify-center gap-3 pt-4">
                    <Button type="button" onClick={backToList}>
                      Request another
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        window.location.assign(doneOrderNumber ? '/portal/orders' : '/portal/chat');
                      }}
                    >
                      {doneOrderNumber ? 'View orders' : 'Open chat'}
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="mt-6 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
                    <div className="space-y-3 border border-gold/15 bg-black/30 p-5">
                      <p className="text-[0.62rem] uppercase tracking-[0.24em] text-cream/40">
                        {selected.categoryName || 'Garment'}
                      </p>
                      <h2 className="font-heading text-3xl text-cream">{selected.name}</h2>
                      <p className="font-mono text-xs text-gold/75">{selected.code}</p>
                      {selected.publicDescription ? (
                        <p className="text-sm leading-relaxed text-cream/60">
                          {selected.publicDescription}
                        </p>
                      ) : (
                        <p className="text-sm text-cream/50">
                          Custom tailoring with measurements, trials, and finishing at the studio.
                        </p>
                      )}
                      {selected.indicativePriceRange ? (
                        <p className="pt-2 text-sm text-gold/90">{selected.indicativePriceRange}</p>
                      ) : null}
                    </div>

                    <form onSubmit={onSubmit} className="space-y-4">
                      <p className="text-[0.62rem] uppercase tracking-[0.28em] text-gold/80">
                        Tell us your plan
                      </p>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <Input
                          label="Preferred date *"
                          type="date"
                          required
                          min={todayIso()}
                          value={preferredDate}
                          onChange={(e) => setPreferredDate(e.target.value)}
                        />
                        <Select
                          label="Preferred time *"
                          required
                          placeholder="Choose a slot"
                          options={timeOptions}
                          value={preferredTime}
                          onChange={(e) => setPreferredTime(e.target.value)}
                        />
                      </div>

                      <Select
                        label="Budget range *"
                        required
                        placeholder="Select budget"
                        options={budgetOptions}
                        value={budget}
                        onChange={(e) => setBudget(e.target.value)}
                      />

                      <Input
                        label="Occasion"
                        value={occasion}
                        onChange={(e) => setOccasion(e.target.value)}
                        placeholder="Wedding, festival, reception…"
                      />

                      <Select
                        label="Fabric status"
                        placeholder="Optional"
                        options={fabricOptions}
                        value={fabricStatus}
                        onChange={(e) => setFabricStatus(e.target.value)}
                      />

                      <Textarea
                        label="Requirements *"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        required
                        minLength={10}
                        rows={4}
                        placeholder="Colour, embroidery, neckline, delivery city…"
                      />

                      <div className="flex flex-wrap gap-3 pt-2">
                        <Button type="submit" disabled={submitting}>
                          {submitting ? 'Sending…' : 'Send request'}
                        </Button>
                        <Button type="button" variant="secondary" onClick={backToList}>
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.ul
            key="catalog"
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid gap-3 sm:grid-cols-2"
          >
            {catalog.length === 0 ? (
              <li className="col-span-full border border-gold/15 px-4 py-8 text-sm text-cream/50">
                No published products yet. Message the boutique from Chat instead.
              </li>
            ) : (
              catalog.map((item, i) => (
                <motion.li
                  key={item.id}
                  initial={reduced ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.3) }}
                >
                  <button
                    type="button"
                    onClick={() => selectItem(item)}
                    className="group h-full w-full border border-gold/15 bg-black/25 px-4 py-5 text-left transition hover:border-gold/45 hover:bg-white/[0.04]"
                  >
                    <p className="text-[0.65rem] uppercase tracking-[0.16em] text-cream/40">
                      {item.categoryName || item.categoryCode || 'Garment'}
                    </p>
                    <p className="mt-1 font-heading text-xl text-cream group-hover:text-gold">
                      {item.name}
                    </p>
                    <p className="mt-1 font-mono text-[0.7rem] text-gold/70">{item.code}</p>
                    {item.publicDescription ? (
                      <p className="mt-2 line-clamp-2 text-sm text-cream/55">
                        {item.publicDescription}
                      </p>
                    ) : null}
                    <p className="mt-4 text-[0.65rem] uppercase tracking-[0.18em] text-cream/40 group-hover:text-gold/80">
                      Request this →
                    </p>
                  </button>
                </motion.li>
              ))
            )}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
