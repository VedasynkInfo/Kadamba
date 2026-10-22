import { useState, useMemo } from 'react';
import { Icon } from '@/components/icons';
import type { ExpenseRecord } from '@/services/finance/financeService';
import { EmptyState } from '../components/EmptyState';
import { RowActionsMenu, Select } from '@/components/ui';

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
        className="rounded-xl border p-3.5 shadow-xs transition-colors flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-surface-raised border-line text-ink-raised"
      >
        <div className="flex flex-1 flex-wrap items-center gap-2.5">
          <div className="relative min-w-[180px] flex-1 sm:max-w-xs">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-xs opacity-70">
              <Icon name="search" size={14} />
            </span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search expenses..."
              className="w-full rounded-lg border py-2 pl-8 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-focus transition border-line"
            />
          </div>

          <div className="w-[160px] shrink-0">
            <Select
              value={categoryFilter}
              aria-label="Filter expenses by category"
              onChange={(value) => setCategoryFilter(value)}
              options={[{ value: 'All', label: 'All Categories' }, { value: 'fabric', label: 'Fabric' }, { value: 'embroidery materials', label: 'Embroidery' }, { value: 'rent', label: 'Rent' }, { value: 'utilities', label: 'Utilities' }, { value: 'marketing', label: 'Marketing' }, { value: 'misc', label: 'Misc' }]}
            />
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3">
          <span className="text-xs opacity-70">
            Showing <strong>{filtered.length}</strong> items
          </span>
          <button
            type="button"
            onClick={onAddExpense}
            className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold shadow-xs transition hover:opacity-95 active:scale-98 cursor-pointer bg-brand text-ink-on-brand"
          >
            <span className="text-sm font-black">+</span>
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* Table */}
      <div
        className="rounded-xl border shadow-xs overflow-visible transition-colors bg-surface-raised border-line text-ink-raised"
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
                  className="border-b text-[0.65rem] uppercase tracking-wider font-semibold opacity-75 border-line bg-surface-sunken"
                >
                  <th className="py-3 px-4 min-w-[220px]">Expense Item / Details</th>
                  <th className="py-3 px-4 w-[160px]">Category</th>
                  <th className="py-3 px-4 w-[130px]">Date Incurred</th>
                  <th className="py-3 px-4 w-[140px] text-right">Amount</th>
                  <th className="py-3 px-4 w-[70px] text-right">Actions</th>
                </tr>
              </thead>
              <tbody
                className="stagger-rows divide-y border-line"
              >
                {filtered.map((exp) => {

                  return (
                    <tr
                      key={exp.id}
                      className="transition hover:bg-current/[0.03] border-line"
                    >
                      <td className="py-3 px-4">
                        <span className="font-semibold block truncate">{exp.title}</span>
                        {exp.notes ? (
                          <span className="text-[10px] opacity-70 block truncate max-w-[300px] mt-0.5">
                            {exp.notes}
                          </span>
                        ) : null}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border bg-surface-sunken border-line"
                        >
                          {exp.category}
                        </span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap opacity-75">
                        {formatDate(exp.spentAt)}
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <span className="font-bold text-rose-700">{formatINR(exp.amount)}</span>
                      </td>

                      <td className="py-3 px-4 text-right whitespace-nowrap w-[70px]">
                        <RowActionsMenu
                          label={`Actions for ${exp.title}`}
                          row={exp}
                          actions={[
                            { id: 'edit', label: 'Edit Expense', icon: 'edit', onSelect: (row) => onEditExpense(row) },
                            { id: 'delete', label: 'Delete Expense', icon: 'delete', divider: true, tone: 'danger', onSelect: (row) => { if (window.confirm('Delete this expense record?')) onDeleteExpense(row.id); } },
                          ]}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        
      </div>
    </div>
  );
}
