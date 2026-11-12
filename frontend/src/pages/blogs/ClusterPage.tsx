import { Link, Navigate, useParams } from 'react-router-dom';
import { ContentEmpty, ContentError, ContentLoading } from '@/components/feedback/ContentState';
import { OptimizedImage } from '@/components/media/OptimizedImage';
import { CtaBand, PageHero, Reveal, SectionHead } from '@/components/site';
import { Section } from '@/components/ui';
import { usePublicContent } from '@/hooks/usePublicContent';
import { PageMeta } from '@/seo';
import { formatBlogDate } from './data';
import { getCluster, JOURNAL_CLUSTERS, postsInCluster } from './clusters';

/**
 * The journal, read by cluster.
 *
 * A category answers "what is this about" in the studio's terms. A cluster
 * answers the question the reader typed — a Kurnool summer wedding, a fabric
 * that will not hold a border. Both indexes exist because they are not the same
 * question.
 */
export default function ClusterPage() {
  const { cluster: slug } = useParams<{ cluster: string }>();
  const cluster = getCluster(slug);
  const { blogs, loading, error, refresh } = usePublicContent();

  if (!cluster) return <Navigate to="/blogs" replace />;

  const posts = postsInCluster(cluster, blogs);
  const path = `/blogs/cluster/${cluster.slug}`;
  const cover = posts[0]?.coverImage;

  return (
    <>
      <PageMeta
        title={`${cluster.label} — the journal`}
        description={cluster.description}
        path={path}
        image={cover}
      />

      <PageHero
        variant="mosaic"
        eyebrow={cluster.eyebrow}
        title={cluster.label}
        accent="in the journal."
        description={cluster.description}
        image={cover || '/media/photos/atelier-sewing.jpg'}
        imageAlt={posts[0]?.coverAlt || 'Cloth on the cutting table'}
        trail={[{ label: 'Journal', to: '/blogs' }, { label: cluster.label }]}
        facts={[
          { label: 'Essays', value: String(posts.length).padStart(2, '0') },
          { label: 'Cluster', value: cluster.label },
          { label: 'Written', value: 'In-house' },
          { label: 'Sponsored', value: 'Never' },
        ]}
      />

      <Section className="house-section bg-surface">
        <SectionHead
          eyebrow="Read by subject"
          title="The cluster,"
          accent="in full."
          description={cluster.description}
          actions={
            <span className="text-[0.6rem] uppercase tracking-[0.24em] text-ink/65">
              {String(posts.length).padStart(2, '0')} essays
            </span>
          }
        />

        <nav aria-label="Journal clusters" className="mt-9 border-b border-ink/12 pb-4">
          <ul className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
            <li>
              <Link
                to="/blogs"
                className="text-[0.68rem] uppercase tracking-[0.2em] text-ink/65 transition hover:text-brand-strong"
              >
                All essays
              </Link>
            </li>
            {JOURNAL_CLUSTERS.map((item) => {
              const active = item.slug === cluster.slug;
              return (
                <li key={item.slug}>
                  <Link
                    to={`/blogs/cluster/${item.slug}`}
                    aria-current={active ? 'page' : undefined}
                    className={
                      active
                        ? 'text-[0.68rem] uppercase tracking-[0.2em] text-brand-strong underline decoration-brand/50 underline-offset-[6px]'
                        : 'text-[0.68rem] uppercase tracking-[0.2em] text-ink/65 transition hover:text-brand-strong'
                    }
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {loading ? (
          <ContentLoading className="mt-10" count={6} columns={3} label="Loading journal posts" />
        ) : error ? (
          <ContentError className="mt-10" error={error} onRetry={refresh} />
        ) : posts.length === 0 ? (
          <ContentEmpty
            className="mt-10"
            title="Nothing filed under this cluster yet"
            description="The journal is written as the work raises the question. Try another cluster, or read everything."
            action={
              <Link to="/blogs" className="link-arrow text-brand-strong">
                All essays
              </Link>
            }
          />
        ) : (
          <ul className="mt-12 grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post, index) => (
              <Reveal as="li" key={post.id} delay={(index % 3) * 0.05}>
                <Link to={`/blogs/${post.slug}`} className="group block">
                  <div className="plate plate-frame aspect-[4/5] overflow-hidden">
                    <OptimizedImage
                      src={post.coverImage}
                      alt={post.coverAlt}
                      sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
                      className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="mt-5 flex items-baseline justify-between gap-4 text-[0.58rem] uppercase tracking-[0.2em] text-ink/65">
                    <span>{post.category}</span>
                    <span>{post.readMinutes} min</span>
                  </div>
                  <h3 className="mt-3 font-heading text-2xl leading-tight text-ink transition group-hover:text-brand-strong">
                    {post.title}
                  </h3>
                  <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-ink/60">
                    {post.excerpt}
                  </p>
                  <p className="mt-4 flex items-baseline justify-between gap-4 text-[0.58rem] uppercase tracking-[0.2em] text-ink/65">
                    <span>{formatBlogDate(post.date)}</span>
                    <span className="link-arrow text-brand-strong">Read</span>
                  </p>
                </Link>
              </Reveal>
            ))}
          </ul>
        )}
      </Section>

      <CtaBand
        eyebrow="Before you commission"
        title="Read first."
        accent="Then come in."
        copy="An hour with the journal will make the first appointment shorter: the questions are the ones the studio would have asked you anyway."
        image="/media/photos/fabric-ivory.jpg"
        action={{ label: 'Book a consultation', to: '/request-service' }}
      />
    </>
  );
}
