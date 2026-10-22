import { Icon } from '@/components/icons';
import { Select } from '@/components/ui';
interface MonthOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface YearOption {
  value: string;
  label: string;
}

interface PaymentsToolbarProps {
  query: string;
  onQueryChange: (q: string) => void;
  year: number;
  onYearChange: (y: number) => void;
  month: number;
  onMonthChange: (m: number) => void;
  yearOptions: YearOption[];
  monthOptions: MonthOption[];
  selectedMethod: string;
  onMethodChange: (method: string) => void;
  filteredCount: number;
  totalCount: number;
  onRecordPayment: () => void;
}

export function PaymentsToolbar({
  query,
  onQueryChange,
  year,
  onYearChange,
  month,
  onMonthChange,
  yearOptions,
  monthOptions,
  selectedMethod,
  onMethodChange,
  filteredCount,
  totalCount,
  onRecordPayment,
}: PaymentsToolbarProps) {
  return (
    <div
      className="rounded-xl border p-3.5 shadow-xs transition-colors bg-surface-raised border-line text-ink-raised"
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Left side: Month/Year & Filters */}
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          {/* Year select */}
          <div className="w-[100px] shrink-0">
            <Select
              value={String(year)}
              aria-label="Filter by year"
              onChange={(value) => onYearChange(Number(value))}
              options={yearOptions.map((y) => ({ value: y.value, label: y.label }))}
            />
          </div>

          {/* Month select */}
          <div className="w-[130px] shrink-0">
            <Select
              value={String(month)}
              aria-label="Filter by month"
              onChange={(value) => onMonthChange(Number(value))}
              options={monthOptions.map((m) => ({ value: m.value, label: m.label }))}
            />
          </div>

          {/* Method select */}
          <div className="w-[125px] shrink-0">
            <Select
              value={selectedMethod}
              aria-label="Filter by payment method"
              onChange={(value) => onMethodChange(value)}
              options={[{ value: 'All', label: 'All Methods' }, { value: 'upi', label: 'UPI / QR' }, { value: 'cash', label: 'Cash Counter' }, { value: 'card', label: 'Credit/Debit Card' }, { value: 'bank', label: 'Bank Transfer' }, { value: 'other', label: 'Other' }]}
            />
          </div>

          {/* Search query */}
          <div className="relative min-w-[170px] flex-1 sm:max-w-xs">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-xs opacity-50">
              <Icon name="search" size={14} />
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Search reference, client, notes..."
              className="w-full rounded-lg border py-2 pl-8 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-focus transition border-line"
            />
            {query ? (
              <button
                type="button"
                onClick={() => onQueryChange('')}
                className="absolute inset-y-0 right-2.5 flex items-center text-xs opacity-50 hover:opacity-100 cursor-pointer"
                title="Clear search"
              >
                <Icon name="close" size={16} />
              </button>
            ) : null}
          </div>
        </div>

        {/* Right side: Count & Action */}
        <div className="flex items-center justify-between gap-2.5 pt-2 lg:pt-0 lg:justify-end">
          <span className="text-xs opacity-60 whitespace-nowrap">
            Showing <strong className="opacity-100 font-semibold">{filteredCount}</strong> of {totalCount}
          </span>

          <button
            type="button"
            onClick={onRecordPayment}
            className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold shadow-xs transition hover:opacity-95 active:scale-98 whitespace-nowrap cursor-pointer bg-brand text-ink-on-brand"
          >
            <span className="text-sm font-black">+</span>
            <span>Record Payment</span>
          </button>
        </div>
      </div>
    </div>
  );
}
