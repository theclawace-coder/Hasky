import { useState, useMemo, useRef } from 'react';
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, startOfQuarter, endOfQuarter } from 'date-fns';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Plus,
  Trash2,
  AlertCircle,
  Receipt,
  Calculator,
  FileText,
  Printer,
  Paperclip,
  Upload,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useExpenses, useAccountingSummary } from '../../hooks/useAccounting';
import { useInvoices } from '../../hooks/useInvoices';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Skeleton } from '../../components/ui/Skeleton';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { formatCurrency, formatDate, cn } from '../../lib/utils';
import { EXPENSE_CATEGORIES } from '../../lib/constants';
import type { Expense } from '../../types';

type TabId = 'overview' | 'expenses' | 'reports';
type PeriodKey = 'this_month' | 'last_month' | 'this_quarter' | 'this_year' | 'custom';

const TABS: { id: TabId; label: string; icon: typeof BarChart3 }[] = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'expenses', label: 'Expenses', icon: TrendingDown },
  { id: 'reports', label: 'P&L Report', icon: FileText },
];

const CATEGORY_COLORS: Record<string, string> = {
  'Fuel': 'bg-orange-100 text-orange-700',
  'Maintenance & Repairs': 'bg-red-100 text-red-700',
  'Insurance': 'bg-blue-100 text-blue-700',
  'Wages & Labour': 'bg-violet-100 text-violet-700',
  'Office & Admin': 'bg-slate-100 text-slate-700',
  'Equipment Purchase': 'bg-amber-100 text-amber-700',
  'Transport & Freight': 'bg-sky-100 text-sky-700',
  'Marketing': 'bg-pink-100 text-pink-700',
  'Professional Services': 'bg-indigo-100 text-indigo-700',
  'Rent & Utilities': 'bg-teal-100 text-teal-700',
  'GST & Tax': 'bg-emerald-100 text-emerald-700',
  'Other': 'bg-slate-100 text-slate-600',
};

function getPeriodDates(period: PeriodKey, customFrom: string, customTo: string): [Date, Date] {
  const now = new Date();
  switch (period) {
    case 'this_month': return [startOfMonth(now), endOfMonth(now)];
    case 'last_month': return [startOfMonth(subMonths(now, 1)), endOfMonth(subMonths(now, 1))];
    case 'this_quarter': return [startOfQuarter(now), endOfQuarter(now)];
    case 'this_year': return [startOfYear(now), endOfYear(now)];
    case 'custom': return [new Date(customFrom), new Date(customTo)];
    default: return [startOfMonth(now), endOfMonth(now)];
  }
}

interface ExpenseFormData {
  category: string;
  description: string;
  amount: string;
  gst_amount: string;
  date: string;
  vendor: string;
  notes: string;
}

