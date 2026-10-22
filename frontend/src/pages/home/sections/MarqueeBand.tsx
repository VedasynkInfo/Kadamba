import { Marquee } from '@/components/site';

const WORDS = [
  'Maggam',
  'Zardozi',
  'Gota',
  'Resham',
  'Kanchipuram silk',
  'Chanderi',
  'Handloom',
  'Aari',
  'Raw silk',
  'Zari',
];

/**
 * The vocabulary band.
 *
 * A breath between two heavy sections, and a quiet statement of craft: the words
 * a studio uses when it talks to itself. Set in italic serif so it reads as an
 * inscription rather than a ticker.
 */
export function MarqueeBand() {
  return (
    <section className="on-dark overflow-hidden border-y border-ink-inverse/10 bg-espresso py-7 text-ink-inverse">
      <Marquee duration={54} gap="2.5rem" tone="dark">
        {WORDS.map((word) => (
          <span key={word} className="flex items-center gap-10">
            <span className="font-heading text-2xl italic text-ink-inverse/75 md:text-3xl">
              {word}
            </span>
            <span className="text-gold/60" aria-hidden>
              ✦
            </span>
          </span>
        ))}
      </Marquee>
    </section>
  );
}
