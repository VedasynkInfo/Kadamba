import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { usePublicContent } from '@/hooks/usePublicContent';
import { blogsHero, formatBlogDate, getFeaturedBlog } from '../data';

/**
 * Editorial journal banner — asymmetric split (type + featured image).
 * Deliberately not the About/Services full-bleed left-stack hero.
 */
export function BlogsHeroBanner() {
  const navigate = useNavigate();
  const reduced = usePrefersReducedMotion();
  const { blogs } = usePublicContent();
  const featured = getFeaturedBlog(blogs);

  if (!featured) return null;

  return (
    <section
      className="relative isolate w-full overflow-hidden bg-black text-cream"
      aria-label="Kadamba Journal"
    >
      <div className="grid min-h-[min(78svh,820px)] w-full lg:min-h-[min(80svh,860px)] lg:grid-cols-12">
        {/* Type column */}
        <motion.div
          className="relative z-10 flex flex-col justify-end bg-[#0a0a0a] px-6 pb-14 pt-28 sm:px-8 md:pb-16 lg:col-span-5 lg:px-10 lg:pb-20 xl:px-14"
          initial={reduced ? false : { opacity: 0, x: -28 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 20h40M20 0v40' stroke='%23FFD700' stroke-width='0.5'/%3E%3C/svg%3E")`,
            }}
            aria-hidden
          />
          <div className="relative max-w-md">
            <p className="text-[0.65rem] uppercase tracking-[0.32em] text-gold/90">
              {blogsHero.locationLine}
            </p>
            <p className="mt-5 font-heading text-5xl leading-none tracking-wide text-gold sm:text-6xl md:text-7xl">
              {blogsHero.brandName}
            </p>
            <h1 className="mt-2 font-heading text-3xl font-medium text-cream sm:text-4xl md:text-5xl">
              {blogsHero.journalLabel}
            </h1>
            <p className="mt-6 max-w-sm text-base leading-relaxed text-cream/80">{blogsHero.lede}</p>
            <div className="mt-9">
              <Button
                variant="primary"
                size="lg"
                onClick={() => {
                  document.getElementById('blogs-catalog')?.scrollIntoView({
                    behavior: reduced ? 'auto' : 'smooth',
                  });
                }}
              >
                {blogsHero.browseLabel}
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Featured visual plane */}
        <motion.div
          className="relative min-h-[42svh] lg:col-span-7 lg:min-h-full"
          initial={reduced ? false : { opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: reduced ? 0 : 0.12 }}
        >
          <motion.img
            src={featured.coverImage}
            alt={featured.coverAlt}
            className="absolute inset-0 h-full w-full object-cover"
            width={1600}
            height={1200}
            fetchPriority="high"
            animate={
              reduced
                ? undefined
                : {
                    scale: [1, 1.06, 1],
                  }
            }
            transition={
              reduced
                ? undefined
                : { duration: 18, repeat: Infinity, ease: 'linear' }
            }
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent lg:bg-gradient-to-l lg:from-transparent lg:via-black/10 lg:to-black/40"
            aria-hidden
          />

          <button
            type="button"
            className="absolute inset-x-0 bottom-0 z-10 w-full p-6 text-left sm:p-8 lg:p-10"
            onClick={() => navigate(`/blogs/${featured.slug}`)}
          >
            <span className="text-[0.65rem] uppercase tracking-[0.28em] text-gold">
              Featured · {featured.category}
            </span>
            <span className="mt-3 block font-heading text-2xl leading-snug text-cream transition-colors group-hover:text-gold sm:text-3xl md:text-[2rem]">
              {featured.title}
            </span>
            <span className="mt-2 block text-sm text-cream/70">
              {formatBlogDate(featured.date)} · {featured.readMinutes} min read
            </span>
          </button>
        </motion.div>
      </div>
    </section>
  );
}
