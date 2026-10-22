import { OptimizedImage } from '@/components/media/OptimizedImage';
import { Button } from '@/components/ui';
import { useNavigate } from 'react-router-dom';
import { productsHero } from '../data';

/**
 * Catalogue masthead. The image is the collection, the copy is the promise:
 * made to order, fitted in Kurnool.
 */
export function ProductsHeroSection() {
  const navigate = useNavigate();

  return (
    <section className="relative isolate overflow-hidden bg-espresso text-ink-inverse">
      <OptimizedImage
        src={productsHero.image}
        alt={productsHero.alt}
        priority
        sizes="100vw"
        width={2400}
        height={1400}
        className="absolute inset-0 h-full w-full scale-105 object-cover opacity-65"
      />
      <div
        className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-black/25"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/25"
        aria-hidden
      />
      <div className="relative mx-auto max-w-6xl px-4 py-24 sm:px-6 md:py-32 lg:px-8">
        <p className="text-[0.65rem] uppercase tracking-[0.3em] text-gold">
          {productsHero.eyebrow}
        </p>
        <h1 className="mt-4 max-w-3xl font-heading text-4xl leading-tight text-ink-inverse sm:text-5xl md:text-6xl">
          {productsHero.headline}
        </h1>
        <p className="text-lede mt-6 text-ink-inverse/80">{productsHero.copy}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button variant="primary" size="lg" onClick={() => navigate('/request-service')}>
            Start a consultation
          </Button>
          <Button
            variant="secondary"
            size="lg"
            className="text-ink-inverse"
            onClick={() => navigate('/gallery')}
          >
            See the gallery
          </Button>
        </div>
      </div>
    </section>
  );
}
