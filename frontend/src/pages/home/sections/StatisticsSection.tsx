import { CountUp } from '@/components/motion/CountUp';
import { Heading, Section } from '@/components/ui';
import { stats } from '../data';

/**
 * Studio statistics.
 *
 * Counts go through the same `CountUp` primitive as the dashboard and the
 * about page: one count-up implementation, one reduced-motion decision, one
 * formatting contract.
 */
export function StatisticsSection() {
  return (
    <Section tone="dark" className="border-y border-gold/15 py-16 md:py-20">
      <Heading as={2} className="sr-only">
        Studio statistics
      </Heading>
      <ul className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <li key={stat.id}>
            <p className="font-heading text-4xl text-gold md:text-5xl">
              <CountUp
                value={stat.value}
                duration={1.4}
                format={(value) => `${value}${stat.suffix}`}
              />
            </p>
            <p className="mt-2 text-sm text-ink-inverse/70">{stat.label}</p>
          </li>
        ))}
      </ul>
    </Section>
  );
}
