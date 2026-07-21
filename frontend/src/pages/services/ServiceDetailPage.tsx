import { Navigate, useParams } from 'react-router-dom';
import { Spinner } from '@/components/ui';
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
  const { services, loading } = usePublicContent();
  const service = slug ? getServiceBySlug(slug, services) : undefined;

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner label="Loading service" />
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
        title={service.title}
        description={service.summary}
        path={path}
        image={service.bannerImage || service.cardImage}
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
