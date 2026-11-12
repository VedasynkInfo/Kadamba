import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ParallaxImage } from '@/components/motion/ParallaxImage';
import { Reveal, SectionHead } from '@/components/site';
import { usePublicCatalog } from '@/hooks/usePublicProducts';
import { productImage } from '@/pages/products/data';
import { cn } from '@/utils/cn';

/** The categories the home page chooses to show, in reading order. */
const CURATED = ['BRIDAL', 'BLOUSES', 'KURTIS', 'GOWNS', 'CUSTOM'];

/** Plate shapes, so the grid reads as a spread rather than a template. The
 *  heights are fixed per row rather than set with aspect ratios: two plates of
 *  different widths in the same row must end on the same line. */
const LAYOUT = [
  'lg:col-span-7 lg:h-[31rem]',
  'lg:col-span-5 lg:h-[31rem]',
  'lg:col-span-4 lg:h-[27rem]',
  'lg:col-span-4 lg:h-[27rem]',
  'lg:col-span-4 lg:h-[27rem]',
];

const FALLBACK_IMAGE: Record<string, string> = {
  BRIDAL: '/media/photos/bridal-red-lehenga.jpg',
  BLOUSES: '/media/photos/fabric-embroidery.jpg',
  KURTIS: '/media/photos/saree-portrait-2.jpg',
  GOWNS: '/media/photos/gown-red.jpg',
  CUSTOM: '/media/photos/atelier-sewing.jpg',
};

/**
 * The collections.
 *
 * The catalogue is driven by the live product types in the console, but shown
 * as *collections* rather than as a shop grid: five plates, each one a category
 * with a count of what can be made in it. Nothing is for sale off a shelf here,
 * so presenting stock photography and prices would be a lie — what a visitor
 * needs to see is the range, and then a way into it.
 */
export function CollectionsSection() {
  const { catalog, isLoading } = usePublicCatalog();

  const collections = useMemo(() => {
    const products = catalog?.products ?? [];
    const categories = catalog?.categories ?? [];

    return CURATED.map((code) => {
      const category = categories.find((item) => item.code === code);
      const items = products.filter((product) => product.category?.code === code);
      const lead = items[0];

      return {
        code,
        title: category?.name ?? code,
        count: items.length,
        image: lead ? productImage(lead) : FALLBACK_IMAGE[code] ?? '/media/photos/bridal-red-lehenga.jpg',
        sample: lead?.name ?? null,
      };
    }).filter((entry) => entry.count > 0 || !isLoading);
  }, [catalog, isLoading]);

  if (collections.length === 0) return null;

  return (
    <section className="house-section bg-surface">
      <div className="house-container">
        <SectionHead
          eyebrow="The collections"
          index="02"
          title="A wardrobe,"
          accent="not a rail."
          description="Every category below is made to order. Choose a shape, bring your measurements, and the studio will cut it for the person who will wear it."
          actions={
            <Link to="/products" className="link-arrow text-brand-strong">
              All collections
            </Link>
          }
        />

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-12">
          {collections.map((collection, index) => (
            <Reveal
              key={collection.code}
              delay={index * 0.06}
              className={cn(
                'group aspect-[4/3] lg:aspect-auto',
                LAYOUT[index] ?? 'lg:col-span-4 lg:h-[27rem]',
              )}
            >
              <Link
                to={`/products?category=${collection.code}`}
                className="plate plate-frame plate-hover group relative block h-full w-full overflow-hidden"
              >
                <ParallaxImage
                  src={collection.image}
                  alt={`${collection.title} from the Kadamba atelier`}
                  sizes="(min-width: 1024px) 40vw, 100vw"
                  className="absolute inset-0"
                  imageClassName="transition-transform duration-[1200ms] ease-luxury group-hover:scale-[1.04]"
                  speed={0.08 + (index % 3) * 0.015}
                />

                {/* The scrim is explicit rather than inherited from `plate-veil`:
                    on a pale plate the cream type has to be guaranteed a dark
                    ground, whatever photograph the studio uploads. */}
                <span
                  className="absolute inset-0 z-[2] bg-[linear-gradient(180deg,rgba(10,8,6,0.38)_0%,rgba(10,8,6,0.08)_40%,rgba(10,8,6,0.86)_100%)]"
                  aria-hidden
                />

                <span className="absolute left-6 top-6 z-[3] text-[0.55rem] font-semibold uppercase tracking-[0.28em] text-ink-inverse/70 md:left-8 md:top-8">
                  {String(index + 1).padStart(2, '0')} &middot; Collection
                </span>

                <span className="absolute inset-x-0 bottom-0 z-[3] flex items-end justify-between gap-4 p-6 md:p-8">
                  <span className="min-w-0">
                    <span className="block font-heading text-2xl leading-tight text-ink-inverse md:text-[1.75rem]">
                      {collection.title}
                    </span>
                    <span className="mt-2 block font-mono text-[0.58rem] tabular-nums uppercase tracking-[0.18em] text-gold">
                      {String(collection.count).padStart(2, '0')} patterns
                    </span>
                  </span>

                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-ink-inverse/40 text-ink-inverse transition-all duration-500 group-hover:border-gold group-hover:text-gold">
                    <svg viewBox="0 0 24 24" className="size-3.5" fill="none" aria-hidden>
                      <path
                        d="M5 19 19 5M8 5h11v11"
                        stroke="currentColor"
                        strokeWidth="1.3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </span>
              </Link>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-10 flex flex-col gap-4 border-t border-ink/12 pt-6 text-sm text-ink/70 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Everything is made to order. Lead times run from three days for an alteration to
            sixteen weeks for hand-worked bridal.
          </p>
          <Link to="/request-service" className="link-arrow shrink-0 text-brand-strong">
            Ask about a piece
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
