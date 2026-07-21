import { motion } from 'framer-motion';
import { Section } from '@/components/ui';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { fadeUp } from '@/motion/variants';
import type { BlogPost } from '../data';

interface BlogArticleSectionProps {
  post: BlogPost;
}

/**
 * Readable article body — classic measure, semantic paragraphs.
 */
export function BlogArticleSection({ post }: BlogArticleSectionProps) {
  const reduced = usePrefersReducedMotion();

  return (
    <Section tone="light" className="py-14 md:py-20">
      <motion.article
        className="mx-auto max-w-[var(--measure-wide)]"
        initial={reduced ? false : 'hidden'}
        whileInView={reduced ? undefined : 'visible'}
        viewport={{ once: true, amount: 0.15 }}
        variants={reduced ? undefined : fadeUp}
      >
        <div className="space-y-6 text-[1.0625rem] leading-[1.8] text-black/80">
          {post.content.map((paragraph, index) => (
            <p key={`${post.id}-p-${index}`}>{paragraph}</p>
          ))}
        </div>

        {post.tags.length > 0 && (
          <ul className="mt-12 flex flex-wrap gap-2" aria-label="Tags">
            {post.tags.map((tag) => (
              <li
                key={tag}
                className="border border-black/15 px-3 py-1 text-[0.65rem] uppercase tracking-[0.18em] text-black/55"
              >
                {tag}
              </li>
            ))}
          </ul>
        )}
      </motion.article>
    </Section>
  );
}
