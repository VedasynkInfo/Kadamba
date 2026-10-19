import { useState, useEffect, useCallback } from 'react';
import {
  financeApi,
  type FinanceSummary,
  type ProfitLossReport,
  type ExpenseRecord,
  type SalaryRecord,
} from '@/services/finance/financeService';
import { Icon, type GlyphName } from '@/components/icons';
import { staffApi, type Staff } from '@/services/staff/staffService';
import { useToast } from '@/components/ui';
import { PageMeta, staticPageMeta } from '@/seo';
import { FinanceMetrics } from './FinanceMetrics';
import { FinanceOverviewTab } from './FinanceOverviewTab';
import { FinanceExpensesTab } from './FinanceExpensesTab';
import { FinanceSalariesTab } from './FinanceSalariesTab';
import { FinanceProfitLossTab } from './FinanceProfitLossTab';
import { ExpenseModalForm } from './ExpenseModalForm';
import { SalaryModalForm } from './SalaryModalForm';
import { cn } from '@/utils/cn';

type FinanceTab = 'overview' | 'expenses' | 'salaries' | 'profit-loss';

const TABS: { key: FinanceTab; label: string; icon: GlyphName }[] = [
  { key: 'overview', label: 'Financial Overview', icon: 'chart' },
  { key: 'expenses', label: 'Expenses Ledger', icon: 'expense' },
  { key: 'salaries', label: 'Artisan Payroll', icon: 'salary' },
  { key: 'profit-loss', label: 'P&L Statement', icon: 'profit' },
];

export default function FinanceAdminPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<FinanceTab>('overview');
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [salaries, setSalaries] = useState<SalaryRecord[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);

  // Profit & Loss Date Range
  const [plFrom, setPlFrom] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().slice(0, 10);
  });
  const [plTo, setPlTo] = useState(() => new Date().toISOString().slice(0, 10));
  const [plReport, setPlReport] = useState<ProfitLossReport | null>(null);
  const [plLoading, setPlLoading] = useState(false);

  // Modals
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseRecord | null>(null);
  const [salaryModalOpen, setSalaryModalOpen] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [sumData, expData, salData, staffData] = await Promise.all([
        financeApi.getSummary(),
        financeApi.listExpenses({ limit: 100 }),
        financeApi.listSalaries({ limit: 100 }),
        staffApi.list({ limit: 100, status: 'active' }),
      ]);
      setSummary(sumData);
      setExpenses(expData.items);
      setSalaries(salData.items);
      setStaffList(staffData.items);
    } catch {
      toast({ title: 'Failed to load finance data', tone: 'error' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const loadPL = useCallback(async () => {
    setPlLoading(true);
    try {
      const data = await financeApi.getProfitLoss({
        from: new Date(plFrom).toISOString(),
        to: new Date(plTo + 'T23:59:59').toISOString(),
      });
      setPlReport(data);
    } catch {
      toast({ title: 'Failed to load P&L statement', tone: 'error' });
    } finally {
      setPlLoading(false);
    }
  }, [plFrom, plTo, toast]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (activeTab === 'profit-loss') {
      void loadPL();
    }
  }, [activeTab, loadPL]);

  const handleDeleteExpense = async (id: string) => {
    try {
      await financeApi.deleteExpense(id);
      toast({ title: 'Expense deleted', tone: 'success' });
      void loadData();
    } catch {
      toast({ title: 'Failed to delete expense', tone: 'error' });
    }
  };

  return (
    <>
      <PageMeta {...staticPageMeta.admin} path="/admin/finance" title="Financial Hub" />

      <div className="space-y-6">
        {/* Compact Header */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1
              className="font-heading text-xl font-bold tracking-tight sm:text-2xl text-ink"
            >
              Finance & Accounts Hub
            </h1>
            <p className="text-xs opacity-60">
              Studio revenue, raw material expenses, artisan salaries, and bottom-line profitability
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void loadData()}
              disabled={loading}
              className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition hover:bg-current/[0.05] active:scale-98 cursor-pointer border-line"
            >
              <span className={loading ? 'animate-spin' : ''}><Icon name="refresh" size={14} className="mr-1 inline align-middle" /> </span>
              <span>Sync Ledgers</span>
            </button>
          </div>
        </div>

        {/* Pulse Metrics */}
        {summary ? <FinanceMetrics summary={summary} /> : null}

        {/* Modern Tab Bar */}
        <div
          className="flex border-b text-xs font-semibold overflow-x-auto border-line"
        >
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'flex items-center gap-2 py-3 px-4 border-b-2 whitespace-nowrap transition cursor-pointer',
                  isActive
                    ? 'border-brand text-brand font-bold'
                    : 'border-transparent opacity-65 hover:opacity-100',
                )}
              >
                <Icon name={tab.icon} size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Active Tab Content */}
        {activeTab === 'overview' && summary ? (
          <FinanceOverviewTab summary={summary} />
        ) : null}

        {activeTab === 'expenses' ? (
          <FinanceExpensesTab
            expenses={expenses}
            onAddExpense={() => {
              setEditingExpense(null);
              setExpenseModalOpen(true);
            }}
            onEditExpense={(exp) => {
              setEditingExpense(exp);
              setExpenseModalOpen(true);
            }}
            onDeleteExpense={handleDeleteExpense}
          />
        ) : null}

        {activeTab === 'salaries' ? (
          <FinanceSalariesTab
            salaries={salaries}
            onAddSalary={() => setSalaryModalOpen(true)}
          />
        ) : null}

        {activeTab === 'profit-loss' ? (
          <FinanceProfitLossTab
            report={plReport}
            loading={plLoading}
            fromDate={plFrom}
            toDate={plTo}
            onFromChange={setPlFrom}
            onToChange={setPlTo}
            onRefresh={() => void loadPL()}
          />
        ) : null}
      </div>

      {/* Expense Modal Dialog */}
      <ExpenseModalForm
        open={expenseModalOpen}
        expense={editingExpense}
        onClose={() => {
          setExpenseModalOpen(false);
          setEditingExpense(null);
        }}
        onSuccess={() => void loadData()}
      />

      {/* Salary Disbursement Modal Dialog */}
      <SalaryModalForm
        open={salaryModalOpen}
        staffList={staffList}
        onClose={() => setSalaryModalOpen(false)}
        onSuccess={() => void loadData()}
      />
    </>
  );
}
