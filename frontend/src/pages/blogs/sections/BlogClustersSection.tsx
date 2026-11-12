import { Link } from 'react-router-dom';
import { Reveal, SectionHead } from '@/components/site';
import { Section } from '@/components/ui';
import { usePublicContent } from '@/hooks/usePublicContent';
import { JOURNAL_CLUSTERS, postsInCluster } from '../clusters';

/**
 * The second index.
 *
 * Categories are the studio's four disciplines. Clusters are the questions a
 * reader arrives with, which is why the journal needs both: a bride looking for
 * a Kurnool summer wedding will not think to open "Bridal" and then search.
 */
export function BlogClustersSection() {
  const { blogs } = usePublicContent();

  return (
    <Section id="journal-clusters" className="house-section scroll-mt-24 bg-surface-sunken/40">
      <SectionHead
        eyebrow="Read by cluster"
        title="The journal,"
        accent="by question."
        description="Six subjects, cut across the categories: the place, the cloth, the fit, the wedding calendar."
      />

      <ul className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
        {JOURNAL_CLUSTERS.map((cluster, index) => {
          const count = postsInCluster(cluster, blogs).length;

          return (
            <Reveal as="li" key={cluster.slug} delay={(index % 3) * 0.05}>
              <Link
                to={`/blogs/cluster/${cluster.slug}`}
                className="group flex h-full flex-col border-t border-ink/20 pt-5"
              >
                <div className="flex items-baseline justify-between gap-4">
                  <span className="font-mono text-[0.6rem] tabular-nums tracking-[0.24em] text-brand-strong">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className="text-[0.58rem] uppercase tracking-[0.2em] text-ink/65">
                    {String(count).padStart(2, '0')} essays
                  </span>
                </div>
                <h3 className="mt-4 font-heading text-2xl text-ink transition group-hover:text-brand-strong">
                  {cluster.label}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-ink/60">{cluster.description}</p>
                <span className="link-arrow mt-auto pt-6 text-brand-strong">Open the cluster</span>
              </Link>
            </Reveal>
          );
        })}
      </ul>
    </Section>
  );
}
