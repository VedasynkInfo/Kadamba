import { useState } from 'react';
import { Icon } from '@/components/icons';
import { Section, SectionIntro } from '@/components/ui';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import type { ServiceDetail } from '@/pages/services/data';
import { questionsForService } from '@/pages/services/data';

/**
 * The questions, answered.
 *
 * The accordion is the point: a reader who is looking for one answer should
 * not have to scroll past four paragraphs to find it, and a reader on a phone
 * should be able to open one at a time.
 */
export function ServiceQuestionsSection({ service }: { service: ServiceDetail }) {
  const questions = questionsForService(service.slug);
  const [open, setOpen] = useState<string | null>(questions[0]?.question ?? null);
  const listRef = useScrollReveal<HTMLDivElement>({ selector: '[data-reveal]' });

  return (
    <Section tone="light" className="py-16 md:py-20">
      <SectionIntro
        eyebrow="Questions"
        title={`Before you come to the studio`}
        description="The questions we are asked most often about this kind of work, answered properly."
      />

      <div ref={listRef} className="mt-10 divide-y divide-line border-y border-line">
        {questions.map((item) => {
          const isOpen = open === item.question;
          return (
            <div key={item.question} data-reveal>
              <h3>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : item.question)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-6 py-5 text-left transition-colors hover:text-brand-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                >
                  <span className="font-heading text-lg leading-snug text-ink">{item.question}</span>
                  <Icon
                    name="chevronDown"
                    size={18}
                    className={isOpen ? 'shrink-0 rotate-180 text-brand-strong' : 'shrink-0 text-ink/65'}
                  />
                </button>
              </h3>
              {isOpen ? (
                <p className="max-w-3xl pb-6 text-sm leading-relaxed text-ink/70">{item.answer}</p>
              ) : null}
            </div>
          );
        })}
      </div>
    </Section>
  );
}

/**
 * How a piece is made.
 *
 * The same four steps for every order, whether it is a blouse or a bridal
 * lehenga: the cloth, the pattern, the hand, the fitting. The point is that
 * a client knows what they are paying for before they send the request.
 */
export function ServiceProcessSection() {
  const listRef = useScrollReveal<HTMLOListElement>({ selector: '[data-reveal]', stagger: 0.1 });

  const steps = [
    {
      id: 'step-1',
      title: 'Enquire',
      body: 'Tell the studio the occasion, the date and the budget. A call follows within a working day, and nothing is measured before it.',
    },
    {
      id: 'step-2',
      title: 'Confirm',
      body: 'The fabric, the silhouette and the timeline are agreed in the studio, with the measurements taken on you, in your own clothes.',
    },
    {
      id: 'step-3',
      title: 'Make',
      body: 'The cloth is cut, the hand work is done, and the garment is built. The pattern is kept, so the second garment is a small job rather than a new one.',
    },
    {
      id: 'step-4',
      title: 'Fit and deliver',
      body: 'It is tried on, worn for an hour, corrected, and finished. Corrections after that are free for as long as it is yours.',
    },
  ];

  return (
    <Section tone="dark" className="on-dark py-16 md:py-24">
      <SectionIntro
        eyebrow="The way through"
        title="Four steps, and you know where you are at each one"
        description="The same process for every order, so nothing about it is a surprise."
      />
      <ol ref={listRef} className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step, index) => (
          <li key={step.id} data-reveal className="border-t border-ink-inverse/20 pt-5">
            <p className="text-[0.65rem] uppercase tracking-[0.28em] text-gold/85">
              {String(index + 1).padStart(2, '0')}
            </p>
            <h3 className="mt-3 font-heading text-xl text-ink-inverse">{step.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-ink-inverse/70">{step.body}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
