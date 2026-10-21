import { motion } from 'framer-motion';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { cn } from '@/utils/cn';

export interface SplitTextProps {
  text: string;
  className?: string;
  /** Decorative copy inside an already-labelled heading. */
  decorative?: boolean;
  /** Seconds before the first character moves. */
  delay?: number;
  as?: 'span' | 'p';
}

/**
 * Character reveal.
 *
 * The visible characters are split, but the accessible name is the sentence:
 * screen readers get one word instead of one node per letter. Each line stays
 * selectable because the animation only transforms inline spans.
 */
export function SplitText({
  text,
  className,
  decorative = false,
  delay = 0,
  as: Tag = 'span',
}: SplitTextProps) {
  const reduced = usePrefersReducedMotion();
  const words = text.split(' ');

  if (reduced) {
    return <Tag className={className}>{text}</Tag>;
  }

  return (
    <Tag className={cn('inline-block', className)} aria-hidden={decorative || undefined}>
      {words.map((word, wordIndex) => (
        <span key={`${word}-${wordIndex}`} className="inline-block overflow-hidden align-bottom">
          {Array.from(word).map((char, charIndex) => (
            <motion.span
              key={`${char}-${charIndex}`}
              className="inline-block"
              initial={{ y: '115%', opacity: 0 }}
              animate={{ y: '0%', opacity: 1 }}
              transition={{
                duration: 0.65,
                delay: delay + (wordIndex * 0.04 + charIndex * 0.018),
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              {char}
            </motion.span>
          ))}
          {wordIndex < words.length - 1 ? <span className="inline-block">&nbsp;</span> : null}
        </span>
      ))}
    </Tag>
  );
}
