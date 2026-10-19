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
      className="rounded-xl border p-3.5 shadow-xs transition-colors"
      style={{
        backgroundColor: 'var(--admin-card, #141b26)',
        borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.18))',
        color: 'var(--admin-card-text, var(--admin-text, #f3f4f6))',
      }}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {/* Left side: Month/Year & Filters */}
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          {/* Year select */}
          <div className="w-[100px] shrink-0">
            <select
              value={String(year)}
              onChange={(e) => onYearChange(Number(e.target.value))}
              aria-label="Filter by year"
              className="w-full rounded-lg border py-2 px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--admin-primary,#b59410)] transition cursor-pointer"
              style={{
                backgroundColor: 'var(--admin-card, #141b26)',
                borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.25))',
                color: 'inherit',
              }}
            >
              {yearOptions.map((y) => (
                <option key={y.value} value={y.value}>
                  {y.label}
                </option>
              ))}
            </select>
          </div>

          {/* Month select */}
          <div className="w-[130px] shrink-0">
            <select
              value={String(month)}
              onChange={(e) => onMonthChange(Number(e.target.value))}
              aria-label="Filter by month"
              className="w-full rounded-lg border py-2 px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--admin-primary,#b59410)] transition cursor-pointer"
              style={{
                backgroundColor: 'var(--admin-card, #141b26)',
                borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.25))',
                color: 'inherit',
              }}
            >
              {monthOptions.map((m) => (
                <option key={m.value} value={m.value} disabled={m.disabled}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* Method select */}
          <div className="w-[125px] shrink-0">
            <select
              value={selectedMethod}
              onChange={(e) => onMethodChange(e.target.value)}
              aria-label="Filter by payment method"
              className="w-full rounded-lg border py-2 px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--admin-primary,#b59410)] transition cursor-pointer"
              style={{
                backgroundColor: 'var(--admin-card, #141b26)',
                borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.25))',
                color: 'inherit',
              }}
            >
              <option value="All">All Methods</option>
              <option value="upi">UPI / QR</option>
              <option value="cash">Cash Counter</option>
              <option value="card">Credit/Debit Card</option>
              <option value="bank">Bank Transfer</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Search query */}
          <div className="relative min-w-[170px] flex-1 sm:max-w-xs">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-xs opacity-50">
              🔍
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              placeholder="Search reference, client, notes..."
              className="w-full rounded-lg border py-2 pl-8 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--admin-primary,#b59410)] transition"
              style={{
                backgroundColor: 'transparent',
                borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.25))',
                color: 'inherit',
              }}
            />
            {query ? (
              <button
                type="button"
                onClick={() => onQueryChange('')}
                className="absolute inset-y-0 right-2.5 flex items-center text-xs opacity-50 hover:opacity-100 cursor-pointer"
                title="Clear search"
              >
                ✕
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
            className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold shadow-xs transition hover:opacity-95 active:scale-98 whitespace-nowrap cursor-pointer"
            style={{
              backgroundColor: 'var(--admin-primary, #b59410)',
              color: 'var(--admin-primary-text, #ffffff)',
            }}
          >
            <span className="text-sm font-black">+</span>
            <span>Record Payment</span>
          </button>
        </div>
      </div>
    </div>
  );
}
