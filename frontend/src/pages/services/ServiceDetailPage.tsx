import { Navigate, useParams } from 'react-router-dom';
import { Spinner } from '@/components/ui';
import { ContentError } from '@/components/feedback/ContentState';
import { usePublicContent } from '@/hooks/usePublicContent';
import { JsonLd, PageMeta, serviceJsonLd } from '@/seo';
import { getServiceBySlug } from './data';
import {
  ServiceBannerSection,
  ServiceCtaSection,
  ServiceDescriptionSection,
  ServiceFeaturesSection,
  ServiceGallerySection,
  ServicePricingSection,
} from './sections';

/**
 * Phase 5 service detail — info, gallery, features, pricing, consultation CTA.
 */
export default function ServiceDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { services, loading, error, refresh } = usePublicContent();
  const service = slug ? getServiceBySlug(slug, services) : undefined;

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner label="Loading service" />
      </div>
    );
  }

  // A failed request is not a missing service — redirecting here would hide the
  // outage behind a page change.
  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20">
        <ContentError error={error} onRetry={refresh} />
      </div>
    );
  }

  if (!service) {
    return <Navigate to="/services" replace />;
  }

  const path = `/services/${service.slug}`;

  return (
    <>
      <PageMeta
        title={service.metaTitle || service.title}
        titleAbsolute={Boolean(service.metaTitle)}
        description={service.metaDescription || service.summary}
        path={path}
        image={service.ogImage || service.bannerImage || service.cardImage}
      />
      <JsonLd
        data={serviceJsonLd({
          name: service.title,
          description: service.summary,
          path,
          image: service.bannerImage || service.cardImage,
        })}
      />
      <ServiceBannerSection service={service} />
      <ServiceDescriptionSection service={service} />
      <ServicePricingSection service={service} />
      <ServiceGallerySection service={service} />
      <ServiceFeaturesSection service={service} />
      <ServiceCtaSection service={service} />
    </>
  );
}
