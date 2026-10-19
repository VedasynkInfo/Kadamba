import * as TabsPrimitive from '@radix-ui/react-tabs';
import { cn } from '@/utils/cn';

export interface Tab {
  key: string;
  label: string;
}

export interface TabsProps {
  tabs: Tab[];
  activeKey: string;
  onChange: (key: string) => void;
  className?: string;
}

/**
 * Tab strip. The public props are unchanged, so this is now Radix internals
 * rather than hand-rolled buttons: Radix brings the roving-focus arrow-key
 * navigation and the `tablist`/`tab` ARIA wiring the old markup lacked.
 *
 * One behaviour shift: Radix's `onValueChange` only fires when the value really
 * changes, so clicking the already-active tab no longer re-emits `onChange`.
 *
 * The strip renders no `Tabs.Content` panels — call sites use it as a filter
 * switcher rather than as tabs-with-panels, so the trigger's `aria-controls`
 * has no panel to point at.
 */
export function Tabs({ tabs, activeKey, onChange, className }: TabsProps) {
  return (
    <TabsPrimitive.Root
      value={activeKey}
      onValueChange={onChange}
      className={cn(
        'sticky top-0 z-10 border-b border-line bg-surface/90 backdrop-blur',
        className,
      )}
    >
      <TabsPrimitive.List className="flex gap-0 overflow-x-auto" aria-label="Tabs">
        {tabs.map((tab) => (
          <TabsPrimitive.Trigger
            key={tab.key}
            value={tab.key}
            className={cn(
              'px-5 py-3.5 text-xs font-semibold uppercase tracking-[0.12em] transition-colors whitespace-nowrap',
              'border-b-2 border-transparent text-ink/45 hover:text-ink/70',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/40',
              'data-[state=active]:border-gold data-[state=active]:text-ink',
            )}
          >
            {tab.label}
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>
    </TabsPrimitive.Root>
  );
}
