import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { OptimizedImage } from '@/components/media/OptimizedImage';
import { Button, Input, Section, SectionIntro } from '@/components/ui';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { usePublicContent } from '@/hooks/usePublicContent';
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
  const { blogs } = usePublicContent();
  const [category, setCategory] = useState<BlogCategoryFilter>('All');
  const [query, setQuery] = useState('');

  const filtered = useMemo(
    () => filterBlogs(query, category, blogs),
    [query, category, blogs],
  );

  return (
    <Section id="blogs-catalog" tone="light" className="scroll-mt-24 py-16 md:py-24">
      <SectionIntro
        title={blogsCatalogIntro.title}
        description={blogsCatalogIntro.description}
        actions={
          <div className="flex flex-wrap gap-2" role="group" aria-label="Blog categories">
            {blogCategories.map((item) => (
              <Button
                key={item}
                size="sm"
                variant={category === item ? 'primary' : 'secondary'}
                className="min-h-10"
                onClick={() => setCategory(item)}
                aria-pressed={category === item}
              >
                {item}
              </Button>
            ))}
          </div>
        }
      />

      <div className="mt-8 max-w-md">
        <Input
          id="blogs-search"
          type="search"
          label="Search posts"
          placeholder="Search bridal, fabric, fittings…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

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

      {filtered.length === 0 && (
        <p className="mt-12 text-center text-black/55">
          No posts match your search. Try another category or keyword.
        </p>
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
            src={post.coverImage}
            alt={post.coverAlt || post.title}
            className="aspect-[16/10] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            width={800}
            height={500}
          />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.65rem] uppercase tracking-[0.22em] text-black/45">
          <span className="text-black/60">{post.category}</span>
          <span aria-hidden>·</span>
          <time dateTime={post.date}>{formatBlogDate(post.date)}</time>
          <span aria-hidden>·</span>
          <span>{post.readMinutes} min</span>
        </div>
        <h3 className="mt-2 font-heading text-xl leading-snug text-black group-hover:text-black/75">
          {post.title}
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-black/65">{post.excerpt}</p>
      </button>
    </article>
  );
}
