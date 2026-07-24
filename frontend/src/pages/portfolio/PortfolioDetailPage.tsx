import { Navigate, useParams } from 'react-router-dom';
import { Spinner } from '@/components/ui';
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
  const { portfolio, loading } = usePublicContent();
  const project = slug ? getProjectBySlug(slug, portfolio) : undefined;

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner label="Loading project" />
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
