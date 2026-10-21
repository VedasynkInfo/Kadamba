import { JsonLd, PageMeta, itemListJsonLd, staticPageMeta } from '@/seo';
import { usePublicCatalog } from '@/hooks/usePublicProducts';
import { productPath } from './data';
import { ProductsCatalogSection, ProductsCtaSection, ProductsHeroSection } from './sections';

/**
 * Public collection index, fed by the same ProductType records the studio uses
 * for measurements and orders.
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
      <ProductsHeroSection />
      <ProductsCatalogSection />
      <ProductsCtaSection />
    </>
  );
}
