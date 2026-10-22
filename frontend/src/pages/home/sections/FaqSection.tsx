import { JsonLd } from '@/seo';
import { faqJsonLd } from '@/seo/JsonLd';
import { Accordion, Reveal } from '@/components/site';
import { usePublicContent } from '@/hooks/usePublicContent';
import { homeFaqs } from '../content';

/**
 * The questions people actually ask before they call.
 *
 * The same list feeds the visible accordion and the `FAQPage` structured data,
 * so the answers that help a visitor are also the answers a search result can
 * show. One source, two audiences.
 */
export function FaqSection() {
  const { settings } = usePublicContent();

  return (
    <section className="house-section bg-surface">
      <JsonLd
        data={faqJsonLd(
          homeFaqs.map((item) => ({
            question: item.question,
            answer: typeof item.answer === 'string' ? item.answer : '',
          })),
        )}
      />
      <div className="house-container grid gap-12 lg:grid-cols-[0.78fr_1.22fr] lg:gap-20">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <Reveal>
            <p className="eyebrow">Before you call</p>
            <h2 className="display-lg mt-6 text-ink">
              The honest <span className="display-accent">answers.</span>
            </h2>
            <p className="mt-6 max-w-sm text-[0.96rem] leading-relaxed text-ink/60">
              If your question is not here, the studio would rather answer it on the phone than have
              you guess.
            </p>
            <a href={`tel:${settings.phoneTel}`} className="link-arrow mt-8 inline-flex text-brand-strong">
              {settings.phoneDisplay || 'Call the studio'}
            </a>
          </Reveal>
        </div>

        <Reveal delay={0.08}>
          <Accordion items={homeFaqs} defaultOpen={0} />
        </Reveal>
      </div>
    </section>
  );
}
