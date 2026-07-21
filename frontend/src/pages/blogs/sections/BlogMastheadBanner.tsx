import { OptimizedImage } from '@/components/media/OptimizedImage';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { formatBlogDate, type BlogPost } from '../data';

interface BlogMastheadBannerProps {
  post: BlogPost;
}

/**
 * Editorial masthead — shorter cover + bottom meta band.
 * No conversion CTAs here (those live in the article footer).
 */
export function BlogMastheadBanner({ post }: BlogMastheadBannerProps) {
  const reduced = usePrefersReducedMotion();

  return (
    <section
      className="relative isolate w-full overflow-hidden bg-black text-cream"
      aria-label={post.title}
    >
      <div className="relative min-h-[min(58svh,620px)] w-full md:min-h-[min(64svh,700px)]">
        <motion.div
          className="absolute inset-0"
          initial={reduced ? false : { opacity: 0, scale: 1.06 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: reduced ? 0 : 1.15, ease: [0.22, 1, 0.36, 1] }}
        >
          <OptimizedImage
            src={post.coverImage}
            alt={post.coverAlt}
            className="h-full w-full object-cover"
            width={2400}
            height={1400}
            priority
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-black/25"
            aria-hidden
          />
        </motion.div>

        <div className="relative z-10 mx-auto flex min-h-[min(58svh,620px)] w-full max-w-4xl flex-col justify-end px-6 pb-10 pt-28 sm:px-8 md:min-h-[min(64svh,700px)] md:pb-14 lg:px-10">
          <motion.div
            className="w-full border-t border-gold/30 pt-7 md:pt-9"
            initial={reduced ? false : { opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.7,
              ease: [0.22, 1, 0.36, 1],
              delay: reduced ? 0 : 0.2,
            }}
          >
            <nav aria-label="Breadcrumb" className="mb-5">
              <ol className="flex flex-wrap items-center gap-2 text-[0.65rem] uppercase tracking-[0.22em] text-cream/55">
                <li>
                  <Link to="/blogs" className="transition-colors hover:text-gold">
                    Journal
                  </Link>
                </li>
                <li aria-hidden>/</li>
                <li className="text-gold/90">{post.category}</li>
              </ol>
            </nav>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.65rem] uppercase tracking-[0.24em] text-cream/70">
              <time dateTime={post.date}>{formatBlogDate(post.date)}</time>
              <span aria-hidden>·</span>
              <span>{post.readMinutes} min read</span>
              <span aria-hidden>·</span>
              <span>{post.author}</span>
            </div>

            <h1 className="mt-4 font-heading text-3xl font-medium leading-tight text-cream sm:text-4xl md:text-[2.75rem]">
              {post.title}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-cream/80 md:text-lg">
              {post.excerpt}
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
