import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { OptimizedImage } from '@/components/media/OptimizedImage';
import { Button, Input, Section, SectionIntro } from '@/components/ui';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { usePublicContent } from '@/hooks/usePublicContent';
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
 * Service catalog — category filters, search, and image-led cards.
 */
export function ServicesCatalogSection() {
  const navigate = useNavigate();
  const reduced = usePrefersReducedMotion();
  const { services } = usePublicContent();
  const [category, setCategory] = useState<ServiceCategoryFilter>('All');
  const [query, setQuery] = useState('');

  const filtered = useMemo(
    () => filterServices(query, category, services),
    [query, category, services],
  );

  return (
    <Section
      id="services-catalog"
      tone="light"
      className="scroll-mt-24 py-16 md:py-24"
    >
      <SectionIntro
        title={servicesCatalogIntro.title}
        description={servicesCatalogIntro.description}
        actions={
          <div className="flex flex-wrap gap-2" role="group" aria-label="Service categories">
            {serviceCategories.map((item) => (
              <Button
                key={item}
                size="sm"
                variant={category === item ? 'primary' : 'secondary'}
                className="min-h-10"
                onClick={() => setCategory(item)}
                aria-pressed={category === item}
              >
                {item}
              </Button>
            ))}
          </div>
        }
      />

      <div className="mt-8 max-w-md">
        <Input
          id="services-search"
          type="search"
          label="Search services"
          placeholder="Search bridal, tailoring…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <p className="mt-4 text-sm text-black/55" aria-live="polite">
        {filtered.length} {filtered.length === 1 ? 'service' : 'services'}
        {category !== 'All' ? ` in ${category}` : ''}
        {query.trim() ? ` matching “${query.trim()}”` : ''}
      </p>

      <AnimatePresence mode="wait">
        {filtered.length === 0 ? (
          <motion.p
            key="empty"
            className="mt-12 text-base text-black/70"
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduced ? undefined : { opacity: 0 }}
          >
            No services match your search. Try another category or clear the search.
          </motion.p>
        ) : (
          <motion.ul
            key={`${category}-${query}`}
            className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-2"
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
          'focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-cream',
        )}
      >
        <div className="relative aspect-[16/11] w-full overflow-hidden">
          <OptimizedImage
            src={service.cardImage}
            alt={service.bannerAlt}
            className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]"
            width={1600}
            height={1100}
          />
          <div
            className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent"
            aria-hidden
          />
          <span className="absolute bottom-4 left-4 inline-flex items-center gap-2 text-gold">
            <ServiceIconMark name={service.icon} />
            <span className="text-xs font-semibold uppercase tracking-[0.2em]">
              {service.category}
            </span>
          </span>
        </div>
        <h3 className="mt-5 font-heading text-2xl leading-snug text-black">{service.title}</h3>
        <p className="mt-2 text-base leading-relaxed text-black/70">{service.summary}</p>
        <p className="mt-3 font-heading text-lg text-black">
          From <span className="text-gold">{service.pricing.startingFrom}</span>
        </p>
        <span className="mt-3 text-sm font-medium text-black transition-colors group-hover:text-gold">
          View details & pricing →
        </span>
      </button>
    </motion.li>
  );
}
