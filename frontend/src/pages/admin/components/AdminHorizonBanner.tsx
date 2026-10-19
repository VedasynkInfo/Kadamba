import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui';
import { brand } from '@/pages/home/data';

export interface AdminHorizonBannerProps {
  title: string;
  copy: string;
  density?: 'desk' | 'module';
  actionLabel?: string;
  actionTo?: string;
  onAction?: () => void;
  image?: string;
  imageAlt?: string;
}

/**
 * Compact Executive Admin Page Header.
 * Modern, sleek, space-efficient top header without large photo banners.
 */
export function AdminHorizonBanner({
  title,
  copy,
  actionLabel,
  actionTo,
  onAction,
}: AdminHorizonBannerProps) {
  const navigate = useNavigate();
  const showAction = Boolean(actionLabel && (onAction || actionTo));

  return (
    <header
      className="border-b transition-colors duration-200"
      style={{
        backgroundColor: 'var(--admin-card, #111827)',
        borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.18))',
        color: 'var(--admin-card-text, var(--admin-text, #f3f4f6))',
      }}
      aria-label={`${brand.shortName} admin — ${title}`}
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 md:px-8">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-gold" />
            <p className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-gold/90">
              {brand.shortName} · Studio Console
            </p>
          </div>
          <h1
            className="mt-1 font-heading text-xl font-bold tracking-tight sm:text-2xl"
            style={{ color: 'var(--admin-card-text, var(--admin-text, #f3f4f6))' }}
          >
            {title}
          </h1>
          <p className="mt-0.5 text-xs opacity-70 line-clamp-1">
            {copy}
          </p>
        </div>

        {showAction ? (
          <div className="shrink-0 pt-1 sm:pt-0">
            <Button
              variant="primary"
              size="sm"
              className="shadow-sm font-semibold tracking-wide"
              onClick={() => {
                if (onAction) onAction();
                else if (actionTo) navigate(actionTo);
              }}
            >
              {actionLabel}
            </Button>
          </div>
        ) : null}
      </div>
    </header>
  );
}

