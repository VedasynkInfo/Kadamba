import { useNavigate } from 'react-router-dom';
import { Button, Section } from '@/components/ui';
import { productsCta } from '../data';

/** The one next step after browsing a made-to-order catalogue. */
export function ProductsCtaSection() {
  const navigate = useNavigate();

  return (
    <Section tone="dark" className="py-16 md:py-24">
      <div className="flex flex-col gap-6 border border-gold/25 p-8 md:flex-row md:items-end md:justify-between md:p-12">
        <div className="max-w-2xl">
          <p className="text-[0.65rem] uppercase tracking-[0.28em] text-gold">
            {productsCta.eyebrow}
          </p>
          <h2 className="mt-3 font-heading text-3xl text-ink-inverse md:text-4xl">
            {productsCta.title}
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-ink-inverse/70 md:text-base">
            {productsCta.description}
          </p>
        </div>
        <Button variant="primary" size="lg" onClick={() => navigate(productsCta.primaryHref)}>
          {productsCta.primaryLabel}
        </Button>
      </div>
    </Section>
  );
}
