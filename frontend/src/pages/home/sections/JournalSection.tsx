import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { OptimizedImage } from '@/components/media/OptimizedImage';
import { ContentEmpty, ContentLoading } from '@/components/feedback/ContentState';
import { Reveal, SectionHead } from '@/components/site';
import { usePublicContent } from '@/hooks/usePublicContent';

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * The journal.
 *
 * One lead story with room around it, two beneath it as a reading list. The
 * writing is the studio's long-form voice — practical, unhurried, and the best
 * evidence that the people behind the garments know what they are doing.
 */
export function JournalSection() {
  const { blogs, loading } = usePublicContent();

  const latest = useMemo(
    () =>
      [...blogs]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 3),
    [blogs],
  );

  const [lead, ...rest] = latest;

  return (
    <section className="house-section bg-surface">
      <div className="house-container">
        <SectionHead
          eyebrow="The journal"
          index="06"
          title="Notes from"
          accent="the fitting room."
          description="What to ask before a bridal commission, how to read a fabric, why a blouse pulls at the armhole. Written by the people who do the work."
          actions={
            <Link to="/blogs" className="link-arrow text-brand-strong">
              All writing
            </Link>
          }
        />

        {loading ? (
          <ContentLoading className="mt-14" count={3} label="Loading journal posts" />
        ) : latest.length === 0 ? (
          <ContentEmpty
            className="mt-14"
            title="The journal is being written"
            description="The studio's notes on bridal, fabric and fit will appear here. In the meantime, the portfolio shows the work."
          />
        ) : (
          <div className="mt-14 grid gap-10 lg:grid-cols-[1.18fr_0.82fr] lg:gap-14">
            <Reveal>
              <Link to={`/blogs/${lead.slug}`} className="group block">
                <div className="plate plate-frame plate-frame-dark plate-hover aspect-[16/10] w-full">
                  <OptimizedImage
                    src={lead.coverImage}
                    alt={lead.coverAlt || lead.title}
                    sizes="(min-width: 1024px) 58vw, 100vw"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="mt-6 flex items-center gap-3 text-[0.58rem] font-semibold uppercase tracking-[0.24em] text-ink/40">
                  <span className="text-brand-strong">{lead.category}</span>
                  <span className="h-px w-5 bg-ink/20" aria-hidden />
                  <time dateTime={lead.date}>{formatDate(lead.date)}</time>
                  <span aria-hidden>&middot;</span>
                  <span>{lead.readMinutes} min read</span>
                </div>
                <h3 className="mt-4 max-w-2xl font-heading text-[clamp(1.6rem,2.6vw,2.35rem)] leading-[1.15] text-ink transition-colors group-hover:text-brand-strong">
                  {lead.title}
                </h3>
                <p className="mt-3 max-w-xl text-[0.94rem] leading-relaxed text-ink/60">
                  {lead.excerpt}
                </p>
              </Link>
            </Reveal>

            <div className="flex flex-col gap-8 lg:border-l lg:border-ink/12 lg:pl-12">
              {rest.map((post, index) => (
                <Reveal key={post.id} delay={0.08 + index * 0.06}>
                  <Link to={`/blogs/${post.slug}`} className="group grid grid-cols-[5.5rem_1fr] gap-5">
                    <div className="plate aspect-[4/5] w-full">
                      <OptimizedImage
                        src={post.coverImage}
                        alt={post.coverAlt || post.title}
                        sizes="120px"
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[0.55rem] font-semibold uppercase tracking-[0.24em] text-brand-strong">
                        {post.category}
                      </p>
                      <h3 className="mt-2 font-heading text-lg leading-snug text-ink transition-colors group-hover:text-brand-strong">
                        {post.title}
                      </h3>
                      <p className="mt-2 flex items-center gap-2 text-[0.6rem] uppercase tracking-[0.2em] text-ink/40">
                        <time dateTime={post.date}>{formatDate(post.date)}</time>
                        <span aria-hidden>&middot;</span>
                        <span>{post.readMinutes} min</span>
                      </p>
                    </div>
                  </Link>
                </Reveal>
              ))}

              <Reveal delay={0.2} className="mt-auto border-t border-ink/12 pt-6">
                <p className="font-heading text-lg italic leading-snug text-ink/70">
                  &ldquo;Read before you commission. It will make the first appointment
                  shorter.&rdquo;
                </p>
                <Link to="/blogs" className="link-arrow mt-4 inline-flex text-brand-strong">
                  Browse the journal
                </Link>
              </Reveal>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
