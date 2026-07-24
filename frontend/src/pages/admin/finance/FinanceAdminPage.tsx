import { useState, useEffect } from 'react';
import { financeApi, type FinanceSummary, type ProfitLossReport, type PaymentRecord, type ExpenseRecord, type SalaryRecord } from '@/services/finance/financeService';
import { staffApi, type Staff } from '@/services/staff/staffService';
import { Button, Drawer, Input, Spinner } from '@/components/ui';
import { AdminHorizonBanner } from '../components/AdminHorizonBanner';
import { adminBanners } from '../data';
import { cn } from '@/utils/cn';

type FinanceTab = 'overview' | 'payments' | 'expenses' | 'salaries' | 'profit-loss';

const EXPENSE_CATEGORIES = ['fabric', 'embroidery materials', 'rent', 'utilities', 'marketing', 'misc'] as const;
const MONTH_NAMES = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function formatINR(v: number) {
  return `₹${v.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function MetricCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div className={cn('rounded-xl border p-5 bg-white shadow-sm', color || 'border-stone-200')}>
      <p className="text-xs font-medium text-stone-500 uppercase tracking-wider">{label}</p>
      <p className="mt-2 text-2xl font-bold text-stone-800">{value}</p>
      {sub && <p className="mt-1 text-xs text-stone-400">{sub}</p>}
    </div>
  );
}

export default function FinanceAdminPage() {
  const [activeTab, setActiveTab] = useState<FinanceTab>('overview');
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [plReport, setPlReport] = useState<ProfitLossReport | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [salaries, setSalaries] = useState<SalaryRecord[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);

  // Expense drawer
  const [expenseDrawer, setExpenseDrawer] = useState(false);
  const [editExpense, setEditExpense] = useState<ExpenseRecord | null>(null);
  const [expenseTitle, setExpenseTitle] = useState('');
  const [expenseCategory, setExpenseCategory] = useState<typeof EXPENSE_CATEGORIES[number]>('misc');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState('');
  const [expenseNotes, setExpenseNotes] = useState('');
  const [savingExpense, setSavingExpense] = useState(false);

  // Salary drawer
  const [salaryDrawer, setSalaryDrawer] = useState(false);
  const [salStaffId, setSalStaffId] = useState('');
  const [salYear, setSalYear] = useState(new Date().getFullYear().toString());
  const [salMonth, setSalMonth] = useState((new Date().getMonth() + 1).toString());
  const [salAmount, setSalAmount] = useState('');
  const [salDate, setSalDate] = useState('');
  const [salNotes, setSalNotes] = useState('');
  const [savingSalary, setSavingSalary] = useState(false);

  // P&L date range
  const [plFrom, setPlFrom] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().slice(0, 10);
  });
  const [plTo, setPlTo] = useState(() => new Date().toISOString().slice(0, 10));

  const loadData = async () => {
    setLoading(true);
    try {
      const [sumData, payData, expData, salData] = await Promise.all([
        financeApi.getSummary(),
        financeApi.listPayments({ limit: 50 }),
        financeApi.listExpenses({ limit: 50 }),
        financeApi.listSalaries({ limit: 50 }),
      ]);
      setSummary(sumData);
      setPayments(payData.items);
      setExpenses(expData.items);
      setSalaries(salData.items);
    } catch (err) {
      console.error('Failed to load finance data', err);
    } finally {
      setLoading(false);
    }
  };

  const loadStaff = async () => {
    try {
      const data = await staffApi.list({ limit: 100, status: 'active' });
      setStaffList(data.items);
    } catch (err) {
      console.error('Failed to load staff list', err);
    }
  };

  const loadPL = async () => {
    try {
      const data = await financeApi.getProfitLoss({ from: new Date(plFrom).toISOString(), to: new Date(plTo + 'T23:59:59').toISOString() });
      setPlReport(data);
    } catch (err) {
      console.error('Failed to load P&L', err);
    }
  };

  useEffect(() => {
    void loadData();
    void loadStaff();
  }, []);

  useEffect(() => {
    if (activeTab === 'profit-loss') void loadPL();
  }, [activeTab, plFrom, plTo]);

  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseTitle.trim() || !expenseAmount || !expenseDate) {
      alert('Title, amount, and date are required.');
      return;
    }
    setSavingExpense(true);
    try {
      const payload = {
        title: expenseTitle.trim(),
        category: expenseCategory,
        amount: Number(expenseAmount),
        spentAt: new Date(expenseDate).toISOString(),
        notes: expenseNotes.trim() || undefined,
      };
      if (editExpense) {
        await financeApi.updateExpense(editExpense.id, payload);
      } else {
        await financeApi.recordExpense(payload as any);
      }
      setExpenseDrawer(false);
      setEditExpense(null);
      setExpenseTitle(''); setExpenseAmount(''); setExpenseDate(''); setExpenseNotes('');
      await loadData();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to save expense');
    } finally {
      setSavingExpense(false);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm('Delete this expense?')) return;
    try {
      await financeApi.deleteExpense(id);
      await loadData();
    } catch (err) {
      alert('Failed to delete expense');
    }
  };

  const handleSaveSalary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!salStaffId || !salAmount || !salDate) {
      alert('Staff, amount, and date are required.');
      return;
    }
    setSavingSalary(true);
    try {
      await financeApi.recordSalary({
        staffId: salStaffId,
        year: Number(salYear),
        month: Number(salMonth),
        amount: Number(salAmount),
        paidAt: new Date(salDate).toISOString(),
        notes: salNotes.trim() || undefined,
      });
      setSalaryDrawer(false);
      setSalStaffId(''); setSalAmount(''); setSalDate(''); setSalNotes('');
      await loadData();
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Failed to save salary payment');
    } finally {
      setSavingSalary(false);
    }
  };

  const openEditExpense = (exp: ExpenseRecord) => {
    setEditExpense(exp);
    setExpenseTitle(exp.title);
    setExpenseCategory(exp.category);
    setExpenseAmount(String(exp.amount));
    setExpenseDate(exp.spentAt.slice(0, 10));
    setExpenseNotes(exp.notes || '');
    setExpenseDrawer(true);
  };

  const TABS: { key: FinanceTab; label: string }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'payments', label: 'Payments' },
    { key: 'expenses', label: 'Expenses' },
    { key: 'salaries', label: 'Salaries' },
    { key: 'profit-loss', label: 'Profit & Loss' },
  ];

  return (
    <div className="min-h-screen bg-[#faf9f7]">
      <AdminHorizonBanner
        title={adminBanners.finance.title}
        copy={adminBanners.finance.copy}
        actionLabel={adminBanners.finance.actionLabel}
        onAction={() => setActiveTab('profit-loss')}
      />

      {/* Tab Bar */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-stone-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <nav className="flex gap-0 overflow-x-auto">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'px-5 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                  activeTab === tab.key
                    ? 'border-amber-500 text-amber-700'
                    : 'border-transparent text-stone-500 hover:text-stone-700'
                )}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {loading && activeTab === 'overview' ? (
          <div className="flex justify-center py-24"><Spinner size="lg" label="Loading finance data…" /></div>
        ) : (
          <>
            {/* ── OVERVIEW ── */}
            {activeTab === 'overview' && summary && (
              <div className="space-y-8">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                  <MetricCard label="Total Revenue" value={formatINR(summary.totalRevenue)} color="border-emerald-200" />
                  <MetricCard label="Revenue MTD" value={formatINR(summary.revenueMtd)} sub="This month" color="border-emerald-100" />
                  <MetricCard label="Total Expenses" value={formatINR(summary.totalExpenses)} color="border-rose-200" />
                  <MetricCard label="Salaries Paid" value={formatINR(summary.totalSalaries)} color="border-orange-200" />
                  <MetricCard label="Outstanding" value={formatINR(summary.pendingBalance)} sub="Unpaid balances" color="border-amber-200" />
                  <MetricCard
                    label="Net Profit"
                    value={formatINR(summary.netProfit)}
                    color={summary.netProfit >= 0 ? 'border-emerald-300 bg-emerald-50' : 'border-rose-300 bg-rose-50'}
                    sub={summary.netProfit >= 0 ? 'Profitable' : 'Loss'}
                  />
                </div>

                {/* Monthly trend mini-chart (text-based) */}
                {summary.series.length > 0 && (
                  <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
                    <h3 className="text-sm font-semibold text-stone-700 mb-4">Monthly Revenue vs Expenses</h3>
                    <div className="space-y-3">
                      {summary.series.slice(-6).map(row => {
                        const maxVal = Math.max(...summary.series.map(r => Math.max(r.revenue, r.expenses)), 1);
                        const revPct = (row.revenue / maxVal) * 100;
                        const expPct = (row.expenses / maxVal) * 100;
                        return (
                          <div key={row.month} className="flex items-center gap-3">
                            <span className="w-16 text-xs text-stone-500">{row.month}</span>
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <div className="h-2 rounded-full bg-emerald-400" style={{ width: `${revPct}%` }} />
                                <span className="text-xs text-stone-500">{formatINR(row.revenue)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="h-2 rounded-full bg-rose-300" style={{ width: `${expPct}%` }} />
                                <span className="text-xs text-stone-500">{formatINR(row.expenses)}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="mt-4 flex gap-4 text-xs text-stone-500">
                      <span className="flex items-center gap-1"><span className="w-3 h-2 rounded-full bg-emerald-400 inline-block" /> Revenue</span>
                      <span className="flex items-center gap-1"><span className="w-3 h-2 rounded-full bg-rose-300 inline-block" /> Expenses + Salaries</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── PAYMENTS ── */}
            {activeTab === 'payments' && (
              <div>
                <div className="mb-4 flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-stone-800">Payment Records</h2>
                  <p className="text-sm text-stone-500">All order payments (record payments from individual Order pages)</p>
                </div>
                {payments.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-stone-300 bg-white py-16 text-center">
                    <p className="text-stone-400">No payments recorded yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white shadow-sm">
                    <table className="min-w-full text-sm">
                      <thead className="bg-stone-50 text-stone-500 text-xs uppercase tracking-wider">
                        <tr>
                          <th className="px-4 py-3 text-left">Order</th>
                          <th className="px-4 py-3 text-left">Amount</th>
                          <th className="px-4 py-3 text-left">Method</th>
                          <th className="px-4 py-3 text-left hidden md:table-cell">Reference</th>
                          <th className="px-4 py-3 text-left">Date</th>
                          <th className="px-4 py-3 text-left hidden lg:table-cell">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {payments.map(p => (
                          <tr key={p.id} className="hover:bg-amber-50/30 transition-colors">
                            <td className="px-4 py-3">
                              <p className="font-medium text-stone-700">
                                {(p.orderId as any)?.orderNumber ? `#${(p.orderId as any).orderNumber}` : '—'}
                              </p>
                              <p className="text-xs text-stone-400">{(p.orderId as any)?.title || ''}</p>
                            </td>
                            <td className="px-4 py-3 font-semibold text-emerald-700">{formatINR(p.amount)}</td>
                            <td className="px-4 py-3">
                              <span className="rounded-full bg-blue-100 text-blue-700 px-2 py-0.5 text-xs font-medium uppercase">{p.method}</span>
                            </td>
                            <td className="px-4 py-3 hidden md:table-cell text-stone-500 text-xs">{p.reference || '—'}</td>
                            <td className="px-4 py-3 text-stone-500 text-xs">{new Date(p.paidAt).toLocaleDateString('en-IN')}</td>
                            <td className="px-4 py-3 hidden lg:table-cell text-stone-400 text-xs">{p.notes || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ── EXPENSES ── */}
            {activeTab === 'expenses' && (
              <div>
                <div className="mb-4 flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-stone-800">Expenses Ledger</h2>
                  <Button id="add-expense-btn" onClick={() => { setEditExpense(null); setExpenseTitle(''); setExpenseAmount(''); setExpenseDate(''); setExpenseNotes(''); setExpenseCategory('misc'); setExpenseDrawer(true); }}>+ Add Expense</Button>
                </div>
                {expenses.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-stone-300 bg-white py-16 text-center">
                    <p className="text-stone-400">No expenses recorded yet</p>
                    <Button className="mt-4" onClick={() => setExpenseDrawer(true)}>Record first expense</Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white shadow-sm">
                    <table className="min-w-full text-sm">
                      <thead className="bg-stone-50 text-stone-500 text-xs uppercase tracking-wider">
                        <tr>
                          <th className="px-4 py-3 text-left">Title</th>
                          <th className="px-4 py-3 text-left">Category</th>
                          <th className="px-4 py-3 text-left">Amount</th>
                          <th className="px-4 py-3 text-left hidden md:table-cell">Date</th>
                          <th className="px-4 py-3 text-left hidden lg:table-cell">Notes</th>
                          <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {expenses.map(exp => (
                          <tr key={exp.id} className="hover:bg-amber-50/30 transition-colors">
                            <td className="px-4 py-3 font-medium text-stone-800">{exp.title}</td>
                            <td className="px-4 py-3">
                              <span className="rounded-full bg-orange-100 text-orange-700 px-2 py-0.5 text-xs capitalize">{exp.category}</span>
                            </td>
                            <td className="px-4 py-3 font-semibold text-rose-700">{formatINR(exp.amount)}</td>
                            <td className="px-4 py-3 hidden md:table-cell text-stone-500 text-xs">{new Date(exp.spentAt).toLocaleDateString('en-IN')}</td>
                            <td className="px-4 py-3 hidden lg:table-cell text-stone-400 text-xs">{exp.notes || '—'}</td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex gap-2 justify-end">
                                <Button size="sm" variant="secondary" onClick={() => openEditExpense(exp)}>Edit</Button>
                                <Button size="sm" variant="secondary" className="text-rose-600 border-rose-200" onClick={() => handleDeleteExpense(exp.id)}>Delete</Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ── SALARIES ── */}
            {activeTab === 'salaries' && (
              <div>
                <div className="mb-4 flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-stone-800">Salary Payments</h2>
                  <Button id="record-salary-btn" onClick={() => setSalaryDrawer(true)}>+ Record Salary</Button>
                </div>
                {salaries.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-stone-300 bg-white py-16 text-center">
                    <p className="text-stone-400">No salary payments recorded yet</p>
                    <Button className="mt-4" onClick={() => setSalaryDrawer(true)}>Record first salary</Button>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-2xl border border-stone-200 bg-white shadow-sm">
                    <table className="min-w-full text-sm">
                      <thead className="bg-stone-50 text-stone-500 text-xs uppercase tracking-wider">
                        <tr>
                          <th className="px-4 py-3 text-left">Staff Member</th>
                          <th className="px-4 py-3 text-left">Period</th>
                          <th className="px-4 py-3 text-left">Amount</th>
                          <th className="px-4 py-3 text-left hidden md:table-cell">Paid On</th>
                          <th className="px-4 py-3 text-left hidden lg:table-cell">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {salaries.map(sal => (
                          <tr key={sal.id} className="hover:bg-amber-50/30 transition-colors">
                            <td className="px-4 py-3">
                              <p className="font-medium text-stone-800">{(sal.staffId as any)?.fullName || 'Staff'}</p>
                              <p className="text-xs text-stone-400">{(sal.staffId as any)?.phone || ''}</p>
                            </td>
                            <td className="px-4 py-3 text-stone-600">
                              {MONTH_NAMES[sal.month]} {sal.year}
                            </td>
                            <td className="px-4 py-3 font-semibold text-orange-700">{formatINR(sal.amount)}</td>
                            <td className="px-4 py-3 hidden md:table-cell text-stone-500 text-xs">{new Date(sal.paidAt).toLocaleDateString('en-IN')}</td>
                            <td className="px-4 py-3 hidden lg:table-cell text-stone-400 text-xs">{sal.notes || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ── PROFIT & LOSS ── */}
            {activeTab === 'profit-loss' && (
              <div>
                <div className="mb-6 flex flex-wrap gap-4 items-end justify-between">
                  <h2 className="text-lg font-semibold text-stone-800">Profit & Loss Report</h2>
                  <div className="flex gap-3 items-end">
                    <div>
                      <label className="mb-1 block text-xs text-stone-500">From</label>
                      <Input id="pl-from" type="date" value={plFrom} onChange={e => setPlFrom(e.target.value)} />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-stone-500">To</label>
                      <Input id="pl-to" type="date" value={plTo} onChange={e => setPlTo(e.target.value)} />
                    </div>
                  </div>
                </div>

                {plReport ? (
                  <div className="space-y-6">
                    {/* P&L Summary Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
                        <p className="text-xs font-medium text-emerald-600 uppercase tracking-wider">Revenue</p>
                        <p className="mt-2 text-2xl font-bold text-emerald-800">{formatINR(plReport.summary.revenue)}</p>
                      </div>
                      <div className="rounded-xl border border-rose-200 bg-rose-50 p-5">
                        <p className="text-xs font-medium text-rose-600 uppercase tracking-wider">Expenses</p>
                        <p className="mt-2 text-2xl font-bold text-rose-800">{formatINR(plReport.summary.expenses)}</p>
                      </div>
                      <div className="rounded-xl border border-orange-200 bg-orange-50 p-5">
                        <p className="text-xs font-medium text-orange-600 uppercase tracking-wider">Salaries</p>
                        <p className="mt-2 text-2xl font-bold text-orange-800">{formatINR(plReport.summary.salaries)}</p>
                      </div>
                      <div className={cn(
                        'rounded-xl border p-5',
                        plReport.summary.netProfit >= 0 ? 'border-emerald-300 bg-emerald-100' : 'border-rose-300 bg-rose-100'
                      )}>
                        <p className="text-xs font-medium uppercase tracking-wider text-stone-600">Net Profit</p>
                        <p className={cn(
                          'mt-2 text-2xl font-bold',
                          plReport.summary.netProfit >= 0 ? 'text-emerald-800' : 'text-rose-800'
                        )}>
                          {formatINR(plReport.summary.netProfit)}
                        </p>
                      </div>
                    </div>

                    {/* Formula strip */}
                    <div className="rounded-xl border border-stone-200 bg-white p-4 text-center text-sm text-stone-500">
                      <span className="font-semibold text-emerald-700">{formatINR(plReport.summary.revenue)}</span>
                      <span className="mx-2 text-stone-400">(Revenue)</span>
                      <span className="mx-2">−</span>
                      <span className="font-semibold text-rose-700">{formatINR(plReport.summary.expenses)}</span>
                      <span className="mx-2 text-stone-400">(Expenses)</span>
                      <span className="mx-2">−</span>
                      <span className="font-semibold text-orange-700">{formatINR(plReport.summary.salaries)}</span>
                      <span className="mx-2 text-stone-400">(Salaries)</span>
                      <span className="mx-2">=</span>
                      <span className={cn('font-bold', plReport.summary.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700')}>
                        {formatINR(plReport.summary.netProfit)}
                      </span>
                    </div>

                    {/* Breakdown tables */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Payments */}
                      <div className="rounded-xl border border-stone-200 bg-white overflow-hidden">
                        <div className="px-4 py-3 border-b border-stone-100 bg-emerald-50">
                          <p className="text-xs font-semibold text-emerald-700 uppercase">Payments ({plReport.payments.length})</p>
                        </div>
                        <div className="divide-y divide-stone-100 max-h-64 overflow-y-auto">
                          {plReport.payments.length === 0 ? <p className="px-4 py-4 text-xs text-stone-400">No payments in this period</p> : null}
                          {plReport.payments.map(p => (
                            <div key={p.id} className="px-4 py-2 flex justify-between text-xs">
                              <span className="text-stone-600">#{(p.order as any)?.orderNumber || '—'} · {p.method}</span>
                              <span className="font-semibold text-emerald-700">{formatINR(p.amount)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      {/* Expenses */}
                      <div className="rounded-xl border border-stone-200 bg-white overflow-hidden">
                        <div className="px-4 py-3 border-b border-stone-100 bg-rose-50">
                          <p className="text-xs font-semibold text-rose-700 uppercase">Expenses ({plReport.expenses.length})</p>
                        </div>
                        <div className="divide-y divide-stone-100 max-h-64 overflow-y-auto">
                          {plReport.expenses.length === 0 ? <p className="px-4 py-4 text-xs text-stone-400">No expenses in this period</p> : null}
                          {plReport.expenses.map(exp => (
                            <div key={exp.id} className="px-4 py-2 flex justify-between text-xs">
                              <span className="text-stone-600">{exp.title}</span>
                              <span className="font-semibold text-rose-700">{formatINR(exp.amount)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      {/* Salaries */}
                      <div className="rounded-xl border border-stone-200 bg-white overflow-hidden">
                        <div className="px-4 py-3 border-b border-stone-100 bg-orange-50">
                          <p className="text-xs font-semibold text-orange-700 uppercase">Salaries ({plReport.salaries.length})</p>
                        </div>
                        <div className="divide-y divide-stone-100 max-h-64 overflow-y-auto">
                          {plReport.salaries.length === 0 ? <p className="px-4 py-4 text-xs text-stone-400">No salaries in this period</p> : null}
                          {plReport.salaries.map(sal => (
                            <div key={sal.id} className="px-4 py-2 flex justify-between text-xs">
                              <span className="text-stone-600">{sal.staffName} · {sal.period}</span>
                              <span className="font-semibold text-orange-700">{formatINR(sal.amount)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-center py-16"><Spinner size="lg" label="Loading P&L…" /></div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Expense Drawer */}
      <Drawer open={expenseDrawer} onClose={() => setExpenseDrawer(false)} title={editExpense ? 'Edit Expense' : 'Record Expense'}>
        <form onSubmit={handleSaveExpense} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-stone-600">Title *</label>
            <Input id="expense-title" value={expenseTitle} onChange={e => setExpenseTitle(e.target.value)} placeholder="e.g. July Rent" required />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-stone-600">Category *</label>
            <select
              id="expense-category"
              value={expenseCategory}
              onChange={e => setExpenseCategory(e.target.value as any)}
              className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
            >
              {EXPENSE_CATEGORIES.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-600">Amount (₹) *</label>
              <Input id="expense-amount" value={expenseAmount} onChange={e => setExpenseAmount(e.target.value)} type="number" min="0.01" step="0.01" placeholder="0" required />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-600">Date *</label>
              <Input id="expense-date" value={expenseDate} onChange={e => setExpenseDate(e.target.value)} type="date" required />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-stone-600">Notes</label>
            <Input id="expense-notes" value={expenseNotes} onChange={e => setExpenseNotes(e.target.value)} placeholder="Optional notes" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setExpenseDrawer(false)}>Cancel</Button>
            <Button type="submit" disabled={savingExpense}>{savingExpense ? 'Saving…' : editExpense ? 'Update' : 'Record Expense'}</Button>
          </div>
        </form>
      </Drawer>

      {/* Salary Drawer */}
      <Drawer open={salaryDrawer} onClose={() => setSalaryDrawer(false)} title="Record Salary Payment">
        <form onSubmit={handleSaveSalary} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-stone-600">Staff Member *</label>
            <select
              id="salary-staff"
              value={salStaffId}
              onChange={e => setSalStaffId(e.target.value)}
              className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              required
            >
              <option value="">Select staff…</option>
              {staffList.map(s => <option key={s.id} value={s.id}>{s.fullName} ({s.phone})</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-600">Month *</label>
              <select
                id="salary-month"
                value={salMonth}
                onChange={e => setSalMonth(e.target.value)}
                className="w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
              >
                {MONTH_NAMES.slice(1).map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-600">Year *</label>
              <Input id="salary-year" value={salYear} onChange={e => setSalYear(e.target.value)} type="number" min="2020" max="2099" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-600">Amount (₹) *</label>
              <Input id="salary-amount" value={salAmount} onChange={e => setSalAmount(e.target.value)} type="number" min="0.01" step="0.01" placeholder="e.g. 15000" required />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-stone-600">Paid On *</label>
              <Input id="salary-date" value={salDate} onChange={e => setSalDate(e.target.value)} type="date" required />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-stone-600">Notes</label>
            <Input id="salary-notes" value={salNotes} onChange={e => setSalNotes(e.target.value)} placeholder="Optional notes" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setSalaryDrawer(false)}>Cancel</Button>
            <Button type="submit" disabled={savingSalary}>{savingSalary ? 'Saving…' : 'Record Salary'}</Button>
          </div>
        </form>
      </Drawer>
    </div>
  );
}
