import { JsonLd, PageMeta, itemListJsonLd, staticPageMeta } from '@/seo';
import { CtaBand, PageHero } from '@/components/site';
import { usePublicCatalog } from '@/hooks/usePublicProducts';
import { productPath } from './data';
import { ProductsCatalogSection } from './sections';

/**
 * The collections.
 *
 * A catalogue of what the studio can make, not what it has in stock. Every piece
 * on this page is a pattern: the visitor chooses a silhouette, then the cloth,
 * then the measurements. The page says so plainly rather than pretending to be
 * a shop with a cart.
 */
export default function ProductsPage() {
  const { catalog } = usePublicCatalog();
  const products = catalog?.products ?? [];

  return (
    <>
      <PageMeta {...staticPageMeta.products} />
      {products.length > 0 ? (
        <JsonLd
          data={itemListJsonLd({
            name: 'Kadamba collection',
            items: products.map((product) => ({
              name: product.name,
              path: productPath(product),
            })),
          })}
        />
      ) : null}

      <PageHero
        variant="catalogue"
        eyebrow="The collections"
        title="Made to order,"
        accent="never off a rail."
        description="Bridal, blouses, kurtis, gowns and tailoring — the range of the house, each piece cut for the person who will wear it."
        image="/media/photos/bridal-seated.jpg"
        imageAlt="Oxblood silk with a hand-worked buti field"
        facts={[
          { label: 'Silhouettes', value: `${products.length}+` },
          { label: 'Lead time', value: '3 days – 16 weeks' },
          { label: 'Fittings', value: '2 included' },
          { label: 'Made in', value: 'Kurnool' },
        ]}
      />

      <ProductsCatalogSection />

      <CtaBand
        eyebrow="Not sure where to begin?"
        title="Choose the occasion."
        accent="We will find the silhouette."
        copy="Bring a photograph, a fabric, or just a date. The studio will tell you what can be made properly in the time you have — and what to do instead if it cannot."
        image="/media/photos/boutique-racks.jpg"
        action={{ label: 'Book a consultation', to: '/request-service' }}
      />
    </>
  );
}
