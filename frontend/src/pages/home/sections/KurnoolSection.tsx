import { useScrollReveal } from '@/hooks/useScrollReveal';
import { useParallax } from '@/hooks/useParallax';
import { Icon } from '@/components/icons';
import { Section, SectionIntro } from '@/components/ui';
import { kurnoolNotes } from '../data';

/**
 * Kurnool.
 *
 * The studio's own city, said plainly: what it has meant for fifteen years,
 * where the appointments happen, and how far the work travels. Local trust is
 * the whole argument for a boutique — a city that has seen the work done is
 * worth more than a larger studio it cannot check.
 */
export function KurnoolSection() {
  const scopeRef = useParallax<HTMLDivElement>({ amount: 5, start: 'top bottom', end: 'bottom top' });
  const listRef = useScrollReveal<HTMLUListElement>({ selector: '[data-reveal]' });

  return (
    <Section tone="light" className="py-16 md:py-24">
      <div className="grid gap-12 md:grid-cols-[1.05fr_0.95fr] md:gap-16">
        <div>
          <SectionIntro
            eyebrow="Kurnool"
            title="The city we answer to"
            description="Kadamba is a Kurnool studio. The measurements are taken here, the fittings are here, and the work leaves here."
          />

          <ul ref={listRef} className="mt-10 grid gap-7">
            {kurnoolNotes.map((note) => (
              <li key={note.id} data-reveal className="flex gap-4 border-t border-line pt-5">
                <Icon name="check" size={16} className="mt-1 shrink-0 text-brand-strong" />
                <div>
                  <h3 className="font-heading text-lg leading-snug">{note.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink/70">{note.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div ref={scopeRef} className="relative overflow-hidden rounded-2xl">
          <img
            src="/media/placeholders/saree.jpg"
            alt="Traditional drape in a Kurnool studio"
            loading="lazy"
            className="h-full min-h-[26rem] w-full object-cover"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-espresso/60 via-espresso/10 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-7 text-ink-inverse">
            <p className="text-[0.65rem] uppercase tracking-[0.28em] text-gold/85">The studio</p>
            <p className="mt-2 font-heading text-2xl leading-snug">
              Kurnool, Andhra Pradesh
            </p>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink-inverse/75">
              By appointment, seven days a week. Call the studio or send a request and we
              will find a time that suits you.
            </p>
          </div>
        </div>
      </div>
    </Section>
  );
}