function ExpenseFormModal({
  open,
  onClose,
  onSave,
  loading,
  companyId,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (data: Partial<Expense>) => void;
  loading: boolean;
  companyId: string;
}) {
  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<ExpenseFormData>({
    defaultValues: {
      date: format(new Date(), 'yyyy-MM-dd'),
      gst_amount: '0',
    },
  });

  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const amount = watch('amount');

  const handleAutoGst = () => {
    const val = parseFloat(amount);
    if (!isNaN(val) && val > 0) {
      setValue('gst_amount', (val / 11).toFixed(2));
    }
  };

  const clearReceipt = () => {
    setReceiptFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const onSubmit = async (data: ExpenseFormData) => {
    let receipt_url: string | null = null;

    if (receiptFile && companyId) {
      setUploading(true);
      try {
        const ext = receiptFile.name.split('.').pop() ?? 'bin';
        const path = `${companyId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from('receipts')
          .upload(path, receiptFile, { upsert: false });
        if (uploadError) throw uploadError;
        const { data: urlData } = supabase.storage.from('receipts').getPublicUrl(path);
        receipt_url = urlData.publicUrl;
      } catch (err) {
        toast.error('Receipt upload failed. Ensure the "receipts" storage bucket exists in Supabase.');
        setUploading(false);
        return;
      }
      setUploading(false);
    }

    onSave({
      category: data.category as Expense['category'],
      description: data.description,
      amount: parseFloat(data.amount) || 0,
      gst_amount: parseFloat(data.gst_amount) || 0,
      date: data.date,
      vendor: data.vendor || null,
      notes: data.notes || null,
      receipt_url,
    });
    reset();
    clearReceipt();
  };

  return (
    <Modal open={open} onClose={onClose} title="Add Expense" description="Log a new business expense">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Category *</label>
            <select
              {...register('category', { required: 'Category is required' })}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">Select category…</option>
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            {errors.category ? (
              <p className="mt-1 text-xs text-red-600">{errors.category.message}</p>
            ) : null}
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Date *</label>
            <input
              type="date"
              {...register('date', { required: true })}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Description *</label>
          <input
            type="text"
            {...register('description', { required: 'Description is required' })}
            placeholder="e.g. Diesel fuel for excavator"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
          {errors.description ? (
            <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Amount (ex GST) *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                {...register('amount', { required: 'Amount is required' })}
                placeholder="0.00"
                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-7 pr-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 flex items-center justify-between text-sm font-medium text-slate-700">
              GST Amount
              <button
                type="button"
                onClick={handleAutoGst}
                className="text-xs font-normal text-blue-600 hover:text-blue-700"
              >
                Auto-calc (÷11)
              </button>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                {...register('gst_amount')}
                placeholder="0.00"
                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-7 pr-3 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Vendor / Supplier</label>
          <input
            type="text"
            {...register('vendor')}
            placeholder="e.g. United Petroleum"
            className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Notes</label>
          <textarea
            {...register('notes')}
            rows={2}
            placeholder="Optional notes…"
            className="w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Receipt</label>
          <div className="flex items-center gap-2">
            <label className={cn(
              'flex flex-1 cursor-pointer items-center gap-2 rounded-xl border border-dashed px-4 py-2.5 text-sm transition-colors',
              receiptFile
                ? 'border-blue-300 bg-blue-50 text-blue-700'
                : 'border-slate-300 text-slate-500 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600',
            )}>
              {receiptFile ? (
                <Paperclip className="size-4 shrink-0" />
              ) : (
                <Upload className="size-4 shrink-0" />
              )}
              <span className="truncate">
                {receiptFile ? receiptFile.name : 'Upload receipt (image or PDF)'}
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                className="sr-only"
                onChange={(e) => setReceiptFile(e.target.files?.[0] ?? null)}
              />
            </label>
            {receiptFile ? (
              <button
                type="button"
                onClick={clearReceipt}
                className="rounded-lg p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                title="Remove receipt"
              >
                <X className="size-4" />
              </button>
            ) : null}
          </div>
          <p className="mt-1 text-xs text-slate-400">Attach a photo or PDF of the receipt for your records</p>
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading || uploading}>
            <Plus className="size-4" />
            Add Expense
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// Mini bar chart using CSS
function BarChart({ data }: { data: { month: string; revenue: number; expenses: number }[] }) {
  const maxVal = Math.max(...data.flatMap((d) => [d.revenue, d.expenses]), 1);

  return (
    <div className="flex items-end gap-2 h-40">
      {data.map((d) => {
        const revH = Math.max((d.revenue / maxVal) * 100, 2);
        const expH = Math.max((d.expenses / maxVal) * 100, 2);
        const label = format(new Date(d.month + '-01'), 'MMM');
        return (
          <div key={d.month} className="flex flex-1 flex-col items-center gap-1.5">
            <div className="flex w-full items-end gap-0.5" style={{ height: '128px' }}>
              <div
                className="flex-1 rounded-t-md bg-emerald-400 transition-all duration-500"
                style={{ height: `${revH}%` }}
                title={`Revenue: ${formatCurrency(d.revenue)}`}
              />
              <div
                className="flex-1 rounded-t-md bg-red-400 transition-all duration-500"
                style={{ height: `${expH}%` }}
                title={`Expenses: ${formatCurrency(d.expenses)}`}
              />
            </div>
            <span className="text-[10px] text-slate-400">{label}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function AccountingPage() {
  const { profile } = useAuth();
  const [tab, setTab] = useState<TabId>('overview');
  const [period, setPeriod] = useState<PeriodKey>('this_month');
  const [customFrom, setCustomFrom] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [customTo, setCustomTo] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [categoryFilter, setCategoryFilter] = useState('');
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);

  const [dateFrom, dateTo] = getPeriodDates(period, customFrom, customTo);
  const dateFromStr = format(dateFrom, 'yyyy-MM-dd');
  const dateToStr = format(dateTo, 'yyyy-MM-dd');

  const { expensesQuery, upsertMutation, deleteMutation } = useExpenses({
    category: categoryFilter || undefined,
    dateFrom: dateFromStr,
    dateTo: dateToStr,
  });

  const summaryQuery = useAccountingSummary(dateFromStr, dateToStr);
  const { invoicesQuery } = useInvoices('paid');

  const summary = summaryQuery.data;
  const expenses = expensesQuery.data ?? [];

  // Paid invoices in period
  const paidInvoices = useMemo(
    () =>
      (invoicesQuery.data ?? []).filter((inv) => {
        const d = inv.paid_date ?? inv.issue_date;
        return d >= dateFromStr && d <= dateToStr;
      }),
    [invoicesQuery.data, dateFromStr, dateToStr],
  );

  // Expenses grouped by category
  const expensesByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach((e) => {
      map[e.category] = (map[e.category] ?? 0) + e.amount;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [expenses]);

  const handleSaveExpense = async (data: Partial<Expense>) => {
    if (!profile?.company_id) return;
    try {
      await upsertMutation.mutateAsync({
        ...data,
        company_id: profile.company_id,
        created_by: profile.id,
      });
      toast.success('Expense saved');
      setExpenseModalOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save expense');
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm('Delete this expense?')) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success('Expense deleted');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete expense');
    }
  };

  const PERIODS: { key: PeriodKey; label: string }[] = [
    { key: 'this_month', label: 'This Month' },
    { key: 'last_month', label: 'Last Month' },
    { key: 'this_quarter', label: 'This Quarter' },
    { key: 'this_year', label: 'This Year' },
    { key: 'custom', label: 'Custom' },
  ];

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Accounting</h2>
          <p className="text-sm text-slate-500">Track income, expenses, and financial reports</p>
        </div>
        <Button onClick={() => setExpenseModalOpen(true)}>
          <Plus className="size-4" />
          Add Expense
        </Button>
      </div>

      {/* Period selector */}
      <Card variant="flat" className="flex flex-wrap items-center gap-2 py-3">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={cn(
              'rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
              period === p.key
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100',
            )}
          >
            {p.label}
          </button>
        ))}
        {period === 'custom' ? (
          <div className="flex items-center gap-2 ml-2">
            <input
              type="date"
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
              className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
            />
            <span className="text-xs text-slate-400">to</span>
            <input
              type="date"
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
              className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs"
            />
          </div>
        ) : null}
        <span className="ml-auto text-xs text-slate-400">
          {formatDate(dateFromStr)} – {formatDate(dateToStr)}
        </span>
      </Card>

      {/* Tab navigation */}
      <div className="flex gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm w-fit">
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all',
                tab === t.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50',
              )}
            >
              <Icon className="size-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ── Overview Tab ── */}
      {tab === 'overview' ? (
        <div className="space-y-5 animate-fade-in-up">
          {/* KPI cards */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              {
                label: 'Total Revenue',
                value: summary?.totalRevenue,
                icon: TrendingUp,
                accent: 'stat-emerald',
                iconColor: 'text-emerald-600',
                bg: 'bg-emerald-50',
                sub: 'From paid invoices',
              },
              {
                label: 'Total Expenses',
                value: summary?.totalExpenses,
                icon: TrendingDown,
                accent: 'stat-red',
                iconColor: 'text-red-600',
                bg: 'bg-red-50',
                sub: 'All business costs',
              },
              {
                label: 'Net Profit',
                value: summary?.netProfit,
                icon: DollarSign,
                accent: (summary?.netProfit ?? 0) >= 0 ? 'stat-emerald' : 'stat-red',
                iconColor: (summary?.netProfit ?? 0) >= 0 ? 'text-emerald-600' : 'text-red-600',
                bg: (summary?.netProfit ?? 0) >= 0 ? 'bg-emerald-50' : 'bg-red-50',
                sub: 'Revenue minus expenses',
              },
              {
                label: 'GST Payable',
                value: summary?.netGstPayable,
                icon: Calculator,
                accent: 'stat-violet',
                iconColor: 'text-violet-600',
                bg: 'bg-violet-50',
                sub: 'GST collected – GST paid',
              },
            ].map((kpi) => {
              const Icon = kpi.icon;
              return (
                <div key={kpi.label} className={`rounded-2xl border border-slate-200/80 p-5 shadow-sm ${kpi.accent}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-600">{kpi.label}</p>
                      {summaryQuery.isLoading ? (
                        <Skeleton className="mt-2 h-8 w-28 rounded-lg" />
                      ) : (
                        <p className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900">
                          {formatCurrency(kpi.value ?? 0)}
                        </p>
                      )}
                      <p className="mt-0.5 text-xs text-slate-400">{kpi.sub}</p>
                    </div>
                    <div className={`rounded-xl p-2.5 ${kpi.bg}`}>
                      <Icon className={`size-5 ${kpi.iconColor}`} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Revenue vs Expenses chart */}
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-semibold text-slate-900">Revenue vs Expenses (Last 6 months)</h3>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-emerald-400 inline-block" />Revenue</span>
                  <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-red-400 inline-block" />Expenses</span>
                </div>
              </div>
              {summaryQuery.isLoading ? (
                <Skeleton className="h-40 rounded-xl" />
              ) : (
                <BarChart data={summary?.revenueByMonth ?? []} />
              )}
            </Card>

            <Card>
              <h3 className="mb-4 font-semibold text-slate-900">Expenses by Category</h3>
              {expensesByCategory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <TrendingDown className="size-8 text-slate-200" />
                  <p className="mt-2 text-sm text-slate-400">No expenses in this period</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {expensesByCategory.slice(0, 6).map(([cat, total]) => {
                    const maxExp = expensesByCategory[0]?.[1] ?? 1;
                    const pct = Math.round((total / maxExp) * 100);
                    return (
                      <div key={cat}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-700 font-medium truncate max-w-[60%]">{cat}</span>
                          <span className="text-slate-500">{formatCurrency(total)}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-red-400 transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>

          {/* Recent transactions */}
          <Card>
            <h3 className="mb-4 font-semibold text-slate-900">Recent Transactions</h3>
            <div className="space-y-2">
              {[
                ...paidInvoices.slice(0, 5).map((inv) => ({
                  type: 'income' as const,
                  date: inv.paid_date ?? inv.issue_date,
                  description: `Invoice ${inv.invoice_number}`,
                  party: inv.customers?.name ?? '—',
                  amount: inv.subtotal,
                })),
                ...(expensesQuery.data ?? []).slice(0, 5).map((exp) => ({
                  type: 'expense' as const,
                  date: exp.date,
                  description: exp.description,
                  party: exp.vendor ?? exp.category,
                  amount: exp.amount,
                })),
              ]
                .sort((a, b) => b.date.localeCompare(a.date))
                .slice(0, 8)
                .map((txn, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 px-4 py-3"
                  >
                    <div
                      className={cn(
                        'flex size-8 shrink-0 items-center justify-center rounded-full',
                        txn.type === 'income' ? 'bg-emerald-100' : 'bg-red-100',
                      )}
                    >
                      {txn.type === 'income' ? (
                        <TrendingUp className="size-4 text-emerald-600" />
                      ) : (
                        <TrendingDown className="size-4 text-red-600" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900">{txn.description}</p>
                      <p className="truncate text-xs text-slate-400">{txn.party}</p>
                    </div>
                    <div className="text-right">
                      <p
                        className={cn(
                          'text-sm font-semibold',
                          txn.type === 'income' ? 'text-emerald-600' : 'text-red-600',
                        )}
                      >
                        {txn.type === 'income' ? '+' : '-'}{formatCurrency(txn.amount)}
                      </p>
                      <p className="text-xs text-slate-400">{formatDate(txn.date)}</p>
                    </div>
                  </div>
                ))}
              {paidInvoices.length === 0 && expenses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Receipt className="size-8 text-slate-200" />
                  <p className="mt-2 text-sm text-slate-400">No transactions in this period</p>
                </div>
              ) : null}
            </div>
          </Card>
        </div>
      ) : null}

      {/* ── Expenses Tab ── */}
      {tab === 'expenses' ? (
        <div className="space-y-4 animate-fade-in-up">
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="">All categories</option>
              {EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <span className="text-sm text-slate-400">
              {expenses.length} expense{expenses.length !== 1 ? 's' : ''} ·{' '}
              {formatCurrency(expenses.reduce((s, e) => s + e.amount, 0))} total
            </span>
          </div>

          <Card className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Description</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Vendor</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Receipt</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Amount</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">GST</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Total</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {expensesQuery.isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i} className="border-b border-slate-50">
                        <td colSpan={9} className="px-4 py-3">
                          <Skeleton className="h-6 w-full rounded" />
                        </td>
                      </tr>
                    ))
                  ) : expenses.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-4 py-12 text-center">
                        <TrendingDown className="mx-auto size-8 text-slate-200" />
                        <p className="mt-2 text-sm text-slate-400">No expenses for this period</p>
                        <button
                          onClick={() => setExpenseModalOpen(true)}
                          className="mt-3 text-sm font-medium text-blue-600 hover:text-blue-700"
                        >
                          + Add first expense
                        </button>
                      </td>
                    </tr>
                  ) : (
                    expenses.map((expense) => (
                      <tr key={expense.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 text-slate-600">{formatDate(expense.date)}</td>
                        <td className="px-4 py-3">
                          <span className={cn(
                            'rounded-full px-2 py-0.5 text-xs font-medium',
                            CATEGORY_COLORS[expense.category] ?? 'bg-slate-100 text-slate-600',
                          )}>
                            {expense.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-900">{expense.description}</td>
                        <td className="px-4 py-3 text-slate-500">{expense.vendor ?? '—'}</td>
                        <td className="px-4 py-3">
                          {expense.receipt_url ? (
                            <a
                              href={expense.receipt_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors"
                            >
                              <Paperclip className="size-3" />
                              View
                            </a>
                          ) : (
                            <span className="text-slate-300 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-slate-900">{formatCurrency(expense.amount)}</td>
                        <td className="px-4 py-3 text-right text-slate-500">{formatCurrency(expense.gst_amount)}</td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-900">
                          {formatCurrency(expense.amount + expense.gst_amount)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => void handleDeleteExpense(expense.id)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                            title="Delete expense"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {expenses.length > 0 ? (
                  <tfoot>
                    <tr className="bg-slate-50 border-t-2 border-slate-200">
                      <td colSpan={5} className="px-4 py-3 text-sm font-semibold text-slate-700">Total</td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900">
                        {formatCurrency(expenses.reduce((s, e) => s + e.amount, 0))}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-700">
                        {formatCurrency(expenses.reduce((s, e) => s + e.gst_amount, 0))}
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900">
                        {formatCurrency(expenses.reduce((s, e) => s + e.amount + e.gst_amount, 0))}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                ) : null}
              </table>
            </div>
          </Card>
        </div>
      ) : null}

      {/* ── P&L Report Tab ── */}
      {tab === 'reports' ? (
        <div className="space-y-4 animate-fade-in-up">
          <div className="flex justify-end no-print">
            <Button variant="secondary" onClick={() => window.print()}>
              <Printer className="size-4" />
              Print Report
            </Button>
          </div>

          {/* Report header */}
          <Card className="print-surface">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Profit & Loss Statement</h3>
                <p className="text-sm text-slate-500">
                  {formatDate(dateFromStr)} – {formatDate(dateToStr)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-slate-900">{formatCurrency(summary?.netProfit ?? 0)}</p>
                <p className="text-xs text-slate-400">Net profit</p>
              </div>
            </div>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Income section */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-slate-900">Income</h4>
                <span className="text-sm font-bold text-emerald-600">{formatCurrency(summary?.totalRevenue ?? 0)}</span>
              </div>
              <div className="space-y-2">
                {paidInvoices.length === 0 ? (
                  <p className="text-sm text-slate-400">No income in this period</p>
                ) : (
                  <>
                    {paidInvoices.slice(0, 10).map((inv) => (
                      <div key={inv.id} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
                        <div>
                          <p className="text-sm font-medium text-slate-700">{inv.invoice_number}</p>
                          <p className="text-xs text-slate-400">{inv.customers?.name}</p>
                        </div>
                        <p className="text-sm font-semibold text-emerald-600">{formatCurrency(inv.subtotal)}</p>
                      </div>
                    ))}
                    {paidInvoices.length > 10 ? (
                      <p className="text-xs text-slate-400 pt-1">+{paidInvoices.length - 10} more invoices</p>
                    ) : null}
                    <div className="flex justify-between pt-3 border-t-2 border-slate-200">
                      <span className="text-sm font-bold text-slate-900">Total Income</span>
                      <span className="text-sm font-bold text-emerald-600">{formatCurrency(summary?.totalRevenue ?? 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-slate-500">GST Collected</span>
                      <span className="text-xs text-slate-600">{formatCurrency(summary?.totalGstCollected ?? 0)}</span>
                    </div>
                  </>
                )}
              </div>
            </Card>

            {/* Expenses section */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-slate-900">Expenses</h4>
                <span className="text-sm font-bold text-red-600">{formatCurrency(summary?.totalExpenses ?? 0)}</span>
              </div>
              <div className="space-y-2">
                {expensesByCategory.length === 0 ? (
                  <p className="text-sm text-slate-400">No expenses in this period</p>
                ) : (
                  <>
                    {expensesByCategory.map(([cat, total]) => (
                      <div key={cat} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
                        <p className="text-sm text-slate-700">{cat}</p>
                        <p className="text-sm font-semibold text-red-600">{formatCurrency(total)}</p>
                      </div>
                    ))}
                    <div className="flex justify-between pt-3 border-t-2 border-slate-200">
                      <span className="text-sm font-bold text-slate-900">Total Expenses</span>
                      <span className="text-sm font-bold text-red-600">{formatCurrency(summary?.totalExpenses ?? 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs text-slate-500">GST Paid</span>
                      <span className="text-xs text-slate-600">{formatCurrency(summary?.totalGstPaid ?? 0)}</span>
                    </div>
                  </>
                )}
              </div>
            </Card>
          </div>

          {/* GST Summary */}
          <Card>
            <h4 className="mb-4 font-semibold text-slate-900">GST Summary (BAS Helper)</h4>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: 'GST Collected', value: summary?.totalGstCollected ?? 0, color: 'text-emerald-600', bg: 'bg-emerald-50', sub: 'From paid invoices' },
                { label: 'GST Paid (Input credits)', value: summary?.totalGstPaid ?? 0, color: 'text-red-600', bg: 'bg-red-50', sub: 'From business expenses' },
                { label: 'Net GST Payable', value: summary?.netGstPayable ?? 0, color: 'text-blue-600', bg: 'bg-blue-50', sub: 'To be remitted to ATO' },
              ].map((row) => (
                <div key={row.label} className={`rounded-xl p-4 ${row.bg}`}>
                  <p className="text-xs font-medium text-slate-600">{row.label}</p>
                  <p className={`mt-1.5 text-xl font-bold ${row.color}`}>{formatCurrency(row.value)}</p>
                  <p className="mt-0.5 text-[11px] text-slate-400">{row.sub}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 border border-amber-100 px-4 py-3">
              <AlertCircle className="size-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">
                This is a guide only. Please consult your accountant for official BAS lodgement. GST figures are based on the data entered in Hasky.
              </p>
            </div>
          </Card>
        </div>
      ) : null}

      {/* Expense form modal */}
      <ExpenseFormModal
        open={expenseModalOpen}
        onClose={() => setExpenseModalOpen(false)}
        onSave={handleSaveExpense}
        loading={upsertMutation.isPending}
        companyId={profile?.company_id ?? ''}
      />

    </div>
  );
}
