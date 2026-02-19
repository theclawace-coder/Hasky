import { useMemo } from 'react';
import { format } from 'date-fns';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Truck,
  CircleCheck,
  Wrench,
  HandCoins,
  Receipt,
  Wallet,
  TrendingUp,
  Plus,
  CalendarRange,
  ArrowRight,
  FileText,
  AlertTriangle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../hooks/useAuth';
import { getDashboardStats, getBookings, getAttentionItems } from '../services/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { StatusBadge } from '../components/ui/StatusBadge';
import { formatCurrency, formatDate } from '../lib/utils';

/* ── Animation variants ───────────────────────────────────────── */
const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const item = {
  hidden:  { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] as number[] } },
};

/* ── Data ─────────────────────────────────────────────────────── */
const fleetStatCards = [
  { key: 'totalMachines' as const, label: 'Total Machines', icon: Truck,        accent: 'stat-blue',   iconColor: 'text-blue-500',    bg: 'rgba(239,246,255,0.8)' },
  { key: 'onHire'        as const, label: 'On Hire',        icon: HandCoins,     accent: 'stat-amber',  iconColor: 'text-amber-500',   bg: 'rgba(255,251,235,0.8)' },
  { key: 'available'     as const, label: 'Available',      icon: CircleCheck,   accent: 'stat-emerald',iconColor: 'text-emerald-500', bg: 'rgba(236,253,245,0.8)' },
  { key: 'underRepair'   as const, label: 'Under Repair',   icon: Wrench,        accent: 'stat-red',    iconColor: 'text-red-500',     bg: 'rgba(254,242,242,0.8)' },
];

