import { useState, useMemo, useEffect } from 'react';
import type { ExpenseRecord } from '@/services/finance/financeService';
import { EmptyState } from '../components/EmptyState';
import { cn } from '@/utils/cn';

function formatINR(v: number) {
  return `₹${v.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

interface FinanceExpensesTabProps {
  expenses: ExpenseRecord[];
  onAddExpense: () => void;
  onEditExpense: (exp: ExpenseRecord) => void;
  onDeleteExpense: (id: string) => void;
}

export function FinanceExpensesTab({
  expenses,
  onAddExpense,
  onEditExpense,
  onDeleteExpense,
}: FinanceExpensesTabProps) {
  const [query, setQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [menuAnchor, setMenuAnchor] = useState<{
    expense: ExpenseRecord;
    top: number;
    right: number;
    showAbove: boolean;
  } | null>(null);

  useEffect(() => {
    if (!menuAnchor) return;
    const handleClose = () => setMenuAnchor(null);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuAnchor(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', handleClose, true);
    window.addEventListener('resize', handleClose);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', handleClose, true);
      window.removeEventListener('resize', handleClose);
    };
  }, [menuAnchor]);

  function handleOpenMenu(e: React.MouseEvent<HTMLButtonElement>, exp: ExpenseRecord) {
    e.stopPropagation();
    if (menuAnchor?.expense.id === exp.id) {
      setMenuAnchor(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const menuHeight = 120;
    const spaceBelow = window.innerHeight - rect.bottom;
    const showAbove = spaceBelow < menuHeight && rect.top > menuHeight;

    setMenuAnchor({
      expense: exp,
      top: showAbove ? rect.top - 6 : rect.bottom + 6,
      right: window.innerWidth - rect.right,
      showAbove,
    });
  }

  const filtered = useMemo(() => {
    let result = [...expenses];
    if (categoryFilter !== 'All') {
      result = result.filter((e) => e.category === categoryFilter);
    }
    if (query.trim()) {
      const q = query.toLowerCase().trim();
      result = result.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          (e.notes && e.notes.toLowerCase().includes(q)) ||
          e.category.toLowerCase().includes(q),
      );
    }
    return result;
  }, [expenses, categoryFilter, query]);

  return (
    <div className="space-y-4">
      {/* Action Toolbar */}
      <div
        className="rounded-xl border p-3.5 shadow-xs transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
        style={{
          backgroundColor: 'var(--admin-card, #141b26)',
          borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.18))',
          color: 'var(--admin-card-text, var(--admin-text, #f3f4f6))',
        }}
      >
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          <div className="relative min-w-[180px] flex-1 sm:max-w-xs">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-xs opacity-50">
              🔍
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search expenses..."
              className="w-full rounded-lg border py-2 pl-8 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--admin-primary,#b59410)] transition"
              style={{
                backgroundColor: 'transparent',
                borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.25))',
                color: 'inherit',
              }}
            />
          </div>

          <div className="w-[160px] shrink-0">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              aria-label="Filter expenses by category"
              className="w-full rounded-lg border py-2 px-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--admin-primary,#b59410)] transition cursor-pointer"
              style={{
                backgroundColor: 'var(--admin-card, #141b26)',
                borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.25))',
                color: 'inherit',
              }}
            >
              <option value="All">All Categories</option>
              <option value="fabric">Fabric</option>
              <option value="embroidery materials">Embroidery</option>
              <option value="rent">Rent</option>
              <option value="utilities">Utilities</option>
              <option value="marketing">Marketing</option>
              <option value="misc">Misc</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3">
          <span className="text-xs opacity-60">
            Showing <strong>{filtered.length}</strong> items
          </span>
          <button
            type="button"
            onClick={onAddExpense}
            className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold shadow-xs transition hover:opacity-95 active:scale-98 cursor-pointer"
            style={{
              backgroundColor: 'var(--admin-primary, #b59410)',
              color: 'var(--admin-primary-text, #ffffff)',
            }}
          >
            <span className="text-sm font-black">+</span>
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div
        className="rounded-xl border shadow-xs overflow-visible transition-colors"
        style={{
          backgroundColor: 'var(--admin-card, #141b26)',
          borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.18))',
          color: 'var(--admin-card-text, var(--admin-text, #f3f4f6))',
        }}
      >
        {filtered.length === 0 ? (
          <div className="p-8">
            <EmptyState
              title="No expenses logged"
              description="No studio expenses match your search or filter."
              actionLabel="+ Log First Expense"
              onAction={onAddExpense}
            />
          </div>
        ) : (
          <div className="overflow-x-auto overflow-y-hidden">
            <table className="w-full min-w-[900px] text-left border-collapse text-xs table-fixed">
              <thead>
                <tr
                  className="border-b text-[0.65rem] uppercase tracking-wider font-semibold opacity-75"
                  style={{
                    borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.18))',
                    backgroundColor: 'rgba(128, 128, 128, 0.05)',
                  }}
                >
                  <th className="py-3 px-4 min-w-[220px]">Expense Item / Details</th>
                  <th className="py-3 px-4 w-[160px]">Category</th>
                  <th className="py-3 px-4 w-[130px]">Date Incurred</th>
                  <th className="py-3 px-4 w-[140px] text-right">Amount</th>
                  <th className="py-3 px-4 w-[70px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody
                className="divide-y"
                style={{ borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.12))' }}
              >
                {filtered.map((exp) => {
                  const isMenuOpen = menuAnchor?.expense.id === exp.id;

                  return (
                    <tr
                      key={exp.id}
                      className="transition hover:bg-current/[0.03]"
                      style={{ borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.12))' }}
                    >
                      <td className="py-3 px-4">
                        <span className="font-semibold block truncate">{exp.title}</span>
                        {exp.notes ? (
                          <span className="text-[10px] opacity-60 block truncate max-w-[300px] mt-0.5">
                            {exp.notes}
                          </span>
                        ) : null}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border"
                          style={{
                            backgroundColor: 'rgba(128, 128, 128, 0.08)',
                            borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.2))',
                          }}
                        >
                          {exp.category}
                        </span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap opacity-75">
                        {formatDate(exp.spentAt)}
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <span className="font-bold text-rose-400">{formatINR(exp.amount)}</span>
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap w-[70px]">
                        <button
                          type="button"
                          onClick={(e) => handleOpenMenu(e, exp)}
                          className={cn(
                            'inline-flex h-8 w-8 items-center justify-center rounded-lg border transition cursor-pointer',
                            isMenuOpen
                              ? 'bg-[var(--admin-primary,#b59410)]/15 text-[var(--admin-primary,#b59410)] font-bold'
                              : 'hover:bg-current/[0.08]',
                          )}
                          style={{
                            borderColor: isMenuOpen
                              ? 'var(--admin-primary, #b59410)'
                              : 'var(--admin-border, rgba(128, 128, 128, 0.2))',
                          }}
                          aria-label="Actions menu"
                          aria-expanded={isMenuOpen}
                        >
                          <span className="text-base leading-none font-bold">⋮</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Floating Action Dropdown */}
        {menuAnchor ? (
          <>
            <div
              className="fixed inset-0 z-40 bg-transparent"
              onClick={() => setMenuAnchor(null)}
            />
            <div
              className="fixed z-50 w-44 rounded-xl border p-1 shadow-2xl animate-fade-in text-left text-xs"
              style={{
                top: menuAnchor.showAbove ? undefined : `${menuAnchor.top}px`,
                bottom: menuAnchor.showAbove ? `${window.innerHeight - menuAnchor.top}px` : undefined,
                right: `${menuAnchor.right}px`,
                backgroundColor: 'var(--admin-card, #1f2937)',
                borderColor: 'var(--admin-border, rgba(128, 128, 128, 0.22))',
                color: 'var(--admin-card-text, var(--admin-text, #f3f4f6))',
                boxShadow: '0 12px 32px -4px rgba(0, 0, 0, 0.35)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => {
                  const target = menuAnchor.expense;
                  setMenuAnchor(null);
                  onEditExpense(target);
                }}
                className="w-full flex items-center gap-2 rounded-lg px-3 py-2 font-medium transition hover:bg-current/[0.06] text-inherit cursor-pointer"
              >
                <span>✏️</span>
                <span>Edit Expense</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  const id = menuAnchor.expense.id;
                  setMenuAnchor(null);
                  if (window.confirm('Delete this expense record?')) {
                    onDeleteExpense(id);
                  }
                }}
                className="w-full flex items-center gap-2 rounded-lg px-3 py-2 font-medium text-rose-400 hover:bg-rose-500/10 transition cursor-pointer"
              >
                <span>🗑️</span>
                <span>Delete Expense</span>
              </button>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
