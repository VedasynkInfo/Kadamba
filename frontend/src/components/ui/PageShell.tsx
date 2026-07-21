import type { ReactNode } from 'react';
import { Container } from '@/components/layout/Container';
import { Breadcrumb, type BreadcrumbItem } from '@/components/ui/Breadcrumb';
import { Heading } from '@/components/ui/Heading';
import { cn } from '@/utils/cn';

interface PageShellProps {
  title: string;
  description: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: ReactNode;
  className?: string;
}

/**
 * Standard page header used by placeholder and content pages.
 */
export function PageShell({
  title,
  description,
  breadcrumbs,
  actions,
  className,
}: PageShellProps) {
  return (
    <Container className={cn('py-10 md:py-14', className)}>
      {breadcrumbs ? <Breadcrumb items={breadcrumbs} className="mb-6" /> : null}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <Heading as={1} animated>
            {title}
          </Heading>
          <p className="text-lede mt-4 text-black/70">{description}</p>
        </div>
        {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
      </div>
    </Container>
  );
}
