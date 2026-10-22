import { useMemo, type ReactNode } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { OptimizedImage } from '@/components/media/OptimizedImage';
import { ContentEmpty, ContentError, ContentLoading } from '@/components/feedback/ContentState';
import { SectionHead } from '@/components/site';
import { usePublicCatalog } from '@/hooks/usePublicProducts';
import { cn } from '@/utils/cn';
import { productImage, productPath, productsCatalogIntro } from '../data';

/**
 * The collections index.
 *
 * The catalogue is the workshop's own product types, so adding a category in the
 * console adds a filter here without a deploy. It is presented as a lookbook
 * rather than a shop: plates with a caption, no cart, and the honest lead time
 * under each piece.
 *
 * The active category lives in the URL (`?category=BRIDAL`) so the collections
 * plates on the home page can land a visitor on the right filter instead of the
 * top of an unfiltered grid.
 */
export function ProductsCatalogSection() {
  const { catalog, isLoading, error, refresh } = usePublicCatalog();
  const [params, setParams] = useSearchParams();

  const products = useMemo(() => catalog?.products ?? [], [catalog]);
  const categories = useMemo(() => catalog?.categories ?? [], [catalog]);

  const requested = params.get('category') ?? 'All';
  const known = categories.some((item) => item.code === requested);
  const category = requested === 'All' || known ? requested : 'All';

  const filtered = useMemo(
    () =>
      category === 'All'
        ? products
        : products.filter((product) => product.category?.code === category),
    [category, products],
  );

  function choose(code: string) {
    const next = new URLSearchParams(params);
    if (code === 'All') next.delete('category');
    else next.set('category', code);
    setParams(next, { replace: true });
  }

  const activeName =
    category === 'All'
      ? 'All collections'
      : (categories.find((item) => item.code === category)?.name ?? 'Collection');

  return (
    <section className="house-section bg-surface">
      <div className="house-container">
        <SectionHead
          eyebrow="The catalogue"
          title={productsCatalogIntro.title}
          accent="made for you."
          description={productsCatalogIntro.description}
          actions={
            <span className="text-[0.6rem] uppercase tracking-[0.24em] text-ink/40">
              {String(filtered.length).padStart(2, '0')} pieces
            </span>
          }
        />

        <div
          className="mt-12 flex flex-wrap items-center gap-x-7 gap-y-3 border-b border-ink/12 pb-3"
          role="group"
          aria-label="Filter collections"
        >
          <FilterButton active={category === 'All'} onClick={() => choose('All')}>
            All
          </FilterButton>
          {categories.map((item) => (
            <FilterButton
              key={item.id}
              active={category === item.code}
              onClick={() => choose(item.code)}
            >
              {item.name}
            </FilterButton>
          ))}
        </div>

        <p className="mt-4 text-[0.6rem] uppercase tracking-[0.24em] text-ink/35" aria-live="polite">
          Showing {activeName}
        </p>

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
            <ul className="grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((product) => (
                <li key={product.id}>
                  <div>
                    <Link
                      to={productPath(product)}
                      viewTransition
                      className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2"
                    >
                      <div className="plate plate-frame plate-hover relative aspect-[4/5] overflow-hidden bg-surface-sunken">
                        <OptimizedImage
                          src={productImage(product)}
                          alt={product.gallery[0]?.alt || `${product.name} from Kadamba`}
                          sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
                          width={900}
                          height={1125}
                          className="h-full w-full object-cover transition-transform duration-700 ease-luxury group-hover:scale-105"
                        />
                        <div
                          className="absolute inset-0 z-[1] bg-gradient-to-t from-espresso/60 via-transparent to-transparent"
                          aria-hidden
                        />
                        <span className="absolute bottom-4 left-4 z-[3] text-[0.58rem] font-semibold uppercase tracking-[0.26em] text-gold">
                          {product.category?.name ?? 'Atelier'}
                        </span>
                        {product.featured ? (
                          <span className="absolute right-4 top-4 z-[3] border border-gold/60 bg-espresso/70 px-2.5 py-1 text-[0.55rem] font-semibold uppercase tracking-[0.18em] text-gold backdrop-blur-sm">
                            Featured
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-5 flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <h3 className="font-heading text-2xl leading-tight text-ink transition-colors group-hover:text-brand-strong">
                            {product.name}
                          </h3>
                          <p className="mt-2 line-clamp-2 max-w-md text-sm leading-relaxed text-ink/55">
                            {product.publicDescription ||
                              product.description ||
                              'Made to measure in Kurnool.'}
                          </p>
                        </div>
                        <span
                          className="mt-1 flex size-9 shrink-0 items-center justify-center rounded-full border border-ink/15 text-ink/40 transition-colors group-hover:border-brand-strong group-hover:text-brand-strong"
                          aria-hidden
                        >
                          <svg viewBox="0 0 24 24" className="size-3.5" fill="none">
                            <path
                              d="M5 19 19 5M8 5h11v11"
                              stroke="currentColor"
                              strokeWidth="1.3"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </span>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-ink/10 pt-3 text-[0.58rem] uppercase tracking-[0.18em] text-ink/45">
                        <span>
                          {product.indicativePriceRange ?? 'Price on consultation'}
                        </span>
                        {product.leadTimeDays ? (
                          <span>{product.leadTimeDays} days to make</span>
                        ) : null}
                        <span>Made to measure</span>
                      </div>
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-ink/12 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-xl text-sm leading-relaxed text-ink/55">
            Nothing here is sold off a shelf. Choose a silhouette, book a fitting, and the studio
            will draft the pattern to your measurements in the cloth you choose.
          </p>
          <Link to="/request-service" className="link-arrow shrink-0 text-brand-strong">
            Ask about a piece
          </Link>
        </div>
      </div>
    </section>
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
        'min-h-9 border-b pb-2 text-[0.6rem] font-semibold uppercase tracking-[0.2em] transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2',
        active
          ? 'border-brand-strong text-ink'
          : 'border-transparent text-ink/40 hover:text-ink/75',
      )}
    >
      {children}
    </button>
  );
}
