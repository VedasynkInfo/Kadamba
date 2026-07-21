import { Navigate, useParams } from 'react-router-dom';
import { Spinner } from '@/components/ui';
import { usePublicContent } from '@/hooks/usePublicContent';
import { articleJsonLd, JsonLd, PageMeta } from '@/seo';
import { getBlogBySlug } from './data';
import {
  BlogArticleSection,
  BlogCtaSection,
  BlogMastheadBanner,
  BlogRelatedSection,
} from './sections';

/**
 * Phase 8 blog detail — masthead, article, related posts, CTA.
 */
export default function BlogDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { blogs, loading } = usePublicContent();
  const post = slug ? getBlogBySlug(slug, blogs) : undefined;

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner label="Loading post" />
      </div>
    );
  }

  if (!post) {
    return <Navigate to="/blogs" replace />;
  }

  const path = `/blogs/${post.slug}`;

  return (
    <>
      <PageMeta
        title={post.title}
        description={post.excerpt}
        path={path}
        image={post.coverImage}
        type="article"
        publishedTime={post.date}
      />
      <JsonLd
        data={articleJsonLd({
          title: post.title,
          description: post.excerpt,
          path,
          image: post.coverImage,
          datePublished: post.date,
        })}
      />
      <BlogMastheadBanner post={post} />
      <BlogArticleSection post={post} />
      <BlogRelatedSection post={post} />
      <BlogCtaSection post={post} />
    </>
  );
}
