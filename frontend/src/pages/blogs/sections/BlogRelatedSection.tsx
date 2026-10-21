import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { OptimizedImage } from '@/components/media/OptimizedImage';
import { Section, SectionIntro } from '@/components/ui';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { usePublicContent } from '@/hooks/usePublicContent';
import { fadeUp, staggerChildren } from '@/motion/variants';
import { formatBlogDate, getRelatedBlogs, type BlogPost } from '../data';

interface BlogRelatedSectionProps {
  post: BlogPost;
}

/**
 * Related posts by category (with fallbacks).
 */
export function BlogRelatedSection({ post }: BlogRelatedSectionProps) {
  const navigate = useNavigate();
  const reduced = usePrefersReducedMotion();
  const { blogs } = usePublicContent();
  const related = getRelatedBlogs(post, 3, blogs);

  if (related.length === 0) return null;

  return (
    <Section tone="light" className="border-t border-line py-16 md:py-24">
      <SectionIntro
        title="Continue reading"
        description="More notes from the same corner of the studio journal."
      />

      <motion.ul
        className="mt-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-3"
        variants={reduced ? undefined : staggerChildren}
        initial={reduced ? false : 'hidden'}
        whileInView={reduced ? undefined : 'visible'}
        viewport={{ once: true, amount: 0.2 }}
      >
        {related.map((item) => (
          <motion.li key={item.id} variants={reduced ? undefined : fadeUp}>
            <article>
              <button
                type="button"
                className="group w-full text-left"
                onClick={() => navigate(`/blogs/${item.slug}`)}
              >
                <div className="overflow-hidden">
                  <OptimizedImage
                    sizes="(min-width: 1200px) 368px, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                    src={item.coverImage}
                    alt={item.coverAlt || item.title}
                    className="aspect-[16/10] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    width={800}
                    height={500}
                  />
                </div>
                <time
                  dateTime={item.date}
                  className="mt-4 block text-[0.65rem] uppercase tracking-[0.22em] text-ink/70"
                >
                  {formatBlogDate(item.date)}
                </time>
                <h3 className="mt-2 font-heading text-xl leading-snug group-hover:text-ink/75">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink/65">{item.excerpt}</p>
              </button>
            </article>
          </motion.li>
        ))}
      </motion.ul>
    </Section>
  );
}
