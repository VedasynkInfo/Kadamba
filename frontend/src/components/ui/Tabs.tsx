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

export function Tabs({ tabs, activeKey, onChange, className }: TabsProps) {
  return (
    <div className={cn('sticky top-0 z-10 bg-cream/90 backdrop-blur border-b border-black/10', className)}>
      <nav className="flex gap-0 overflow-x-auto" aria-label="Tabs">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={cn(
              'px-5 py-3.5 text-xs font-semibold uppercase tracking-[0.12em] transition-colors whitespace-nowrap',
              activeKey === tab.key
                ? 'border-b-2 border-gold text-black'
                : 'border-b-2 border-transparent text-black/45 hover:text-black/70',
            )}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
