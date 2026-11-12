import { motion } from 'framer-motion';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { cn } from '@/utils/cn';

/**
 * A paragraph that lights up word by word as it enters the viewport.
 *
 * The words are always present in the DOM, so the text remains selectable,
 * searchable and readable by assistive technology. Only opacity changes; no
 * layout is recalculated. Reduced motion renders the untouched paragraph.
 */
export function WordReveal({
  text,
  className,
  as: Tag = 'p',
}: {
  text: string;
  className?: string;
  as?: 'p' | 'span' | 'div';
}) {
  const reduced = usePrefersReducedMotion();
  if (reduced) return <Tag className={className}>{text}</Tag>;

  return (
    <Tag className={cn(className)}>
      {text.split(/(\s+)/).map((part, index) =>
        /^\s+$/.test(part) ? (
          <span key={`space-${index}`}>{part}</span>
        ) : (
          <motion.span
            key={`${part}-${index}`}
            initial={{ opacity: 0.16, y: 6 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-8%' }}
            transition={{ duration: 0.5, delay: Math.min(index * 0.012, 0.5), ease: [0.22, 1, 0.36, 1] }}
            className="inline-block"
          >
            {part}
          </motion.span>
        ),
      )}
    </Tag>
  );
}
