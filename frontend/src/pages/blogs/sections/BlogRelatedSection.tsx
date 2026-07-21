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
    <Section tone="light" className="border-t border-black/10 py-16 md:py-24">
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
                    src={item.coverImage}
                    alt={item.coverAlt || item.title}
                    className="aspect-[16/10] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    width={800}
                    height={500}
                  />
                </div>
                <time
                  dateTime={item.date}
                  className="mt-4 block text-[0.65rem] uppercase tracking-[0.22em] text-black/45"
                >
                  {formatBlogDate(item.date)}
                </time>
                <h3 className="mt-2 font-heading text-xl leading-snug group-hover:text-black/75">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-black/65">{item.excerpt}</p>
              </button>
            </article>
          </motion.li>
        ))}
      </motion.ul>
    </Section>
  );
}
