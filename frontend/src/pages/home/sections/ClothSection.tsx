import { OptimizedImage } from '@/components/media/OptimizedImage';
import { Reveal, SectionHead } from '@/components/site';
import { Parallax } from '@/components/motion/Parallax';
import { clothNotes, plate } from '../content';

/**
 * The cloth.
 *
 * A dressmaker is only as good as what she is willing to cut. This section is a
 * short, honest library of the four fabrics the studio works in most — where
 * each comes from, what it is for, and what it does over time — set against a
 * single plate of the cloth itself. No swatch fan, no invented mill names.
 */
export function ClothSection() {
  return (
    <section className="house-section bg-surface">
      <div className="house-container">
        <SectionHead
          eyebrow="The cloth"
          index="03"
          title="Bought for the garment,"
          accent="not for the rail."
          description="Cloth is chosen after the silhouette is drawn, in daylight, against the person who will wear it. These are the four the studio returns to."
        />

        <div className="mt-14 grid gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:gap-20">
          <div className="lg:sticky lg:top-24 lg:self-start">
            <Reveal>
              <div className="plate plate-frame plate-frame-dark plate-hover aspect-[4/5] w-full overflow-hidden">
                <Parallax speed={0.18} scale={1.18} className="h-full w-full">
                  <OptimizedImage
                    src={plate.fabric}
                    alt="Handloom cloth folded on the cutting table"
                    sizes="(min-width: 1024px) 34vw, 100vw"
                    className="h-full w-full object-cover"
                  />
                </Parallax>
              </div>
              <p className="mt-4 text-[0.6rem] uppercase tracking-[0.26em] text-ink/65">
                The cloth table &middot; morning light
              </p>
            </Reveal>
          </div>

          <div>
            <dl className="border-t border-ink/12">
              {clothNotes.map((cloth, index) => (
                <Reveal
                  key={cloth.id}
                  delay={index * 0.05}
                  className="grid gap-3 border-b border-ink/12 py-7 md:grid-cols-[0.9fr_0.6fr_1.4fr] md:items-baseline md:gap-6"
                >
                  <dt>
                    <span className="block font-heading text-xl text-ink md:text-2xl">
                      {cloth.name}
                    </span>
                    <span className="mt-1 block text-[0.58rem] font-semibold uppercase tracking-[0.22em] text-brand-strong">
                      {cloth.origin}
                    </span>
                  </dt>
                  <dd className="text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-ink/65">
                    {cloth.use}
                  </dd>
                  <dd className="text-sm leading-relaxed text-ink/62">{cloth.description}</dd>
                </Reveal>
              ))}
            </dl>

            <p className="mt-8 max-w-lg text-sm leading-relaxed text-ink/70">
              Bring your own cloth if it has meaning — a mother&rsquo;s saree, a length bought on a
              trip. We will tell you honestly whether it will carry the design you have in mind.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
