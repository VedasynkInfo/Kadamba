import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { OptimizedImage } from '@/components/media/OptimizedImage';
import { Button, Section, SectionIntro } from '@/components/ui';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { fadeUp, staggerChildren } from '@/motion/variants';
import { latestBlogs } from '../data';

/**
 * Latest blog previews with excerpts.
 */
export function LatestBlogsSection() {
  const navigate = useNavigate();
  const reduced = usePrefersReducedMotion();

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
                    src={post.image}
                    alt={post.title}
                    className="aspect-[16/10] w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    width={800}
                    height={500}
                  />
                </div>
                <time
                  dateTime={post.date}
                  className="mt-4 block text-xs uppercase tracking-widest text-black/45"
                >
                  {new Date(post.date).toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </time>
                <h3 className="mt-2 font-heading text-xl leading-snug group-hover:text-black/80">
                  {post.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-black/65">{post.excerpt}</p>
              </button>
            </article>
          </motion.li>
        ))}
      </motion.ul>
    </Section>
  );
}
