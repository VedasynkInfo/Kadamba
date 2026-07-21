import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { Heading, Section } from '@/components/ui';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { stats } from '../data';

function AnimatedStat({
  value,
  suffix,
  label,
  reduced,
}: {
  value: number;
  suffix: string;
  label: string;
  reduced: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (reduced) {
      el.textContent = `${value}${suffix}`;
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setStarted(true);
      },
      { threshold: 0.4 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [reduced, value, suffix]);

  useEffect(() => {
    if (!started || reduced || !ref.current) return;
    const obj = { n: 0 };
    const tween = gsap.to(obj, {
      n: value,
      duration: 1.6,
      ease: 'power2.out',
      onUpdate: () => {
        if (ref.current) ref.current.textContent = `${Math.round(obj.n)}${suffix}`;
      },
    });
    return () => {
      tween.kill();
    };
  }, [started, reduced, value, suffix]);

  return (
    <div>
      <p className="font-heading text-4xl text-gold md:text-5xl">
        <span ref={ref}>{reduced ? `${value}${suffix}` : `0${suffix}`}</span>
      </p>
      <p className="mt-2 text-sm text-cream/70">{label}</p>
    </div>
  );
}

/**
 * Animated statistics counters.
 */
export function StatisticsSection() {
  const reduced = usePrefersReducedMotion();

  return (
    <Section tone="dark" className="border-y border-gold/15 py-16 md:py-20">
      <Heading as={2} className="sr-only">
        Studio statistics
      </Heading>
      <ul className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <li key={stat.id}>
            <AnimatedStat
              value={stat.value}
              suffix={stat.suffix}
              label={stat.label}
              reduced={reduced}
            />
          </li>
        ))}
      </ul>
    </Section>
  );
}
