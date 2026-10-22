import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { OptimizedImage } from '@/components/media/OptimizedImage';
import { Icon } from '@/components/icons';
import { Button, Input, Section } from '@/components/ui';
import { FilterRow, SectionHead } from '@/components/site';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { usePublicContent } from '@/hooks/usePublicContent';
import { ContentEmpty, ContentError, ContentLoading } from '@/components/feedback/ContentState';
import { fadeUp, staggerChildren } from '@/motion/variants';
import { cn } from '@/utils/cn';
import {
  filterServices,
  serviceCategories,
  servicesCatalogIntro,
  type ServiceCategoryFilter,
  type ServiceDetail,
  type ServiceIcon,
} from '../data';

function ServiceIconMark({ name }: { name: ServiceIcon }) {
  const common = 'size-6 stroke-current';
  switch (name) {
    case 'bridal':
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M12 3c2.5 3 4 5.5 4 8a4 4 0 1 1-8 0c0-2.5 1.5-5 4-8Z"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path d="M8 21h8M12 15v6" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case 'traditional':
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M6 4h12v4H6V4Z" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M8 8v13M16 8v13M8 14h8" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case 'tailoring':
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M4 20 12 4l8 16" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M8 14h8" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    default:
      return (
        <svg className={common} viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M4 7h16M4 12h10M4 17h14" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
  }
}

/**
 * The service catalogue.
 *
 * Four disciplines, each with a plate, an honest lead time and the price it
 * starts from. Filters are lines of type rather than pills, and the search is a
 * ruled field: the page should read like a printed programme, not a dashboard
 * with pictures.
 */
export function ServicesCatalogSection() {
  const navigate = useNavigate();
  const reduced = usePrefersReducedMotion();
  const { services, loading, error, refresh } = usePublicContent();
  const [category, setCategory] = useState<ServiceCategoryFilter>('All');
  const [query, setQuery] = useState('');

  const filtered = useMemo(
    () => filterServices(query, category, services),
    [query, category, services],
  );

  return (
    <Section id="services-catalog" className="house-section scroll-mt-24 bg-surface">
      <SectionHead
        eyebrow="The four disciplines"
        title="What the house"
        accent="can make."
        description={servicesCatalogIntro.description}
        actions={
          <span className="text-[0.6rem] uppercase tracking-[0.24em] text-ink/40">
            {String(filtered.length).padStart(2, '0')} services
          </span>
        }
      />

      <div className="mt-12 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <FilterRow
          className="min-w-0 flex-1"
          options={serviceCategories.map((item) => ({ id: item, label: item }))}
          value={category}
          onChange={(id) => setCategory(id as ServiceCategoryFilter)}
          label="Service categories"
        />
        <div className="w-full shrink-0 lg:w-64">
          <Input
            id="services-search"
            type="search"
            label="Search services"
            placeholder="Search bridal, tailoring…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <ContentLoading className="mt-10" count={4} columns={2} label="Loading services" />
      ) : error ? (
        <ContentError className="mt-10" error={error} onRetry={refresh} />
      ) : services.length === 0 ? (
        <ContentEmpty
          className="mt-10"
          title="Our service list is being updated"
          description="Please check back shortly, or contact the studio and we will guide you personally."
        />
      ) : (
        <>
          <AnimatePresence mode="wait">
            {filtered.length === 0 ? (
              <motion.div
                key="empty"
                initial={reduced ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={reduced ? undefined : { opacity: 0 }}
              >
                <ContentEmpty
                  className="mt-10"
                  title="No services match your search"
                  description="Try another category, or clear the search to see everything we offer."
                  action={
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => {
                        setCategory('All');
                        setQuery('');
                      }}
                    >
                      Clear filters
                    </Button>
                  }
                />
              </motion.div>
            ) : (
              <motion.ul
                key={`${category}-${query}`}
                className="mt-12 grid gap-x-6 gap-y-14 sm:grid-cols-2"
                variants={reduced ? undefined : staggerChildren}
                initial={reduced ? false : 'hidden'}
                animate={reduced ? undefined : 'visible'}
              >
                {filtered.map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    reduced={reduced}
                    onOpen={() => navigate(`/services/${service.slug}`)}
                  />
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </>
      )}
    </Section>
  );
}

function ServiceCard({
  service,
  reduced,
  onOpen,
}: {
  service: ServiceDetail;
  reduced: boolean;
  onOpen: () => void;
}) {
  return (
    <motion.li variants={reduced ? undefined : fadeUp}>
      <button
        type="button"
        onClick={onOpen}
        className={cn(
          'group flex w-full flex-col text-left focus-visible:outline-none',
          'focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-surface',
        )}
      >
        <div className="plate plate-frame plate-hover relative aspect-[16/11] w-full">
          <OptimizedImage
            sizes="(min-width: 1200px) 620px, 50vw"
            src={service.cardImage}
            alt={service.bannerAlt}
            className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
            width={1600}
            height={1100}
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent"
            aria-hidden
          />
          <span className="absolute bottom-5 left-5 z-[3] inline-flex items-center gap-2 text-gold">
            <ServiceIconMark name={service.icon} />
            <span className="text-[0.58rem] font-semibold uppercase tracking-[0.24em]">
              {service.category}
            </span>
          </span>
        </div>

        <h3 className="mt-5 font-heading text-3xl leading-tight text-ink">{service.title}</h3>
        <p className="mt-2 max-w-xl text-base leading-relaxed text-ink/65">{service.summary}</p>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-ink/12 pt-4">
          <p className="font-heading text-lg text-ink">
            From <span className="text-brand-strong">{service.pricing.startingFrom}</span>
          </p>
          <span className="link-arrow text-[0.6rem] text-ink/55 transition-colors group-hover:text-brand-strong">
            View details &amp; pricing
            <Icon name="arrowRight" size={14} />
          </span>
        </div>
      </button>
    </motion.li>
  );
}
