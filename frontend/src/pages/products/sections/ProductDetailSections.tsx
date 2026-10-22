import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { OptimizedImage } from '@/components/media/OptimizedImage';
import { ClipReveal } from '@/components/motion/ClipReveal';
import { Button, Section, SectionIntro } from '@/components/ui';
import type { PublicProduct } from '@/services/products/publicProductService';
import { ImageLightbox } from '@/pages/home/sections/ImageLightbox';
import { productDetailCopy, productFaqs, productImage, productPath } from '../data';

export function ProductBannerSection({ product }: { product: PublicProduct }) {
  const navigate = useNavigate();

  return (
    <section className="bg-espresso text-ink-inverse">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.1fr_1fr] md:items-center md:py-20 lg:px-8">
        <ClipReveal className="relative aspect-[4/5] bg-white/5 md:aspect-[4/4.6]">
          <OptimizedImage
            src={productImage(product)}
            alt={product.gallery[0]?.alt || `${product.name} made by Kadamba`}
            priority
            sizes="(min-width: 768px) 540px, 100vw"
            width={1200}
            height={1440}
            className="h-full w-full object-cover"
          />
        </ClipReveal>

        <div>
          <nav aria-label="Breadcrumb" className="text-xs text-ink-inverse/60">
            <ol className="flex flex-wrap items-center gap-2">
              <li>
                <Link to="/products" viewTransition className="link-sweep hover:text-gold">
                  Collections
                </Link>
              </li>
              <li aria-hidden>/</li>
              <li className="text-ink-inverse/85">{product.category?.name ?? 'Atelier'}</li>
            </ol>
          </nav>

          <p className="mt-6 text-[0.65rem] uppercase tracking-[0.28em] text-gold">
            {product.category?.name ?? 'Atelier piece'}
          </p>
          <h1 className="mt-3 font-heading text-4xl leading-tight text-ink-inverse md:text-5xl">
            {product.name}
          </h1>
          {product.indicativePriceRange ? (
            <p className="mt-4 text-sm text-ink-inverse/70">{product.indicativePriceRange}</p>
          ) : null}
          {product.leadTimeDays ? (
            <p className="mt-2 inline-flex rounded-full border border-gold/30 px-3 py-1 text-xs text-gold">
              Made in about {product.leadTimeDays} days
            </p>
          ) : null}
          {product.leadTimeNote ? (
            <p className="mt-2 text-xs leading-relaxed text-ink-inverse/55">
              {product.leadTimeNote}
            </p>
          ) : null}
          <p className="text-lede mt-6 text-ink-inverse/75">
            {product.publicDescription || product.description || 'Made to measure in Kurnool.'}
          </p>
          {product.tags.length > 0 ? (
            <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Product tags">
              {product.tags.map((tag) => (
                <li
                  key={tag}
                  className="rounded-full border border-white/15 px-2.5 py-0.5 text-[11px] text-ink-inverse/65"
                >
                  {tag}
                </li>
              ))}
            </ul>
          ) : null}

          <div className="mt-8 flex flex-wrap gap-3">
            <Button
              variant="primary"
              size="lg"
              onClick={() =>
                navigate(
                  `/request-service?service=custom-tailoring&garment=${encodeURIComponent(product.name)}`,
                )
              }
            >
              Request this piece
            </Button>
            <Link
              to="/products"
              viewTransition
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-line px-6 py-3 text-base font-medium text-ink-inverse transition-colors hover:border-gold/50 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
              Back to collection
            </Link>
          </div>
          <p className="mt-5 text-xs leading-relaxed text-ink-inverse/55">
            Workshop code {product.code}. Every piece is cut after a consultation and measured in
            person or through the customer portal.
          </p>
        </div>
      </div>
    </section>
  );
}