export default function Dashboard() {
  const { profile } = useAuth();

  const statsQuery   = useQuery({ queryKey: ['dashboard_stats'], queryFn: getDashboardStats });
  const upcomingQuery = useQuery({
    queryKey: ['bookings', 'upcoming'],
    queryFn: () => getBookings({ dateFrom: new Date().toISOString().split('T')[0] }),
  });
  const attentionQuery = useQuery({ queryKey: ['attention_items'], queryFn: getAttentionItems });

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const stats            = statsQuery.data;
  const available        = stats?.available    ?? 0;
  const onHire           = stats?.onHire       ?? 0;
  const repair           = stats?.underRepair  ?? 0;
  const total            = Math.max(available + onHire + repair, 1);
  const hireRate         = Math.round((onHire / total) * 100);
  const overdueInvoices  = attentionQuery.data?.overdueInvoices ?? [];
  const expiringQuotes   = attentionQuery.data?.expiringQuotes  ?? [];
  const hasAttentionItems= overdueInvoices.length > 0 || expiringQuotes.length > 0;
  const upcomingBookings = (upcomingQuery.data ?? []).slice(0, 6);

  return (
    <motion.div
      className="space-y-5"
      variants={container}
      initial="hidden"
      animate="visible"
    >
      {/* ── Hero section ──────────────────────────────────────── */}
      <motion.div variants={item}>
        <div
          className="relative overflow-hidden rounded-3xl p-6 lg:p-8"
          style={{
            background: 'linear-gradient(135deg, rgba(192,132,252,0.14) 0%, rgba(129,140,248,0.10) 50%, rgba(56,189,248,0.09) 100%)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.70)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.9)',
          }}
        >
          {/* Date */}
          <p className="text-sm font-medium text-slate-400">{format(new Date(), 'EEEE, dd MMMM yyyy')}</p>

          {/* Greeting */}
          <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900 lg:text-4xl">
            {greeting},{' '}
            <span className="gradient-text">
              {profile?.full_name?.split(' ')[0] ?? 'there'}
            </span>{' '}
            👋
          </h2>

          {/* Revenue hero line */}
          <div className="mt-3 flex flex-wrap items-baseline gap-2">
            <p className="text-base text-slate-500">You've collected</p>
            {statsQuery.isLoading ? (
              <Skeleton className="h-9 w-32 rounded-xl" />
            ) : (
              <span
                className="text-4xl font-black tracking-tight"
                style={{
                  background: 'linear-gradient(135deg, #8b5cf6, #38bdf8)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {formatCurrency(stats?.paidThisMonth ?? 0)}
              </span>
            )}
            <p className="text-base text-slate-500">this month</p>
          </div>

          {/* Quick insight pill */}
          {!statsQuery.isLoading && (stats?.paidThisMonth ?? 0) > 0 && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-100/80 px-3.5 py-1.5 text-sm font-semibold text-emerald-700 shadow-sm">
              <Sparkles className="size-3.5 text-emerald-500" />
              {hireRate}% of fleet on hire this month
            </div>
          )}

          {/* Decorative gradient orb */}
          <div
            className="pointer-events-none absolute right-0 top-0 size-72 rounded-full opacity-20 blur-3xl"
            style={{ background: 'linear-gradient(135deg, #c084fc, #38bdf8)' }}
          />
        </div>
      </motion.div>

      {/* ── Quick Actions ──────────────────────────────────────── */}
      <motion.div variants={item}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {/* New Job */}
          <Link
            to="/bookings/new"
            className="group relative overflow-hidden flex items-center gap-4 rounded-2xl px-5 py-4 text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 50%, #5b21b6 100%)',
              boxShadow: '0 8px 24px rgba(124,58,237,0.35)',
            }}
          >
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/15 transition-all group-hover:bg-white/22">
              <Plus className="size-6" />
            </div>
            <div>
              <p className="text-base font-bold">New Job</p>
              <p className="text-xs text-violet-200">Start a hire booking</p>
            </div>
            <div className="pointer-events-none absolute right-0 top-0 size-24 rounded-full bg-white/5 blur-2xl" />
          </Link>

          {/* New Quote */}
          <Link
            to="/quotes"
            className="group relative overflow-hidden flex items-center gap-4 rounded-2xl px-5 py-4 text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 50%, #075985 100%)',
              boxShadow: '0 8px 24px rgba(2,132,199,0.35)',
            }}
          >
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/15 transition-all group-hover:bg-white/22">
              <FileText className="size-6" />
            </div>
            <div>
              <p className="text-base font-bold">New Quote</p>
              <p className="text-xs text-sky-200">Send a price to a client</p>
            </div>
            <div className="pointer-events-none absolute right-0 top-0 size-24 rounded-full bg-white/5 blur-2xl" />
          </Link>

          {/* New Invoice */}
          <Link
            to="/invoices"
            className="group relative overflow-hidden flex items-center gap-4 rounded-2xl px-5 py-4 text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 50%, #9a3412 100%)',
              boxShadow: '0 8px 24px rgba(234,88,12,0.35)',
            }}
          >
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white/15 transition-all group-hover:bg-white/22">
              <Receipt className="size-6" />
            </div>
            <div>
              <p className="text-base font-bold">New Invoice</p>
              <p className="text-xs text-orange-200">Bill a customer</p>
            </div>
            <div className="pointer-events-none absolute right-0 top-0 size-24 rounded-full bg-white/5 blur-2xl" />
          </Link>
        </div>
      </motion.div>

      {/* ── Needs Attention ─────────────────────────────────────── */}
      {hasAttentionItems && (
        <motion.div variants={item}>
          <div
            className="rounded-2xl border p-4 space-y-3"
            style={{
              background: 'rgba(254,242,242,0.80)',
              backdropFilter: 'blur(12px)',
              borderColor: 'rgba(239,68,68,0.20)',
              boxShadow: '0 4px 16px rgba(239,68,68,0.08)',
            }}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="size-5 text-red-500 shrink-0" />
              <h3 className="font-bold text-red-800">Needs your attention</h3>
              <span className="ml-auto rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white shadow-sm">
                {overdueInvoices.length + expiringQuotes.length}
              </span>
            </div>
            <div className="space-y-2">
              {overdueInvoices.map((inv) => (
                <Link
                  key={inv.id}
                  to={`/invoices/${inv.id}`}
                  className="flex items-center justify-between gap-3 rounded-xl border border-red-100 bg-white/70 px-4 py-2.5 transition-all hover:bg-red-50/80 hover:-translate-y-px hover:shadow-sm backdrop-blur-sm"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-red-100">
                      <Receipt className="size-3.5 text-red-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        Invoice overdue — {inv.customers?.name ?? 'Unknown'}
                      </p>
                      <p className="text-xs text-red-500">Due {inv.due_date}</p>
                    </div>
                  </div>
                  <span className="shrink-0 text-sm font-bold text-red-700">{formatCurrency(inv.total)}</span>
                </Link>
              ))}
              {expiringQuotes.map((q) => (
                <Link
                  key={q.id}
                  to="/quotes"
                  className="flex items-center justify-between gap-3 rounded-xl border border-amber-100 bg-white/70 px-4 py-2.5 transition-all hover:bg-amber-50/80 hover:-translate-y-px hover:shadow-sm backdrop-blur-sm"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-amber-100">
                      <Clock className="size-3.5 text-amber-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        Quote expiring — {q.customers?.name ?? 'Unknown'}
                      </p>
                      <p className="text-xs text-amber-600">Expires {q.expiry_date}</p>
                    </div>
                  </div>
                  <span className="shrink-0 text-sm font-bold text-amber-700">{formatCurrency(q.total)}</span>
                </Link>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Fleet Stats ─────────────────────────────────────────── */}
      <motion.div variants={item}>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {fleetStatCards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.key}
                className={`rounded-2xl border border-white/60 p-5 ${card.accent} backdrop-blur-md shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">{card.label}</p>
                    {statsQuery.isLoading ? (
                      <Skeleton className="mt-2 h-9 w-16 rounded-lg" />
                    ) : (
                      <p className="mt-1.5 text-3xl font-black tracking-tight text-slate-900">
                        {stats?.[card.key] ?? 0}
                      </p>
                    )}
                  </div>
                  <div
                    className="rounded-xl p-2.5"
                    style={{ background: card.bg }}
                  >
                    <Icon className={`size-5 ${card.iconColor}`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* ── Revenue Stats ────────────────────────────────────────── */}
      <motion.div variants={item}>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { label: 'Invoiced This Month', key: 'invoicedThisMonth' as const, icon: Receipt,    accent: 'stat-indigo', iconColor: 'text-indigo-500' },
            { label: 'Outstanding',          key: 'outstanding'      as const, icon: Wallet,     accent: 'stat-amber',  iconColor: 'text-amber-500'  },
            { label: 'Paid This Month',      key: 'paidThisMonth'    as const, icon: TrendingUp, accent: 'stat-emerald',iconColor: 'text-emerald-500' },
          ].map(({ label, key, icon: Icon, accent, iconColor }) => (
            <div key={key} className={`rounded-2xl border border-white/60 p-5 ${accent} backdrop-blur-md shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md`}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-600">{label}</p>
                <Icon className={`size-4 ${iconColor}`} />
              </div>
              {statsQuery.isLoading ? (
                <Skeleton className="mt-3 h-7 w-28 rounded-lg" />
              ) : (
                <p className="mt-2 text-2xl font-black tracking-tight text-slate-900">
                  {formatCurrency(stats?.[key] ?? 0)}
                </p>
              )}
              <p className="mt-1 text-xs text-slate-400">
                {key === 'invoicedThisMonth' ? 'Total invoices raised' : key === 'outstanding' ? 'Unpaid invoices' : 'Revenue collected'}
              </p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Fleet Utilisation + Upcoming Bookings ───────────────── */}
      <motion.div variants={item}>
        <div className="grid gap-4 lg:grid-cols-5">
          {/* Utilisation */}
          <Card className="lg:col-span-2">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900">Fleet Utilisation</h3>
              <span
                className="rounded-full px-2.5 py-1 text-xs font-bold"
                style={{ background: 'rgba(245,158,11,0.12)', color: '#92400e' }}
              >
                {hireRate}% on hire
              </span>
            </div>

            {/* Stacked bar */}
            <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100/80">
              <div className="flex h-full">
                <div
                  className="rounded-l-full bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-700"
                  style={{ width: `${(available / total) * 100}%` }}
                />
                <div
                  className="bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-700"
                  style={{ width: `${(onHire / total) * 100}%` }}
                />
                <div
                  className="rounded-r-full bg-gradient-to-r from-red-400 to-red-500 transition-all duration-700"
                  style={{ width: `${(repair / total) * 100}%` }}
                />
              </div>
            </div>

            <div className="mt-4 space-y-2.5">
              {[
                { label: 'Available',     count: available, color: 'bg-emerald-500', textColor: 'text-emerald-700', bg: 'bg-emerald-50/80' },
                { label: 'On Hire',       count: onHire,    color: 'bg-amber-500',   textColor: 'text-amber-700',   bg: 'bg-amber-50/80'   },
                { label: 'Under Repair',  count: repair,    color: 'bg-red-400',     textColor: 'text-red-700',     bg: 'bg-red-50/80'     },
              ].map((r) => (
                <div key={r.label} className={`flex items-center justify-between rounded-xl px-3 py-2 ${r.bg}`}>
                  <div className="flex items-center gap-2">
                    <div className={`size-2.5 rounded-full ${r.color}`} />
                    <span className="text-sm font-medium text-slate-700">{r.label}</span>
                  </div>
                  <span className={`text-sm font-bold ${r.textColor}`}>{r.count}</span>
                </div>
              ))}
            </div>

            <Link
              to="/fleet"
              className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-violet-600 hover:text-violet-700"
            >
              View fleet <ArrowRight className="size-3" />
            </Link>
          </Card>

          {/* Upcoming Bookings */}
          <Card className="lg:col-span-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarRange className="size-4 text-violet-500" />
                <h3 className="font-bold text-slate-900">Upcoming Jobs</h3>
              </div>
              <Link
                to="/bookings"
                className="inline-flex items-center gap-1 text-xs font-semibold text-violet-600 hover:text-violet-700"
              >
                View all <ArrowRight className="size-3" />
              </Link>
            </div>

            <div className="mt-4 space-y-2">
              {upcomingQuery.isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 rounded-xl" />
                ))
              ) : upcomingBookings.length ? (
                upcomingBookings.map((booking) => (
                  <Link
                    key={booking.id}
                    to={`/bookings/${booking.id}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-white/50 bg-white/50 px-4 py-3 backdrop-blur-sm transition-all hover:bg-white/80 hover:-translate-y-px hover:shadow-sm"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {booking.machines?.name ?? 'Unknown Machine'}
                      </p>
                      <p className="truncate text-xs text-slate-500">
                        {booking.customers?.name ?? 'Unknown Customer'}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs text-slate-400">{formatDate(booking.start_date)}</p>
                    </div>
                    <StatusBadge status={booking.status} />
                  </Link>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CalendarRange className="size-8 text-violet-200" />
                  <p className="mt-2 text-sm font-semibold text-slate-500">No upcoming bookings</p>
                  <p className="mt-0.5 text-xs text-slate-400">Create your first job to get started</p>
                  <Link to="/bookings/new" className="mt-4">
                    <Button size="sm">
                      <Plus className="size-3.5" />
                      Create Job
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </Card>
        </div>
      </motion.div>
    </motion.div>
  );
}
