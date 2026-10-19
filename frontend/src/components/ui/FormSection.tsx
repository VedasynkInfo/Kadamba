import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

export interface FormSectionProps {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  tone?: 'light' | 'dark';
}

export function FormSection({
  title,
  description,
  children,
  className,
  tone = 'light',
}: FormSectionProps) {
  const titleColor = tone === 'dark' ? 'text-ink-inverse' : 'text-ink';
  const descColor = tone === 'dark' ? 'text-ink-inverse/50' : 'text-ink/50';

  return (
    <div className={cn('space-y-4', className)}>
      {title ? (
        <div>
          <h3 className={cn('text-sm font-semibold uppercase tracking-[0.14em]', titleColor)}>
            {title}
          </h3>
          {description ? (
            <p className={cn('mt-1 text-xs', descColor)}>{description}</p>
          ) : null}
          <div className="mt-2 border-b border-line" />
        </div>
      ) : null}
      {children}
    </div>
  );
}
