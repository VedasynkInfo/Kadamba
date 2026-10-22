import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { OptimizedImage } from '@/components/media/OptimizedImage';
import { Button, Input, Section } from '@/components/ui';
import { FilterRow, SectionHead } from '@/components/site';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { usePublicContent } from '@/hooks/usePublicContent';
import { ContentEmpty, ContentError, ContentLoading } from '@/components/feedback/ContentState';
import { fadeUp, staggerChildren } from '@/motion/variants';
import {
  blogCategories,
  blogsCatalogIntro,
  filterBlogs,
  formatBlogDate,
  type BlogCategoryFilter,
  type BlogPost,
} from '../data';

/**
 * Blog catalog — category filters, search, and image-led post grid.
 */
export function BlogsCatalogSection() {
  const navigate = useNavigate();
  const reduced = usePrefersReducedMotion();
  const { blogs, loading, error, refresh } = usePublicContent();
  const [category, setCategory] = useState<BlogCategoryFilter>('All');
  const [query, setQuery] = useState('');

  const filtered = useMemo(
    () => filterBlogs(query, category, blogs),
    [query, category, blogs],
  );

  return (
    <Section id="blogs-catalog" className="house-section scroll-mt-24 bg-surface">
      <SectionHead
        eyebrow="The journal"
        title="Essays from"
        accent="the workroom."
        description={blogsCatalogIntro.description}
        actions={
          <span className="text-[0.6rem] uppercase tracking-[0.24em] text-ink/40">
            {String(filtered.length).padStart(2, '0')} essays
          </span>
        }
      />

      <div className="mt-12 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <FilterRow
          className="min-w-0 flex-1"
          options={blogCategories.map((item) => ({ id: item, label: item }))}
          value={category}
          onChange={(id) => setCategory(id as BlogCategoryFilter)}
          label="Journal categories"
        />
        <div className="w-full shrink-0 lg:w-64">
          <Input
            id="blogs-search"
            type="search"
            label="Search posts"
            placeholder="Search bridal, fabric, fittings…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <ContentLoading className="mt-10" count={6} columns={3} label="Loading journal posts" />
      ) : error ? (
        <ContentError className="mt-10" error={error} onRetry={refresh} />
      ) : blogs.length === 0 ? (
        <ContentEmpty
          className="mt-10"
          title="No journal posts yet"
          description="Our first stories are on their way. Follow the studio to hear when they land."
        />
      ) : filtered.length === 0 ? (
        <ContentEmpty
          className="mt-10"
          title="No posts match your search"
          description="Try another category, or clear the search to see everything in the journal."
          action={
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setCategory('All');
                setQuery('');
              }}
            >
              Clear filters
            </Button>
          }
        />
      ) : (
        <AnimatePresence mode="wait">
          <motion.ul
            key={`${category}-${query}`}
            className="mt-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-3"
            variants={reduced ? undefined : staggerChildren}
            initial={reduced ? false : 'hidden'}
            animate={reduced ? undefined : 'visible'}
          >
            {filtered.map((post) => (
              <motion.li key={post.id} variants={reduced ? undefined : fadeUp}>
                <BlogPostPreview post={post} onOpen={() => navigate(`/blogs/${post.slug}`)} />
              </motion.li>
            ))}
          </motion.ul>
        </AnimatePresence>
      )}
    </Section>
  );
}

function BlogPostPreview({ post, onOpen }: { post: BlogPost; onOpen: () => void }) {
  return (
    <article>
      <button type="button" className="group w-full text-left" onClick={onOpen}>
        <div className="overflow-hidden">
          <OptimizedImage
            sizes="(min-width: 1200px) 368px, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
            src={post.coverImage}
            alt={post.coverAlt || post.title}
            className="aspect-[16/10] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            width={800}
            height={500}
          />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.65rem] uppercase tracking-[0.22em] text-ink/70">
          <span className="text-ink/60">{post.category}</span>
          <span aria-hidden>·</span>
          <time dateTime={post.date}>{formatBlogDate(post.date)}</time>
          <span aria-hidden>·</span>
          <span>{post.readMinutes} min</span>
        </div>
        <h3 className="mt-2 font-heading text-xl leading-snug text-ink group-hover:text-ink/75">
          {post.title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-ink/65">{post.excerpt}</p>
      </button>
    </article>
  );
}
