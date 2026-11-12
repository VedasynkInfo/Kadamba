import { Reveal } from '@/components/site';

const EXPECTATIONS = [
  {
    id: 'e1',
    step: '01',
    title: 'Before you come',
    body: 'Send the form with a date, a budget and any photographs you have saved. If you are travelling from another city, tell us the days you will be in Kurnool so the fitting can be planned around them.',
  },
  {
    id: 'e2',
    step: '02',
    title: 'At the studio',
    body: 'Ninety minutes at the table. Cloth is brought out, silhouettes are sketched, measurements are taken properly. You will leave knowing what is possible, what it costs, and when it can be ready.',
  },
  {
    id: 'e3',
    step: '03',
    title: 'After the appointment',
    body: 'A written estimate and a reference ID within a working day. Nothing is cut until you approve the estimate and the sketch — and the calendar is checked before any deposit is taken.',
  },
];

/**
 * What a first appointment actually is.
 *
 * The form asks for a fair amount of information, so this section earns it: it
 * sets the shape of the visit, the ninety minutes it takes, and the fact that no
 * money changes hands until there is a written estimate.
 */
export function ExpectationsSection() {
  return (
    <section className="house-section bg-surface">
      <div className="house-container">
        <Reveal className="max-w-2xl">
          <p className="eyebrow">What happens next</p>
          <h2 className="display-lg mt-6 text-ink">
            A first visit, <span className="display-accent">without obligation.</span>
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-px bg-ink/12 md:grid-cols-3">
          {EXPECTATIONS.map((item, index) => (
            <Reveal
              key={item.id}
              delay={index * 0.06}
              className="bg-surface p-7 md:p-9"
            >
              <p className="font-mono text-[0.6rem] tabular-nums tracking-[0.2em] text-brand-strong">
                {item.step}
              </p>
              <h3 className="mt-5 font-heading text-2xl text-ink">{item.title}</h3>
              <p className="mt-3 text-[0.9rem] leading-relaxed text-ink/60">{item.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
