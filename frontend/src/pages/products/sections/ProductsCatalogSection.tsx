import { useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { OptimizedImage } from '@/components/media/OptimizedImage';
import { ClipReveal } from '@/components/motion/ClipReveal';
import { ContentEmpty, ContentError, ContentLoading } from '@/components/feedback/ContentState';
import { Section, SectionIntro } from '@/components/ui';
import { usePublicCatalog } from '@/hooks/usePublicProducts';
import { cn } from '@/utils/cn';
import { productImage, productPath, productsCatalogIntro } from '../data';

/**
 * The storefront grid.
 *
 * Categories come from the same catalogue document as the garments, so adding a
 * category in the console adds a filter here without a frontend deploy.
 */
export function ProductsCatalogSection() {
  const { catalog, isLoading, error, refresh } = usePublicCatalog();
  const [category, setCategory] = useState('All');

  const products = useMemo(() => catalog?.products ?? [], [catalog]);
  const categories = useMemo(() => catalog?.categories ?? [], [catalog]);

  const filtered = useMemo(
    () =>
      category === 'All'
        ? products
        : products.filter((product) => product.category?.code === category),
    [category, products],
  );

  return (
    <Section tone="light" className="py-16 md:py-24">
      <SectionIntro
        title={productsCatalogIntro.title}
        description={productsCatalogIntro.description}
      />

      <div className="mt-8 flex flex-wrap gap-2" role="group" aria-label="Filter collections">
        <FilterButton active={category === 'All'} onClick={() => setCategory('All')}>
          All
        </FilterButton>
        {categories.map((item) => (
          <FilterButton
            key={item.id}
            active={category === item.code}
            onClick={() => setCategory(item.code)}
          >
            {item.name}
          </FilterButton>
        ))}
      </div>

      <div className="mt-10">
        {isLoading ? (
          <ContentLoading variant="grid" columns={3} count={6} label="Loading collection" />
        ) : null}
        {!isLoading && error ? <ContentError error={error} onRetry={refresh} /> : null}
        {!isLoading && !error && products.length === 0 ? (
          <ContentEmpty
            title="The catalogue is being prepared"
            description="New pieces will appear here as soon as the studio publishes them."
          />
        ) : null}
        {!isLoading && !error && products.length > 0 && filtered.length === 0 ? (
          <ContentEmpty
            title="No pieces in this category yet"
            description="Try another category, or ask the studio what is currently in progress."
          />
        ) : null}

        {!isLoading && !error && filtered.length > 0 ? (
          <ul className="grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((product, index) => (
              <li key={product.id}>
                <ClipReveal delay={(index % 3) * 0.06}>
                  <Link
                    to={productPath(product)}
                    viewTransition
                    className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
                  >
                    <div className="relative aspect-[4/5] overflow-hidden bg-surface-sunken">
                      <OptimizedImage
                        src={productImage(product)}
                        alt={product.gallery[0]?.alt || `${product.name} from Kadamba`}
                        sizes="(min-width: 1024px) 368px, (min-width: 640px) 50vw, 100vw"
                        width={900}
                        height={1125}
                        className="h-full w-full object-cover transition-transform duration-700 ease-luxury group-hover:scale-105"
                      />
                      <div
                        className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent"
                        aria-hidden
                      />
                      <span className="absolute bottom-4 left-4 text-[0.65rem] uppercase tracking-[0.24em] text-gold">
                        {product.category?.name ?? 'Atelier'}
                      </span>
                      {product.featured ? (
                        <span className="absolute right-4 top-4 rounded-full bg-gold/90 px-2.5 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.18em] text-black">
                          Featured
                        </span>
                      ) : null}
                    </div>
                    <h3 className="mt-4 font-heading text-2xl text-ink">{product.name}</h3>
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink/65">
                      {product.publicDescription ||
                        product.description ||
                        'Made to measure in Kurnool.'}
                    </p>
                    {product.indicativePriceRange ? (
                      <p className="mt-3 text-xs uppercase tracking-[0.18em] text-ink/70">
                        {product.indicativePriceRange}
                      </p>
                    ) : null}
                    {product.leadTimeDays ? (
                      <p className="mt-1 text-xs text-ink/70">
                        About {product.leadTimeDays} days to make
                      </p>
                    ) : null}
                  </Link>
                </ClipReveal>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </Section>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'min-h-10 rounded-full border px-4 text-xs uppercase tracking-[0.16em] transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus',
        active
          ? 'border-brand bg-brand text-ink-on-brand'
          : 'border-line text-ink/70 hover:border-brand-strong hover:text-brand-strong',
      )}
    >
      {children}
    </button>
  );
}
