import { Link } from 'react-router-dom';
import { EditorialIndex, Reveal, SectionHead } from '@/components/site';
import { signatureEntries } from '../content';

/**
 * What the house makes.
 *
 * Set as an index rather than a card grid: four numbered rows, one plate that
 * changes beside them. It is the section that answers "what can I actually
 * commission here?", so it comes before the collections — the work is what the
 * studio does, the collections are what it has made.
 */
export function SignatureSection() {
  return (
    <section className="house-section relative overflow-hidden bg-surface-sunken">
      <div className="house-container">
        <SectionHead
          eyebrow="What we make"
          index="01"
          title="Four disciplines,"
          accent="one house."
          description="Bridal, traditional, tailoring and styling are not departments here. The same people who choose the cloth cut the pattern and sit with you at the final fitting."
          actions={
            <Link to="/services" className="link-arrow text-brand-strong">
              All services
            </Link>
          }
        />

        <Reveal className="mt-16">
          <EditorialIndex entries={signatureEntries} />
        </Reveal>
      </div>
    </section>
  );
}
