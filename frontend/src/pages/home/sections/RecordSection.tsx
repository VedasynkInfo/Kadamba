import { Reveal, StatBand } from '@/components/site';
import { houseStats } from '../content';

/**
 * The record.
 *
 * A dark interruption between the studio story and the journal, carrying the
 * numbers and one client's sentence. The numbers are printed, not counted up:
 * on a page about trust, a counter reads as a device.
 */
export function RecordSection() {
  return (
    <section className="on-dark relative overflow-hidden bg-espresso text-ink-inverse">
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_10%,rgba(201,162,39,0.14),transparent_58%)]"
        aria-hidden
      />
      <div className="house-container relative grid gap-14 py-[calc(var(--section-y)*0.9)] lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-20">
        <div>
          <Reveal>
            <p className="eyebrow text-gold/85">The record</p>
            <h2 className="display-lg mt-6 text-ink-inverse">
              Fifteen years, <span className="display-accent">measured in fittings.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.08} className="mt-12">
            <StatBand items={houseStats} tone="dark" columns={2} />
          </Reveal>
        </div>

        <Reveal delay={0.12} className="border-t border-ink-inverse/15 pt-10 lg:border-l lg:border-t-0 lg:pl-16 lg:pt-0">
          <p className="eyebrow eyebrow-plain text-gold/70">In their words</p>
          <blockquote className="mt-6">
            <p className="font-heading text-[clamp(1.5rem,2.6vw,2.2rem)] font-light italic leading-[1.3] text-ink-inverse/90">
              &ldquo;I came with a photograph from a film and a wedding date. They told me which
              part of the photograph was possible, and made that part better than the
              picture.&rdquo;
            </p>
          </blockquote>
          <figcaption className="mt-8 flex items-center gap-4">
            <span className="font-heading text-lg text-ink-inverse">Ananya R.</span>
            <span className="h-px w-8 bg-gold/50" aria-hidden />
            <span className="text-[0.58rem] uppercase tracking-[0.24em] text-ink-inverse/60">
              Bridal client &middot; Kurnool
            </span>
          </figcaption>
        </Reveal>
      </div>
    </section>
  );
}
