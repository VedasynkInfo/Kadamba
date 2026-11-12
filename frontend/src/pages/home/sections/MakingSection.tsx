import { Link } from 'react-router-dom';
import { Reveal } from '@/components/site';
import { makingSteps } from '../content';

/**
 * The making.
 *
 * Four movements, set as a numbered commission rather than a process diagram.
 * The heading stays with the reader while the steps pass — which is also how the
 * commission works: one point of contact, four stages, no silence in between.
 */
export function MakingSection() {
  return (
    <section className="house-section bg-surface-sunken">
      <div className="house-container grid gap-14 lg:grid-cols-[0.82fr_1.18fr] lg:gap-20">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <Reveal>
            <p className="eyebrow">The making</p>
            <h2 className="display-lg mt-6 text-ink">
              From a conversation <span className="display-accent">to a garment.</span>
            </h2>
            <p className="mt-6 max-w-sm text-[0.98rem] leading-relaxed text-ink/60">
              A Kadamba commission has four stages and one person who stays with it from beginning
              to end. You will never be handed to a different department.
            </p>
            <Link to="/about" className="link-arrow mt-8 inline-flex text-brand-strong">
              How the studio works
            </Link>
          </Reveal>

          <Reveal delay={0.1} className="mt-12 hidden lg:block">
            <div className="well p-6">
              <p className="text-[0.6rem] font-semibold uppercase tracking-[0.26em] text-ink/65">
                A note on timing
              </p>
              <p className="mt-3 font-heading text-lg italic leading-snug text-ink/80">
                &ldquo;Tell us the date before the design. A beautiful garment that arrives on the
                wrong day is not a beautiful garment.&rdquo;
              </p>
              <p className="mt-4 text-[0.6rem] uppercase tracking-[0.24em] text-ink/65">
                The fitting room
              </p>
            </div>
          </Reveal>
        </div>

        <ol className="relative">
          <span
            className="absolute bottom-4 left-[1.15rem] top-4 hidden w-px bg-ink/15 sm:block"
            aria-hidden
          />
          {makingSteps.map((step, index) => (
            <Reveal
              key={step.id}
              as="li"
              delay={index * 0.06}
              className="relative grid grid-cols-[auto_1fr] gap-6 pb-11 last:pb-0 sm:gap-8"
            >
              <span className="relative z-10 flex size-[2.3rem] shrink-0 items-center justify-center rounded-full border border-ink/15 bg-surface-sunken font-heading text-sm text-brand-strong sm:size-10">
                {step.step}
              </span>
              <div className="border-b border-ink/12 pb-9 last:border-0 last:pb-0">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <h3 className="font-heading text-2xl text-ink md:text-[1.8rem]">{step.title}</h3>
                  <span className="text-[0.58rem] font-semibold uppercase tracking-[0.22em] text-brand-strong">
                    {step.note}
                  </span>
                </div>
                <p className="mt-3 max-w-xl text-[0.94rem] leading-[1.8] text-ink/62">
                  {step.description}
                </p>
              </div>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
