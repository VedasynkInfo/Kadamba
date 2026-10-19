import { Navigate, useParams } from 'react-router-dom';
import { Spinner } from '@/components/ui';
import { ContentError } from '@/components/feedback/ContentState';
import { usePublicContent } from '@/hooks/usePublicContent';
import { creativeWorkJsonLd, JsonLd, PageMeta } from '@/seo';
import { getProjectBySlug } from './data';
import {
  PortfolioBannerSection,
  PortfolioBeforeAfterSection,
  PortfolioClientStorySection,
  PortfolioGallerySection,
  PortfolioProjectCtaSection,
  PortfolioStorySection,
} from './sections';

/**
 * Phase 7 portfolio detail — banner, story, gallery, before/after, client voice, CTA.
 */
export default function PortfolioDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { portfolio, loading, error, refresh } = usePublicContent();
  const project = slug ? getProjectBySlug(slug, portfolio) : undefined;

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner label="Loading project" />
      </div>
    );
  }

  // A failed request is not a missing project — redirecting here would hide the
  // outage behind a page change.
  if (error) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20">
        <ContentError error={error} onRetry={refresh} />
      </div>
    );
  }

  if (!project) {
    return <Navigate to="/portfolio" replace />;
  }

  const path = `/portfolio/${project.slug}`;

  return (
    <>
      <PageMeta
        title={project.metaTitle || project.title}
        titleAbsolute={Boolean(project.metaTitle)}
        description={project.metaDescription || project.summary}
        path={path}
        image={project.ogImage || project.coverImage || project.bannerImage}
      />
      <JsonLd
        data={creativeWorkJsonLd({
          name: project.title,
          description: project.summary,
          path,
          image: project.coverImage || project.bannerImage,
        })}
      />
      <PortfolioBannerSection project={project} />
      <PortfolioStorySection project={project} />
      <PortfolioBeforeAfterSection project={project} />
      <PortfolioGallerySection project={project} />
      <PortfolioClientStorySection project={project} />
      <PortfolioProjectCtaSection project={project} />
    </>
  );
}
