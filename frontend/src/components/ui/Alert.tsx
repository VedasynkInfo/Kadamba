import { type ReactNode } from 'react';
import { cn } from '@/utils/cn';

export type AlertTone = 'error' | 'success' | 'warning' | 'info';

export interface AlertProps {
  tone?: AlertTone;
  title?: string;
  children: ReactNode;
  className?: string;
  onDismiss?: () => void;
}

const toneClasses: Record<AlertTone, string> = {
  error: 'border-rose-200 bg-rose-50 text-rose-800',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
  info: 'border-blue-200 bg-blue-50 text-blue-800',
};

const titleClasses: Record<AlertTone, string> = {
  error: 'text-rose-900',
  success: 'text-emerald-900',
  warning: 'text-amber-900',
  info: 'text-blue-900',
};

export function Alert({
  tone = 'info',
  title,
  children,
  className,
  onDismiss,
}: AlertProps) {
  return (
    <div
      role="alert"
      className={cn(
        'rounded-md border px-4 py-3 text-sm',
        toneClasses[tone],
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          {title ? (
            <p className={cn('font-semibold mb-1', titleClasses[tone])}>{title}</p>
          ) : null}
          <div className="opacity-90">{children}</div>
        </div>
        {onDismiss ? (
          <button
            type="button"
            onClick={onDismiss}
            className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
            aria-label="Dismiss"
          >
            ✕
          </button>
        ) : null}
      </div>
    </div>
  );
}
