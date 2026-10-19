import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
  type ReactElement,
  type ReactNode,
} from 'react';
import { cn } from '@/utils/cn';

/**
 * Wrap the app once to share a delay between neighbouring tooltips; a lone
 * `Tooltip` still works without it because Radix falls back to its defaults.
 */
export const TooltipProvider = TooltipPrimitive.Provider;
export const TooltipRoot = TooltipPrimitive.Root;

/** The trigger is the primitive untouched: `asChild` and, crucially, focus. */
export const TooltipTrigger = TooltipPrimitive.Trigger;

export const TooltipContent = forwardRef<
  ElementRef<typeof TooltipPrimitive.Content>,
  ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 6, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        'z-50 max-w-xs rounded-md border border-line bg-surface-inverse px-2.5 py-1.5 text-xs text-ink-inverse shadow-soft',
        'animate-toast-in',
        className,
      )}
      {...props}
    />
  </TooltipPrimitive.Portal>
));
TooltipContent.displayName = 'TooltipContent';

export interface TooltipProps {
  /** Tooltip copy. */
  label: ReactNode;
  /** The single element described by the tooltip; it keeps its own focus. */
  children: ReactElement;
  side?: ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>['side'];
  align?: ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>['align'];
  delayDuration?: number;
  className?: string;
}

/**
 * Convenience wrapper for the common "one element, one label" case.
 *
 * Radix shows the tooltip on keyboard focus as well as hover and does not
 * swallow focus, so no manual focus handlers are needed here.
 */
export function Tooltip({
  label,
  children,
  side = 'top',
  align = 'center',
  delayDuration,
  className,
}: TooltipProps) {
  return (
    <TooltipPrimitive.Root delayDuration={delayDuration}>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipContent side={side} align={align} className={className}>
        {label}
      </TooltipContent>
    </TooltipPrimitive.Root>
  );
}