export function ProductNotesSection({ product }: { product: PublicProduct }) {
  return (
    <Section tone="light" className="py-16 md:py-24">
      <div className="grid gap-12 md:grid-cols-[1.1fr_0.9fr]">
        <div>
          <SectionIntro
            title={productDetailCopy.detailsTitle}
            description="The silhouette is the starting point. Fabric, finish and fit are decided with you."
          />
          <p className="mt-8 text-base leading-relaxed text-ink/75">
            {product.publicDescription ||
              product.description ||
              'A made-to-order garment from the Kadamba atelier, finished by hand in Kurnool.'}
          </p>
          <p className="mt-4 text-base leading-relaxed text-ink/65">
            Catalogue images show the house silhouette. Your piece is cut to your measurements, so
            the final drape and embroidery placement will be confirmed at the fitting.
          </p>
        </div>

        <div className="border-t border-line pt-6 md:border-l md:border-t-0 md:pl-8 md:pt-0">
          <h2 className="font-heading text-2xl text-ink">{productDetailCopy.processTitle}</h2>
          {product.defaultStages.length > 0 ? (
            <ol className="mt-6 space-y-4">
              {product.defaultStages.map((stage, index) => (
                <li key={`${stage}-${index}`} className="flex gap-4 text-sm text-ink/75">
                  <span className="font-heading text-gold">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="capitalize">{stage.replace(/[-_]/g, ' ')}</span>
                </li>
              ))}
            </ol>
          ) : (
            <ol className="mt-6 space-y-4 text-sm text-ink/75">
              <li>Consultation and fabric selection</li>
              <li>Measurements and pattern cutting</li>
              <li>Stitching, hand finishing, and fitting</li>
            </ol>
          )}
          <p className="mt-6 text-sm leading-relaxed text-ink/60">
            {product.leadTimeNote ||
              (product.leadTimeDays
                ? `Typical lead time is about ${product.leadTimeDays} days from the final fitting.`
                : 'Typical bridal lead time is six to ten weeks. Festive and everyday pieces are confirmed at the consultation.')}
          </p>
          {product.variants.length > 0 ? (
            <div className="mt-6 border-t border-line pt-5">
              <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-ink/60">
                Available variations
              </h3>
              <ul className="mt-3 space-y-2">
                {product.variants.map((variant) => (
                  <li key={variant.id} className="text-sm text-ink/75">
                    <span className="font-medium text-ink">{variant.name}</span>
                    {variant.priceRange ? (
                      <span className="ml-2 text-xs text-gold">{variant.priceRange}</span>
                    ) : null}
                    {variant.description ? (
                      <p className="mt-0.5 text-xs leading-relaxed text-ink/60">
                        {variant.description}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </Section>
  );
}

export function ProductGallerySection({ product }: { product: PublicProduct }) {
  const [active, setActive] = useState<number | null>(null);
  const images = product.gallery.length > 0 ? product.gallery : [];

  if (images.length <= 1) return null;

  const selected = active === null ? null : (images[active] ?? null);

  return (
    <Section tone="light" className="border-t border-line/15 py-16 md:py-20">
      <SectionIntro
        title="The piece in detail"
        description="Photographs from the atelier. Your final embroidery, fabric and finish are confirmed at the consultation."
      />
      <ul className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3">
        {images.map((image, index) => (
          <li key={image.id} className={index === 0 ? 'col-span-2 md:col-span-2' : undefined}>
            <button
              type="button"
              className="group relative block aspect-[4/3] w-full overflow-hidden bg-surface-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
              onClick={() => setActive(index)}
              aria-label={`Open image ${index + 1}: ${image.alt || product.name}`}
            >
              <OptimizedImage
                src={image.url}
                alt={image.alt || `${product.name} detail ${index + 1}`}
                sizes={
                  index === 0 ? '(min-width: 768px) 720px, 100vw' : '(min-width: 768px) 360px, 50vw'
                }
                width={index === 0 ? 1200 : 720}
                height={900}
                className="h-full w-full object-cover transition-transform duration-700 ease-luxury group-hover:scale-105"
              />
            </button>
          </li>
        ))}
      </ul>

      <ImageLightbox
        open={Boolean(selected)}
        onClose={() => setActive(null)}
        title={product.name}
        image={selected?.url ?? ''}
        alt={selected?.alt || product.name}
      />
    </Section>
  );
}

export function ProductFaqSection({ tone = 'light' }: { tone?: 'light' | 'dark' }) {
  return (
    <Section tone={tone} className="py-16 md:py-20">
      <SectionIntro
        tone={tone}
        title="Before you order"
        description="The questions the studio hears most often about made-to-order pieces."
      />
      <div className="mt-8 max-w-3xl divide-y divide-line/15 border-y border-line/15">
        {productFaqs.map((item) => (
          <details key={item.question} className="group py-4">
            <summary className="cursor-pointer list-none pr-8 font-medium text-ink marker:content-none">
              <span className="flex items-center justify-between gap-4">
                {item.question}
                <span aria-hidden className="text-gold transition-transform group-open:rotate-45">
                  +
                </span>
              </span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-ink/70">{item.answer}</p>
          </details>
        ))}
      </div>
    </Section>
  );
}

export function ProductRelatedSection({
  product,
  products,
}: {
  product: PublicProduct;
  products: PublicProduct[];
}) {
  const related = products
    .filter((item) => item.id !== product.id)
    .sort((a, b) => {
      const aSame = a.category?.code === product.category?.code ? 0 : 1;
      const bSame = b.category?.code === product.category?.code ? 0 : 1;
      return aSame - bSame || a.sortOrder - b.sortOrder;
    })
    .slice(0, 3);

  if (related.length === 0) return null;

  return (
    <Section tone="light" className="border-t border-line/15 py-16 md:py-20">
      <SectionIntro title={productDetailCopy.relatedTitle} />
      <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {related.map((item) => (
          <li key={item.id}>
            <Link to={productPath(item)} viewTransition className="group block">
              <div className="relative aspect-[4/5] overflow-hidden bg-surface-sunken">
                <OptimizedImage
                  src={productImage(item)}
                  alt={`${item.name} from Kadamba`}
                  sizes="(min-width: 1024px) 368px, (min-width: 640px) 50vw, 100vw"
                  width={900}
                  height={1125}
                  className="h-full w-full object-cover transition-transform duration-700 ease-luxury group-hover:scale-105"
                />
              </div>
              <h3 className="mt-3 font-heading text-xl text-ink">{item.name}</h3>
              <p className="mt-1 text-xs uppercase tracking-[0.18em] text-ink/55">
                {item.category?.name ?? 'Atelier'}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </Section>
  );
}

export function ProductCtaSection() {
  return (
    <Section tone="dark" className="py-16 md:py-24">
      <div className="flex flex-col gap-6 border border-gold/25 p-8 md:flex-row md:items-end md:justify-between md:p-12">
        <div className="max-w-2xl">
          <p className="text-[0.65rem] uppercase tracking-[0.28em] text-gold">Kadamba atelier</p>
          <h2 className="mt-3 font-heading text-3xl text-ink-inverse md:text-4xl">
            {productDetailCopy.ctaTitle}
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-ink-inverse/70 md:text-base">
            {productDetailCopy.ctaBody}
          </p>
        </div>
        <Link
          to="/request-service"
          viewTransition
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-white/10 bg-[var(--color-primary)] px-6 py-3 text-base font-medium text-[var(--color-primary-text)] transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
        >
          Request a consultation
        </Link>
      </div>
    </Section>
  );
}
