import { Reveal, SectionHead } from '@/components/site';
import { principles } from '../content';

/**
 * Four promises, set as a creed.
 *
 * Not "why choose us" with icons. These are the four things the studio will and
 * will not do, written so a bride can hold them to it — which is a more useful
 * form of trust than an adjective.
 */
export function PrinciplesSection() {
  return (
    <section className="house-section bg-surface">
      <div className="house-container">
        <SectionHead
          eyebrow="How we work"
          index="05"
          title="Four promises,"
          accent="kept small."
          description="They are not ambitions. They are the operating rules of the studio, and every client is entitled to them."
        />

        <div className="mt-14 grid gap-px bg-ink/12 sm:grid-cols-2">
          {principles.map((principle, index) => (
            <Reveal
              key={principle.id}
              delay={index * 0.05}
              className="group bg-surface p-7 transition-colors duration-500 hover:bg-surface-sunken md:p-9"
            >
              <div className="flex items-baseline justify-between gap-4">
                <span className="font-heading text-4xl text-ink/15 transition-colors duration-500 group-hover:text-brand-strong/40">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="h-px flex-1 bg-ink/10" aria-hidden />
                <span className="text-[0.55rem] font-semibold uppercase tracking-[0.26em] text-ink/35">
                  The house
                </span>
              </div>
              <h3 className="mt-6 font-heading text-2xl leading-snug text-ink md:text-[1.7rem]">
                {principle.title}
              </h3>
              <p className="mt-3 max-w-md text-[0.92rem] leading-relaxed text-ink/60">
                {principle.description}
              </p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
