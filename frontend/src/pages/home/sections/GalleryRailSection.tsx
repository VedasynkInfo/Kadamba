import { Link } from 'react-router-dom';
import { ParallaxImage } from '@/components/motion/ParallaxImage';
import { Reveal, SectionHead } from '@/components/site';
import { usePublicContent } from '@/hooks/usePublicContent';
import { plate } from '../content';

/** Fallback plates if the gallery is empty on a fresh install. */
const FALLBACK = [
  { id: 'g1', src: plate.bridal, title: 'Bridal silk', category: 'Bridal' },
  { id: 'g2', src: plate.embroidery, title: 'Maggam border', category: 'Details' },
  { id: 'g3', src: plate.saree, title: 'Handloom drape', category: 'Traditional' },
  { id: 'g4', src: plate.stitching, title: 'At the table', category: 'Tailoring' },
  { id: 'g5', src: plate.festive, title: 'Festive gold', category: 'Festive' },
  { id: 'g6', src: plate.fitting, title: 'Second fitting', category: 'Tailoring' },
];

/**
 * The work, as a rail.
 *
 * A horizontal seam of photographs that the visitor can push through, rather
 * than a masonry wall that asks them to scroll three screens of it. Each plate
 * links to the gallery, where the full collection and the lightbox live.
 */
export function GalleryRailSection() {
  const { gallery } = usePublicContent();

  const items =
    gallery.length > 0
      ? gallery.slice(0, 8).map((item) => ({
          id: item.id,
          src: item.mediaType === 'video' ? item.poster || item.src : item.src,
          title: item.title,
          category: item.category,
        }))
      : FALLBACK;

  return (
    <section className="house-section overflow-hidden bg-surface-sunken">
      <div className="house-container">
        <SectionHead
          eyebrow="From the studio floor"
          index="04"
          title="The work,"
          accent="as it is."
          description="Unretouched photographs from fittings, finished commissions and the table where they were cut."
          actions={
            <Link to="/gallery" className="link-arrow text-brand-strong">
              The full gallery
            </Link>
          }
        />
      </div>

      <Reveal className="mt-14">
        <div className="house-rail mt-14">
          {items.map((item, index) => (
            <Link
              key={item.id}
              to="/gallery"
              className="group relative w-[76vw] shrink-0 sm:w-[42vw] lg:w-[26vw]"
            >
              <div className="plate plate-frame plate-hover aspect-[4/5] w-full">
                <ParallaxImage
                  src={item.src}
                  alt={`${item.title} — ${item.category}`}
                  sizes="(min-width: 1024px) 26vw, 76vw"
                  className="absolute inset-0"
                  speed={0.06 + (index % 3) * 0.02}
                />
                <span className="absolute inset-x-0 bottom-0 z-[3] bg-gradient-to-t from-espresso/85 via-espresso/30 to-transparent p-5">
                  <span className="block text-[0.55rem] font-semibold uppercase tracking-[0.26em] text-gold/85">
                    {item.category}
                  </span>
                  <span className="mt-1 block font-heading text-lg text-ink-inverse">
                    {item.title}
                  </span>
                </span>
              </div>
              <span className="mt-3 flex items-center justify-between text-[0.55rem] uppercase tracking-[0.24em] text-ink/65">
                <span>{String(index + 1).padStart(2, '0')}</span>
                <span className="flex items-center gap-2 transition-colors group-hover:text-brand-strong">
                  View
                  <span aria-hidden>→</span>
                </span>
              </span>
            </Link>
          ))}
        </div>
      </Reveal>

      <div className="house-container mt-6">
        <p className="text-[0.58rem] uppercase tracking-[0.26em] text-ink/65">
          Drag or scroll sideways &middot; {items.length} plates
        </p>
      </div>
    </section>
  );
}
