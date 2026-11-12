import { OptimizedImage } from '@/components/media/OptimizedImage';
import { Reveal, StatBand, WordReveal } from '@/components/site';
import { plate, houseStats, manifesto } from '../content';

/**
 * The letter under the banner.
 *
 * A page that opens with a photograph has to say, immediately after it, who is
 * speaking and why they are worth listening to. This is that paragraph: the
 * house's own voice, one plate of the room it happens in, and the record in four
 * figures underneath. It is deliberately the quietest section on the page.
 */
export function LetterSection() {
  return (
    <section className="house-section relative bg-surface">
      <div className="house-container">
        <Reveal className="max-w-4xl">
          <p className="eyebrow">{manifesto.eyebrow}</p>
          <h2 className="display-lg mt-6 text-ink">
            {manifesto.title} <span className="display-accent">{manifesto.accent}</span>
          </h2>
        </Reveal>

        <div className="mt-14 grid gap-12 lg:grid-cols-[0.62fr_1fr] lg:gap-20">
          <Reveal>
            <div className="plate plate-frame plate-frame-dark plate-hover aspect-[4/5]">
              <OptimizedImage
                src={plate.atelier}
                alt="The Kadamba atelier: a cutting table, a mirror and morning light"
                sizes="(min-width: 1024px) 32vw, 100vw"
                className="h-full w-full object-cover"
              />
            </div>
            <p className="mt-4 flex items-baseline justify-between gap-4 text-[0.6rem] uppercase tracking-[0.26em] text-ink/65">
              <span>The atelier</span>
              <span>Kurnool, A.P.</span>
            </p>
          </Reveal>

          <Reveal delay={0.1} className="flex flex-col justify-between">
            <div className="space-y-6">
              <WordReveal
                text={manifesto.paragraphs[0]}
                className="font-heading text-[clamp(1.45rem,2.7vw,2.35rem)] font-light leading-[1.35] tracking-[-0.01em] text-ink/90"
              />
              {manifesto.paragraphs.slice(1).map((paragraph) => (
                <p key={paragraph.slice(0, 24)} className="text-[1.02rem] leading-[1.85] text-ink/72">
                  {paragraph}
                </p>
              ))}
            </div>

            <div className="mt-11 border-t border-ink/12 pt-8">
              <p className="font-heading text-2xl italic text-ink">{manifesto.signature}</p>
              <p className="mt-2 text-[0.62rem] uppercase tracking-[0.26em] text-ink/65">
                {manifesto.signatureNote}
              </p>
            </div>
          </Reveal>
        </div>

        <Reveal className="mt-16 border-t border-ink/12 pt-12">
          <StatBand items={houseStats} />
        </Reveal>
      </div>
    </section>
  );
}
