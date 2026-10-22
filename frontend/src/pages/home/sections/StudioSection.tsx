import { useScrollReveal } from '@/hooks/useScrollReveal';
import { useParallax } from '@/hooks/useParallax';
import { Section, SectionIntro } from '@/components/ui';
import { studioDisciplines } from '../data';

/**
 * The atelier.
 *
 * A two-column section: the studio on one side, the disciplines on the other.
 * The image drifts against the scroll — a slow parallax — while the list
 * reveals in step, so the section reads as one movement rather than two
 * stacked blocks.
 */
export function StudioSection() {
  const sectionRef = useParallax<HTMLDivElement>({ amount: 7 });
  const listRef = useScrollReveal<HTMLUListElement>({ selector: '[data-reveal]' });

  return (
    <Section tone="light" className="py-16 md:py-24">
      <div ref={sectionRef}>
        <SectionIntro
          eyebrow="The atelier"
          title="A tailoring house, not a shop floor"
          description="Four disciplines, one workshop, and the patience to get a silhouette right before anything else happens."
        />
      </div>

      <div className="mt-12 grid gap-10 md:mt-16 md:grid-cols-[0.9fr_1.1fr] md:gap-16">
        <div className="relative overflow-hidden rounded-2xl">
          <img
            src="/media/placeholders/boutique.jpg"
            alt="Inside the Kadamba studio in Kurnool"
            loading="lazy"
            className="h-full min-h-[22rem] w-full object-cover"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-espresso/45 to-transparent" />
          <p className="absolute bottom-5 left-6 font-heading text-xl text-ink-inverse">
            The workshop, Kurnool
          </p>
        </div>

        <ul ref={listRef} className="grid gap-8 sm:grid-cols-2">
          {studioDisciplines.map((item) => (
            <li key={item.id} data-reveal className="border-t border-line pt-5">
              <h3 className="font-heading text-xl leading-snug">{item.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-ink/70">{item.description}</p>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}
