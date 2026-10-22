import { Section, SectionIntro } from '@/components/ui';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { processSteps } from '../data';

/**
 * Step-by-step studio process timeline.
 *
 * The connective line draws as the section enters, then each stage arrives
 * slightly after the one before it. This is a GSAP ScrollTrigger sequence
 * because the line and the four steps share one scroll position; doing it with
 * independent `whileInView` animations would let the line finish before the
 * first number appears.
 */
export function ProcessTimelineSection() {
  const revealRef = useScrollReveal<HTMLDivElement>({ y: 26, stagger: 0.06 });

  return (
    <Section tone="dark" className="py-16 md:py-24">
      <SectionIntro
        tone="dark"
        title="Our process"
        description="Four clear stages from consultation to final delivery of your outfit."
      />

      <div ref={revealRef} className="relative mt-12">
        <div
          className="pointer-events-none absolute left-0 right-0 top-5 hidden h-px bg-gold/25 md:block"
          data-reveal-line
          aria-hidden
        />
        <ol className="grid gap-8 md:grid-cols-4">
          {processSteps.map((step) => (
            <li key={step.id} className="relative" data-reveal>
              <span className="on-dark inline-flex size-10 items-center justify-center rounded-full border border-gold/50 bg-espresso font-heading text-sm text-gold">
                {step.step}
              </span>
              <h3 className="mt-4 font-heading text-xl text-ink-inverse">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-inverse/70">{step.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  );
}
