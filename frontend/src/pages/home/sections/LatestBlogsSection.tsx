import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { OptimizedImage } from '@/components/media/OptimizedImage';
import { Button, Section, SectionIntro } from '@/components/ui';
import { ContentEmpty, ContentLoading } from '@/components/feedback/ContentState';
import { usePublicContent } from '@/hooks/usePublicContent';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { fadeUp, staggerChildren } from '@/motion/variants';
import type { BlogPreview } from '../data';

/**
 * Latest blog previews with excerpts.
 */
export function LatestBlogsSection() {
  const navigate = useNavigate();
  const reduced = usePrefersReducedMotion();
  const { blogs, loading } = usePublicContent();

  const latestBlogs = useMemo<BlogPreview[]>(
    () =>
      [...blogs]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 3)
        .map((post) => ({
          id: post.id,
          title: post.title,
          excerpt: post.excerpt,
          date: post.date,
          href: `/blogs/${post.slug}`,
          image: post.coverImage,
        })),
    [blogs],
  );

  return (
    <Section tone="light" className="py-16 md:py-24">
      <SectionIntro
        title="Latest from the journal"
        description="Notes on bridal styling, traditional wear, and custom tailoring from our Kurnool studio."
        actions={
          <Button variant="ghost" onClick={() => navigate('/blogs')}>
            View all posts
          </Button>
        }
      />

      {loading ? (
        <ContentLoading className="mt-10" count={3} label="Loading journal posts" />
      ) : latestBlogs.length === 0 ? (
        <ContentEmpty
          className="mt-10"
          title="No journal posts yet"
          description="Our first stories are on their way. Follow the studio to hear when they land."
        />
      ) : (
      <motion.ul
        className="mt-10 grid gap-8 md:grid-cols-3"
        variants={reduced ? undefined : staggerChildren}
        initial={reduced ? false : 'hidden'}
        whileInView={reduced ? undefined : 'visible'}
        viewport={{ once: true, amount: 0.2 }}
      >
        {latestBlogs.map((post) => (
          <motion.li key={post.id} variants={reduced ? undefined : fadeUp}>
            <article>
              <button
                type="button"
                className="group w-full text-left"
                onClick={() => navigate(post.href)}
              >
                <div className="overflow-hidden">
                  <OptimizedImage
                    sizes="(min-width: 1200px) 368px, (min-width: 768px) 33vw, 100vw"
                    src={post.image}
                    alt={post.title}
                    className="aspect-[16/10] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    width={800}
                    height={500}
                  />
                </div>
                <time
                  dateTime={post.date}
                  className="mt-4 block text-xs uppercase tracking-widest text-ink/70"
                >
                  {new Date(post.date).toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </time>
                <h3 className="mt-2 font-heading text-xl leading-snug group-hover:text-ink/80">
                  {post.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink/65">{post.excerpt}</p>
              </button>
            </article>
          </motion.li>
        ))}
      </motion.ul>
      )}
    </Section>
  );
}
