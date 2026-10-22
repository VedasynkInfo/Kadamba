import { Navigate, useParams } from 'react-router-dom';
import { Spinner } from '@/components/ui';
import { ContentError } from '@/components/feedback/ContentState';
import { usePublicCatalog, usePublicProduct } from '@/hooks/usePublicProducts';
import { faqJsonLd, JsonLd, PageMeta, productJsonLd } from '@/seo';
import { productFaqs, productImage, productPath } from './data';
import {
  ProductBannerSection,
  ProductCareSection,
  ProductCtaSection,
  ProductFaqSection,
  ProductGallerySection,
  ProductMakingSection,
  ProductNotesSection,
  ProductRelatedSection,
} from './sections';

/**
 * Product detail from the public catalogue.
 *
 * The page reads the product by slug for its canonical record and the catalogue
 * list for related pieces. Both queries share the 5-minute storefront stale
 * time, so a visit from the index usually renders without a second request.
 */
export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { product, isLoading, error, refresh } = usePublicProduct(slug);
  const { catalog } = usePublicCatalog();
  const products = catalog?.products ?? [];

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner label="Loading piece" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20">
        <ContentError error={error} onRetry={refresh} />
      </div>
    );
  }

  if (!product) {
    return <Navigate to="/products" replace />;
  }

  const path = productPath(product);
  const description =
    product.seo?.metaDescription ||
    product.publicDescription ||
    product.description ||
    `${product.name} made to measure at Kadamba in Kurnool.`;

  return (
    <>
      <PageMeta
        title={product.seo?.metaTitle || product.name}
        description={description}
        path={path}
        image={product.seo?.ogImage || productImage(product)}
      />
      <JsonLd
        data={[
          productJsonLd({
            name: product.name,
            description: product.seo?.ogDescription || description,
            path,
            image: product.seo?.ogImage || productImage(product),
            category: product.category?.name,
            priceRange: product.indicativePriceRange,
          }),
          faqJsonLd(productFaqs),
        ]}
      />
      <ProductBannerSection product={product} />
      <ProductNotesSection product={product} />
      <ProductMakingSection product={product} />
      <ProductGallerySection product={product} />
      <ProductCareSection product={product} />
      <ProductFaqSection />
      <ProductRelatedSection product={product} products={products} />
      <ProductCtaSection />
    </>
  );
}
