import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { LandingLayout } from '../../components/landing/LandingLayout';
import { ctaBtnClass, ctaBtnStyle } from '../../components/landing/ctaStyles';
import { LogoMark } from '../../components/ui/Logo';

// ── Shared App Chrome ────────────────────────────────────────────────────────

function AppChrome({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="overflow-hidden rounded-2xl"
      style={{
        boxShadow: '0 24px 80px rgba(100,60,180,0.14), 0 4px 24px rgba(0,0,0,0.08)',
        border: '1px solid rgba(255,255,255,0.70)',
      }}
    >
      <div
        className="flex h-9 items-center gap-2 px-4"
        style={{
          background: 'rgba(240,234,255,0.85)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(200,180,240,0.30)',
        }}
      >
        <div className="size-3 rounded-full bg-[#FF5F57]" />
        <div className="size-3 rounded-full bg-[#FEBC2E]" />
        <div className="size-3 rounded-full bg-[#28C840]" />
      </div>
      {children}
    </div>
  );
}

const glassBg = 'linear-gradient(160deg,#fdf4ff 0%,#f5f3ff 40%,#f0f9ff 100%)';
const glassCard: React.CSSProperties = {
  background: 'rgba(255,255,255,0.82)',
  border: '1px solid rgba(255,255,255,0.72)',
  boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
};

// ── Fleet Screenshot ─────────────────────────────────────────────────────────

function FleetScreenshot() {
  const machines = [
    { name: 'Bobcat S650', type: 'Skid Steer · 2022', rate: '$480/day', status: 'Available', stripColor: '#10b981', badgeStyle: { background: '#ecfdf5', color: '#065f46' } },
    { name: '20T Excavator', type: 'Komatsu PC200 · 2021', rate: '$1,200/day', status: 'On Hire', stripColor: '#8b5cf6', badgeStyle: { background: '#f5f3ff', color: '#5b21b6' } },
    { name: '8T Tipper', type: 'Hino 500 · 2023', rate: '$850/day', status: 'Available', stripColor: '#10b981', badgeStyle: { background: '#ecfdf5', color: '#065f46' } },
    { name: 'Telehandler', type: 'JLG 4017RS · 2020', rate: '$720/day', status: 'Service Due', stripColor: '#f59e0b', badgeStyle: { background: '#fffbeb', color: '#92400e' } },
    { name: 'Water Cart 5000L', type: 'Custom · 2021', rate: '$380/day', status: 'Available', stripColor: '#10b981', badgeStyle: { background: '#ecfdf5', color: '#065f46' } },
    { name: 'Roller 14T', type: 'Dynapac CA4000 · 2019', rate: '$680/day', status: 'In Transit', stripColor: '#38bdf8', badgeStyle: { background: '#e0f2fe', color: '#0369a1' } },
  ];
  return (
    <AppChrome>
      <div style={{ background: glassBg, padding: '16px' }}>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-800">Fleet</p>
          <div className="flex gap-1.5">
            <div className="rounded-lg px-2 py-1 text-[10px] text-slate-500" style={{ background: 'rgba(255,255,255,0.80)', border: '1px solid rgba(200,180,240,0.35)' }}>Grid</div>
            <div className="rounded-lg px-2 py-1 text-[10px] font-semibold text-violet-700" style={{ background: 'rgba(245,243,255,0.90)', border: '1px solid rgba(139,92,246,0.25)' }}>+ Add Machine</div>
          </div>
        </div>
        <div className="mb-3 flex gap-2 rounded-xl p-2.5" style={{ background: 'rgba(255,255,255,0.72)', border: '1px solid rgba(255,255,255,0.65)', backdropFilter: 'blur(8px)' }}>
          <div className="flex-1 rounded-lg px-2 py-1 text-[10px] text-slate-400" style={{ background: 'rgba(245,243,255,0.70)' }}>Search machines…</div>
          <div className="rounded-lg px-2 py-1 text-[10px] text-slate-500" style={{ border: '1px solid rgba(200,180,240,0.30)', background: 'rgba(255,255,255,0.80)' }}>All categories</div>
          <div className="rounded-lg px-2 py-1 text-[10px] text-slate-500" style={{ border: '1px solid rgba(200,180,240,0.30)', background: 'rgba(255,255,255,0.80)' }}>All statuses</div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {machines.map((m) => (
            <div key={m.name} className="overflow-hidden rounded-2xl" style={{ background: 'rgba(255,255,255,0.82)', border: '1px solid rgba(255,255,255,0.72)', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
              <div className="h-1" style={{ background: m.stripColor }} />
              <div className="p-2.5">
                <p className="text-[11px] font-bold text-slate-800">{m.name}</p>
                <p className="mb-2 text-[9px] text-slate-400">{m.type}</p>
                <div className="flex items-center justify-between">
                  <span className="rounded-full px-1.5 py-0.5 text-[8px] font-bold" style={m.badgeStyle}>{m.status}</span>
                  <span className="text-[9px] font-semibold text-slate-600">{m.rate}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppChrome>
  );
}

// ── Jobs/Bookings Screenshot ─────────────────────────────────────────────────

function JobsScreenshot() {
  const jobs = [
    { m: 'Bobcat S650', c: 'Smith Constructions', status: 'Active', sc: { background: '#ecfdf5', color: '#065f46' } },
    { m: '20T Excavator', c: 'Hartley Civil', status: 'Complete', sc: { background: '#f8fafc', color: '#64748b' } },
    { m: 'Tipper Truck', c: 'Apex Earthworks', status: 'Upcoming', sc: { background: '#eff6ff', color: '#1d4ed8' } },
    { m: 'Telehandler', c: 'Warwick Landscaping', status: 'Active', sc: { background: '#ecfdf5', color: '#065f46' } },
    { m: 'Water Cart', c: 'Redland Demolition', status: 'Quoted', sc: { background: '#fffbeb', color: '#92400e' } },
  ];
  return (
    <AppChrome>
      <div style={{ background: glassBg, padding: '16px' }}>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-800">Jobs</p>
          <div className="rounded-lg px-2 py-1 text-[10px] font-bold text-white" style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}>+ New Job</div>
        </div>
        <div className="mb-3 grid grid-cols-3 gap-2">
          {[
            { label: 'Active Jobs', val: '8', bg: 'rgba(240,253,250,0.90)', border: '#10b981', t: '#065f46' },
            { label: 'This Month', val: '24', bg: 'rgba(239,246,255,0.90)', border: '#3b82f6', t: '#1d4ed8' },
            { label: 'Revenue MTD', val: '$62k', bg: 'rgba(245,243,255,0.90)', border: '#8b5cf6', t: '#5b21b6' },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl p-2.5" style={{ background: s.bg, borderLeft: `3px solid ${s.border}`, border: '1px solid rgba(255,255,255,0.65)', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              <p className="text-[9px] text-slate-500">{s.label}</p>
              <p className="text-base font-bold" style={{ color: s.t }}>{s.val}</p>
            </div>
          ))}
        </div>
        <div className="overflow-hidden rounded-2xl" style={{ background: 'rgba(255,255,255,0.82)', border: '1px solid rgba(255,255,255,0.70)', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <div className="flex border-b px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-slate-400" style={{ borderColor: 'rgba(200,180,240,0.20)' }}>
            <span className="w-24">Machine</span>
            <span className="flex-1">Customer</span>
            <span className="w-12 text-right">Status</span>
          </div>
          {jobs.map((j) => (
            <div key={j.m + j.c} className="flex items-center gap-2 border-b px-3 py-2 text-[10px]" style={{ borderColor: 'rgba(200,180,240,0.12)' }}>
              <span className="w-24 truncate font-semibold text-slate-800">{j.m}</span>
              <span className="flex-1 truncate text-slate-500">{j.c}</span>
              <span className="shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-bold" style={j.sc}>{j.status}</span>
            </div>
          ))}
        </div>
      </div>
    </AppChrome>
  );
}

// ── CRM Screenshot ───────────────────────────────────────────────────────────

function CRMScreenshot() {
  const customers = [
    { init: 'SC', grad: 'from-violet-500 to-purple-600', name: 'Smith Constructions', abn: 'ABN 12 345 678', loc: 'Sydney NSW', jobs: 12, val: '$84,200' },
    { init: 'HC', grad: 'from-blue-500 to-indigo-600', name: 'Hartley Civil', abn: 'ABN 98 765 432', loc: 'Brisbane QLD', jobs: 8, val: '$62,500' },
    { init: 'AE', grad: 'from-emerald-500 to-teal-600', name: 'Apex Earthworks', abn: 'ABN 55 123 456', loc: 'Melbourne VIC', jobs: 6, val: '$41,800' },
    { init: 'WL', grad: 'from-sky-500 to-cyan-600', name: 'Warwick Landscaping', abn: 'ABN 77 222 333', loc: 'Perth WA', jobs: 4, val: '$28,400' },
    { init: 'RD', grad: 'from-rose-500 to-pink-600', name: 'Redland Demolition', abn: 'ABN 33 444 555', loc: 'Adelaide SA', jobs: 3, val: '$19,600' },
  ];
  return (
    <AppChrome>
      <div style={{ background: glassBg, padding: '16px' }}>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-800">Customers</p>
          <div className="flex items-center gap-2">
            <div className="rounded-lg px-2 py-1 text-[10px] text-slate-400" style={{ background: 'rgba(255,255,255,0.80)', border: '1px solid rgba(200,180,240,0.30)' }}>Search…</div>
            <div className="rounded-lg px-2 py-1 text-[10px] font-bold text-white" style={{ background: 'linear-gradient(135deg,#059669,#0d9488)' }}>+ Add</div>
          </div>
        </div>
        <div className="overflow-hidden rounded-2xl" style={{ background: 'rgba(255,255,255,0.82)', border: '1px solid rgba(255,255,255,0.70)', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          {customers.map((c, i) => (
            <div key={c.name} className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: i < customers.length - 1 ? '1px solid rgba(200,180,240,0.15)' : 'none' }}>
              <div className={`flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${c.grad} text-[10px] font-bold text-white`}>
                {c.init}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-800">{c.name}</p>
                <p className="text-[9px] text-slate-400">{c.abn} · {c.loc} · {c.jobs} jobs</p>
              </div>
              <p className="text-xs font-bold text-violet-600">{c.val}</p>
            </div>
          ))}
        </div>
      </div>
    </AppChrome>
  );
}

// ── Quotes Screenshot ────────────────────────────────────────────────────────

function QuotesScreenshot() {
  return (
    <AppChrome>
      <div style={{ background: glassBg, padding: '16px' }}>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-800">Quotes</p>
          <div className="rounded-lg px-2 py-1 text-[10px] font-bold text-white" style={{ background: 'linear-gradient(135deg,#0284c7,#0369a1)' }}>+ New Quote</div>
        </div>
        <div className="rounded-2xl p-4" style={glassCard}>
          <div className="mb-4 flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-sky-600">QUOTE #0089</p>
              <p className="text-sm font-bold text-slate-900">Apex Earthworks</p>
              <p className="text-[10px] text-slate-500">42 Smith St, Melbourne VIC · ABN 55 123 456</p>
            </div>
            <span className="rounded-full px-2 py-0.5 text-[9px] font-bold" style={{ background: '#e0f2fe', color: '#0369a1' }}>Sent</span>
          </div>
          <div className="mb-3 space-y-1 border-t border-b py-3" style={{ borderColor: 'rgba(200,180,240,0.20)' }}>
            {[
              ['Bobcat S650 — 5 days hire', '$2,400.00'],
              ['Operator (J. Stevens) — 5 days', '$2,250.00'],
              ['Delivery & Pickup', '$320.00'],
              ['GST (10%)', '$497.00'],
            ].map(([label, val]) => (
              <div key={label} className="flex justify-between text-[10px]">
                <span className="text-slate-500">{label}</span>
                <span className="font-semibold text-slate-800">{val}</span>
              </div>
            ))}
          </div>
          <div className="mb-3 flex justify-between">
            <span className="text-[11px] font-bold text-slate-500">Total AUD</span>
            <span className="text-sm font-black text-slate-900">$5,467.00</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl py-1.5 text-center text-[10px] font-bold" style={{ background: '#ecfdf5', border: '1px solid #bbf7d0', color: '#065f46' }}>Accept</div>
            <div className="rounded-xl py-1.5 text-center text-[10px] font-bold" style={{ background: 'rgba(248,250,252,0.90)', border: '1px solid rgba(200,180,240,0.25)', color: '#64748b' }}>PDF</div>
            <div className="rounded-xl py-1.5 text-center text-[10px] font-bold" style={{ background: '#e0f2fe', border: '1px solid #bae6fd', color: '#0369a1' }}>Share Link</div>
          </div>
        </div>
      </div>
    </AppChrome>
  );
}

// ── Invoice Screenshot ───────────────────────────────────────────────────────

function InvoiceScreenshot() {
  return (
    <AppChrome>
      <div style={{ background: glassBg, padding: '16px' }}>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-800">Invoices</p>
          <div className="flex gap-2">
            <span className="rounded-full px-2 py-0.5 text-[9px] font-bold" style={{ background: '#fee2e2', color: '#b91c1c' }}>3 Overdue</span>
            <div className="rounded-lg px-2 py-1 text-[10px] font-bold text-white" style={{ background: 'linear-gradient(135deg,#ea580c,#c2410c)' }}>+ New Invoice</div>
          </div>
        </div>
        <div className="rounded-2xl p-4" style={glassCard}>
          <div className="mb-4 flex items-start justify-between border-b pb-3" style={{ borderColor: 'rgba(200,180,240,0.20)' }}>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-orange-500">INV-0042</p>
              <p className="text-sm font-bold text-slate-900">Smith Constructions</p>
              <p className="text-[9px] text-slate-400">ABN 12 345 678 · Sydney NSW</p>
            </div>
            <div className="text-right">
              <span className="rounded-full px-2 py-0.5 text-[9px] font-bold" style={{ background: '#fffbeb', color: '#92400e' }}>Awaiting Payment</span>
              <p className="mt-1 text-[9px] text-slate-400">Due: 5 Mar 2025</p>
            </div>
          </div>
          <div className="mb-3 space-y-1.5">
            {[
              ['20T Excavator — 3 days', '$3,600.00'],
              ['Delivery & Pickup', '$480.00'],
              ['Operator — J. Stevens (3 days)', '$1,350.00'],
              ['GST (10%)', '$543.00'],
            ].map(([l, v]) => (
              <div key={l} className="flex justify-between border-b py-1 text-[10px]" style={{ borderColor: 'rgba(200,180,240,0.12)' }}>
                <span className="text-slate-500">{l}</span>
                <span className="font-semibold text-slate-800">{v}</span>
              </div>
            ))}
          </div>
          <div className="mb-3 flex justify-between">
            <span className="text-[11px] font-bold text-slate-500">Total AUD</span>
            <span className="text-sm font-black text-slate-900">$5,973.00</span>
          </div>
          <div className="flex items-center justify-between rounded-xl px-3 py-2" style={{ background: 'linear-gradient(135deg,rgba(245,243,255,0.90),rgba(224,242,254,0.90))', border: '1px solid rgba(139,92,246,0.20)' }}>
            <span className="text-[10px] font-bold text-violet-700">Pay by card online</span>
            <span className="text-[9px] text-slate-400">Powered by Stripe</span>
          </div>
        </div>
      </div>
    </AppChrome>
  );
}

// ── Reports Screenshot ───────────────────────────────────────────────────────

function ReportsScreenshot() {
  const bars = [
    { label: 'Excavator', pct: 85, val: '$28.4k', color: '#8b5cf6' },
    { label: 'Tipper', pct: 62, val: '$18.1k', color: '#38bdf8' },
    { label: 'Bobcat', pct: 48, val: '$13.8k', color: '#10b981' },
    { label: 'Telehandler', pct: 32, val: '$9.2k', color: '#f59e0b' },
    { label: 'Roller', pct: 20, val: '$5.6k', color: '#f43f5e' },
  ];
  return (
    <AppChrome>
      <div style={{ background: glassBg, padding: '16px' }}>
        <p className="mb-3 text-sm font-semibold text-slate-800">Reports — February 2025</p>
        <div className="mb-3 grid grid-cols-3 gap-2">
          {[
            { label: 'Revenue', val: '$75,100', bg: 'rgba(239,246,255,0.90)', border: '#3b82f6', t: '#1d4ed8' },
            { label: 'Expenses', val: '$18,400', bg: 'rgba(255,247,237,0.90)', border: '#f97316', t: '#c2410c' },
            { label: 'Net Profit', val: '$56,700', bg: 'rgba(240,253,250,0.90)', border: '#10b981', t: '#047857' },
          ].map((k) => (
            <div key={k.label} className="rounded-2xl p-2.5" style={{ background: k.bg, borderLeft: `3px solid ${k.border}`, border: '1px solid rgba(255,255,255,0.65)', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              <p className="text-[9px] text-slate-500">{k.label}</p>
              <p className="text-sm font-black" style={{ color: k.t }}>{k.val}</p>
            </div>
          ))}
        </div>
        <div className="rounded-2xl p-3" style={glassCard}>
          <p className="mb-3 text-[10px] font-bold text-slate-700">Revenue by Machine</p>
          <div className="space-y-2">
            {bars.map((b) => (
              <div key={b.label} className="flex items-center gap-2">
                <span className="w-16 text-right text-[9px] text-slate-400">{b.label}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full" style={{ background: 'rgba(200,180,240,0.20)' }}>
                  <div className="h-full rounded-full" style={{ width: `${b.pct}%`, background: b.color }} />
                </div>
                <span className="w-10 text-[9px] font-semibold text-slate-600">{b.val}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppChrome>
  );
}

// ── Dashboard Screenshot ─────────────────────────────────────────────────────

function DashboardScreenshot() {
  return (
    <AppChrome>
      <div style={{ background: glassBg, padding: '16px' }}>
        <div className="mb-3 overflow-hidden rounded-2xl p-3" style={{ background: 'linear-gradient(135deg, rgba(192,132,252,0.14), rgba(56,189,248,0.09))', border: '1px solid rgba(255,255,255,0.60)' }}>
          <p className="text-[9px] text-slate-400">February 2025</p>
          <p className="text-sm font-black text-slate-900">Good morning, Jake</p>
          <p className="text-[10px] text-slate-500">Collected <span className="font-bold text-violet-600">$62,400</span> this month</p>
        </div>
        <div className="mb-3 grid grid-cols-4 gap-2">
          {[
            { label: 'Total', val: '12', border: '#3b82f6', bg: 'rgba(239,246,255,0.85)' },
            { label: 'On Hire', val: '7', border: '#f59e0b', bg: 'rgba(255,251,235,0.85)' },
            { label: 'Available', val: '4', border: '#10b981', bg: 'rgba(236,253,245,0.85)' },
            { label: 'Repair', val: '1', border: '#ef4444', bg: 'rgba(254,242,242,0.85)' },
          ].map((c) => (
            <div key={c.label} className="rounded-xl p-2" style={{ background: c.bg, borderLeft: `2px solid ${c.border}`, border: '1px solid rgba(255,255,255,0.60)' }}>
              <p className="text-[7px] text-slate-500">{c.label}</p>
              <p className="text-base font-black text-slate-900">{c.val}</p>
            </div>
          ))}
        </div>
        <div className="mb-3 rounded-2xl p-3" style={{ background: 'rgba(254,242,242,0.70)', border: '1px solid rgba(254,202,202,0.40)' }}>
          <p className="text-[10px] font-bold text-red-700 mb-1">Needs Attention</p>
          {[
            { label: '2 overdue invoices ($4,200 outstanding)', color: '#ef4444' },
            { label: '1 quote expiring today — Apex Earthworks', color: '#f59e0b' },
            { label: '1 overdue return — Bobcat S650', color: '#8b5cf6' },
          ].map((a) => (
            <div key={a.label} className="flex items-center gap-1.5 mb-0.5">
              <div className="size-1.5 rounded-full" style={{ background: a.color }} />
              <span className="text-[9px] text-slate-600">{a.label}</span>
            </div>
          ))}
        </div>
        <div className="rounded-2xl p-3" style={glassCard}>
          <p className="mb-2 text-[10px] font-bold text-slate-700">Upcoming Jobs</p>
          {[
            { m: 'Bobcat S650', c: 'Smith Constructions', s: 'Active', sc: { background: '#ecfdf5', color: '#065f46' } },
            { m: '20T Excavator', c: 'Hartley Civil', s: 'Confirmed', sc: { background: '#eff6ff', color: '#1d4ed8' } },
            { m: 'Tipper Truck', c: 'Apex Earthworks', s: 'Quoted', sc: { background: '#fffbeb', color: '#92400e' } },
          ].map((r) => (
            <div key={r.m} className="flex items-center gap-2 border-b py-1.5 text-[9px]" style={{ borderColor: 'rgba(200,180,240,0.15)' }}>
              <span className="w-20 truncate font-semibold text-slate-800">{r.m}</span>
              <span className="flex-1 truncate text-slate-500">{r.c}</span>
              <span className="shrink-0 rounded-full px-1.5 py-0.5 text-[8px] font-bold" style={r.sc}>{r.s}</span>
            </div>
          ))}
        </div>
      </div>
    </AppChrome>
  );
}

// ── Maintenance Screenshot ───────────────────────────────────────────────────

function MaintenanceScreenshot() {
  return (
    <AppChrome>
      <div style={{ background: glassBg, padding: '16px' }}>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-800">Bobcat S650 — Maintenance</p>
            <p className="text-[9px] text-slate-400">Skid Steer Loader · 2022</p>
          </div>
          <div className="rounded-lg px-2 py-1 text-[10px] font-bold text-white" style={{ background: 'linear-gradient(135deg,#f59e0b,#d97706)' }}>+ Log Service</div>
        </div>
        <div className="mb-3 grid grid-cols-2 gap-2">
          <div className="rounded-xl p-2.5" style={{ background: 'rgba(255,251,235,0.85)', border: '1px solid rgba(245,158,11,0.20)' }}>
            <p className="text-[8px] text-slate-500">Next Service Due</p>
            <p className="text-[11px] font-bold text-amber-700">15 Mar 2025</p>
            <p className="text-[8px] text-amber-600">In 24 days</p>
          </div>
          <div className="rounded-xl p-2.5" style={{ background: 'rgba(240,253,250,0.85)', border: '1px solid rgba(16,185,129,0.20)' }}>
            <p className="text-[8px] text-slate-500">Last Service</p>
            <p className="text-[11px] font-bold text-emerald-700">15 Dec 2024</p>
            <p className="text-[8px] text-emerald-600">500hr service</p>
          </div>
        </div>
        <div className="rounded-2xl p-3" style={glassCard}>
          <p className="mb-2 text-[10px] font-bold text-slate-700">Service History</p>
          {[
            { date: '15 Dec 2024', type: 'Service', desc: '500hr service — oil, filters, greased', cost: '$420', badge: { bg: '#ecfdf5', color: '#065f46' } },
            { date: '20 Oct 2024', type: 'Repair', desc: 'Replaced hydraulic hose — left boom', cost: '$680', badge: { bg: '#fef2f2', color: '#991b1b' } },
            { date: '1 Sep 2024', type: 'Inspection', desc: 'Annual safety inspection — passed', cost: '$150', badge: { bg: '#eff6ff', color: '#1d4ed8' } },
            { date: '15 Jun 2024', type: 'Service', desc: '250hr service — oil & filters', cost: '$320', badge: { bg: '#ecfdf5', color: '#065f46' } },
          ].map((s) => (
            <div key={s.date + s.type} className="flex items-start gap-2 border-b py-2" style={{ borderColor: 'rgba(200,180,240,0.12)' }}>
              <div className="text-[8px] text-slate-400 w-14 shrink-0 pt-0.5">{s.date}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="rounded-full px-1.5 py-0.5 text-[7px] font-bold" style={s.badge}>{s.type}</span>
                </div>
                <p className="text-[9px] text-slate-600 truncate">{s.desc}</p>
              </div>
              <span className="text-[9px] font-semibold text-slate-700 shrink-0">{s.cost}</span>
            </div>
          ))}
        </div>
      </div>
    </AppChrome>
  );
}

// ── Expenses Screenshot ──────────────────────────────────────────────────────

function ExpensesScreenshot() {
  return (
    <AppChrome>
      <div style={{ background: glassBg, padding: '16px' }}>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-800">Expenses</p>
          <div className="flex gap-1.5">
            <div className="rounded-lg px-2 py-1 text-[10px] text-slate-500" style={{ background: 'rgba(255,255,255,0.80)', border: '1px solid rgba(200,180,240,0.30)' }}>Feb 2025</div>
            <div className="rounded-lg px-2 py-1 text-[10px] font-bold text-white" style={{ background: 'linear-gradient(135deg,#ea580c,#c2410c)' }}>+ Add Expense</div>
          </div>
        </div>
        <div className="mb-3 grid grid-cols-3 gap-2">
          {[
            { label: 'Total', val: '$18,400', bg: 'rgba(255,247,237,0.90)', border: '#f97316', t: '#c2410c' },
            { label: 'GST Paid', val: '$1,840', bg: 'rgba(245,243,255,0.90)', border: '#8b5cf6', t: '#5b21b6' },
            { label: 'Receipts', val: '23', bg: 'rgba(240,253,250,0.90)', border: '#10b981', t: '#047857' },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl p-2.5" style={{ background: s.bg, borderLeft: `3px solid ${s.border}`, border: '1px solid rgba(255,255,255,0.65)' }}>
              <p className="text-[9px] text-slate-500">{s.label}</p>
              <p className="text-sm font-black" style={{ color: s.t }}>{s.val}</p>
            </div>
          ))}
        </div>
        <div className="rounded-2xl p-3" style={glassCard}>
          <p className="mb-2 text-[10px] font-bold text-slate-700">Recent Expenses</p>
          {[
            { date: '18 Feb', cat: 'Fuel', desc: 'Diesel — Shell Morningside', amount: '$420.00', catColor: '#f59e0b' },
            { date: '15 Feb', cat: 'Maintenance', desc: 'Bobcat S650 — 500hr service', amount: '$680.00', catColor: '#ef4444' },
            { date: '12 Feb', cat: 'Insurance', desc: 'Fleet insurance — Feb premium', amount: '$1,200.00', catColor: '#3b82f6' },
            { date: '10 Feb', cat: 'Transport', desc: 'Float hire — Brisbane to Gold Coast', amount: '$380.00', catColor: '#8b5cf6' },
            { date: '8 Feb', cat: 'Wages', desc: 'Operator pay — J. Stevens (5 days)', amount: '$2,250.00', catColor: '#10b981' },
          ].map((e) => (
            <div key={e.date + e.desc} className="flex items-center gap-2 border-b py-1.5" style={{ borderColor: 'rgba(200,180,240,0.12)' }}>
              <span className="text-[8px] text-slate-400 w-10 shrink-0">{e.date}</span>
              <span className="rounded-full px-1.5 py-0.5 text-[7px] font-bold shrink-0" style={{ background: `${e.catColor}15`, color: e.catColor }}>{e.cat}</span>
              <span className="flex-1 truncate text-[9px] text-slate-600">{e.desc}</span>
              <span className="text-[9px] font-semibold text-slate-800 shrink-0">{e.amount}</span>
            </div>
          ))}
        </div>
      </div>
    </AppChrome>
  );
}

// ── Team Management Screenshot ───────────────────────────────────────────────

function TeamScreenshot() {
  return (
    <AppChrome>
      <div style={{ background: glassBg, padding: '16px' }}>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-800">Team Members</p>
          <div className="rounded-lg px-2 py-1 text-[10px] font-bold text-white" style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}>+ Invite Member</div>
        </div>
        <div className="rounded-2xl p-3" style={glassCard}>
          {[
            { init: 'JS', name: 'Jake Smith', email: 'jake@smithearth.com.au', role: 'Admin', grad: 'from-violet-500 to-indigo-600', roleBg: '#f5f3ff', roleColor: '#5b21b6' },
            { init: 'TW', name: 'Tom Wilson', email: 'tom@smithearth.com.au', role: 'User', grad: 'from-blue-500 to-sky-600', roleBg: '#eff6ff', roleColor: '#1d4ed8' },
            { init: 'SB', name: 'Sarah Brown', email: 'sarah@smithearth.com.au', role: 'User', grad: 'from-emerald-500 to-teal-600', roleBg: '#eff6ff', roleColor: '#1d4ed8' },
            { init: 'ML', name: 'Mark Lee', email: 'mark@smithearth.com.au', role: 'Viewer', grad: 'from-amber-500 to-orange-600', roleBg: '#f8fafc', roleColor: '#64748b' },
          ].map((m, i) => (
            <div key={m.name} className="flex items-center gap-3 py-2.5" style={{ borderBottom: i < 3 ? '1px solid rgba(200,180,240,0.15)' : 'none' }}>
              <div className={`flex size-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${m.grad} text-[10px] font-bold text-white`}>{m.init}</div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold text-slate-800">{m.name}</p>
                <p className="text-[9px] text-slate-400">{m.email}</p>
              </div>
              <span className="rounded-full px-2 py-0.5 text-[9px] font-bold" style={{ background: m.roleBg, color: m.roleColor }}>{m.role}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 rounded-2xl p-3" style={{ ...glassCard, background: 'rgba(245,243,255,0.60)' }}>
          <p className="text-[10px] font-bold text-slate-700 mb-2">Pending Invites</p>
          <div className="flex items-center gap-2">
            <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-slate-200 text-[8px] font-bold text-slate-500">?</div>
            <div className="flex-1">
              <p className="text-[9px] text-slate-500">dave@contractor.com.au</p>
            </div>
            <span className="rounded-full px-1.5 py-0.5 text-[8px] font-bold" style={{ background: '#fffbeb', color: '#92400e' }}>Pending</span>
          </div>
        </div>
      </div>
    </AppChrome>
  );
}

// ── Document Sharing Screenshot ──────────────────────────────────────────────

function DocumentSharingScreenshot() {
  return (
    <AppChrome>
      <div style={{ background: glassBg, padding: '16px' }}>
        <div className="mb-3 text-center">
          <div className="mx-auto mb-2"><LogoMark size={40} /></div>
          <p className="text-xs font-bold text-slate-800">Hasky Earthmoving</p>
          <p className="text-[9px] text-slate-400">has shared an invoice with you</p>
        </div>
        <div className="rounded-2xl p-4" style={glassCard}>
          <div className="mb-3 flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-orange-500">INV-HE-0042</p>
              <p className="text-sm font-bold text-slate-900">$5,973.00</p>
              <p className="text-[9px] text-slate-400">Due: 1 Mar 2025</p>
            </div>
            <span className="rounded-full px-2 py-0.5 text-[9px] font-bold" style={{ background: '#fffbeb', color: '#92400e' }}>Unpaid</span>
          </div>
          <div className="mb-3 space-y-1 border-y py-2" style={{ borderColor: 'rgba(200,180,240,0.20)' }}>
            {['20T Excavator — 3 days · $3,600', 'Delivery & Pickup · $480', 'Operator · $1,350', 'GST (10%) · $543'].map((l) => (
              <p key={l} className="text-[9px] text-slate-500">{l}</p>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="rounded-xl py-2 text-center text-[10px] font-bold text-white" style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>Pay $5,973.00</div>
            <div className="rounded-xl py-2 text-center text-[10px] font-bold text-slate-600" style={{ background: 'rgba(248,250,252,0.90)', border: '1px solid rgba(200,180,240,0.30)' }}>Download PDF</div>
          </div>
          <p className="text-center text-[8px] text-slate-400">Secure payment powered by Stripe</p>
        </div>
      </div>
    </AppChrome>
  );
}

// ── Feature Section data ─────────────────────────────────────────────────────

const featuresData = [
  {
    label: 'Fleet',
    labelColor: 'text-amber-600',
    labelBg: 'bg-amber-50',
    labelBorder: 'border-amber-200',
    accentColor: '#f59e0b',
    title: 'Your whole fleet. One screen.',
    desc: "See every machine at a glance — what's out on hire, what's available, what needs a service. Colour-coded status strips make it instant to read. Search by name, make, model, or filter by category and status.",
    points: [
      'Real-time status: Available, On Hire, Under Repair, In Transit, Decommissioned',
      'Service due alerts and full maintenance history',
      'Multiple photos per machine with detailed specs',
      'Daily, weekly, monthly hire rates per machine',
      'Track make, model, year, serial number, and registration',
      'Full hire history showing every booking for each asset',
    ],
    screenshot: <FleetScreenshot />,
  },
  {
    label: 'Jobs',
    labelColor: 'text-violet-700',
    labelBg: 'bg-violet-50',
    labelBorder: 'border-violet-200',
    accentColor: '#7c3aed',
    title: 'Book jobs. See conflicts. Stay on track.',
    desc: 'The 4-step booking wizard makes scheduling stupidly simple. Pick a machine, customer, dates, and delivery details — done in under a minute. Conflicts are flagged before they happen with database-level double-booking prevention.',
    points: [
      '4-step guided new booking wizard',
      'Automatic double-booking conflict detection at database level',
      'Auto-generated reference numbers (BOK-XX-0001)',
      'Payment plans: deposit, upfront, or on completion',
      'Hourly, daily, weekly, monthly rate types',
      'Delivery address with Google Maps autocomplete',
      '"Needs Attention" panel for overdue items and expiring quotes',
    ],
    screenshot: <JobsScreenshot />,
  },
  {
    label: 'CRM',
    labelColor: 'text-emerald-700',
    labelBg: 'bg-emerald-50',
    labelBorder: 'border-emerald-200',
    accentColor: '#059669',
    title: 'Know your customers inside out.',
    desc: "Every customer, every job they've ever had with you, every invoice, every quote. A complete history at your fingertips so you always know who you're dealing with and how much they're worth.",
    points: [
      'Full contact info, ABN, and Australian address',
      'Complete hire, invoice, and quote history per customer',
      'One-click to create quote or invoice for a customer',
      'Customer lifetime value calculated automatically',
      'Search by name, contact person, or email',
    ],
    screenshot: <CRMScreenshot />,
  },
  {
    label: 'Quotes',
    labelColor: 'text-sky-700',
    labelBg: 'bg-sky-50',
    labelBorder: 'border-sky-200',
    accentColor: '#0284c7',
    title: 'Win more jobs with professional quotes.',
    desc: 'Generate and send professional quotes in seconds. Customers can view, accept, and even pay online — all without creating an account. Convert accepted quotes to bookings with a single click.',
    points: [
      'Professional branded PDF quotes with your logo',
      'Share via secure public link — no login needed for customers',
      'Online acceptance by customers with one click',
      'Accept payment on quotes via Stripe',
      'Auto-generated reference numbers (QUO-XX-0001)',
      'Auto-convert accepted quotes to bookings',
      'Track sent date, expiry, and hire dates separately',
    ],
    screenshot: <QuotesScreenshot />,
  },
  {
    label: 'Invoicing',
    labelColor: 'text-orange-700',
    labelBg: 'bg-orange-50',
    labelBorder: 'border-orange-200',
    accentColor: '#ea580c',
    title: 'Get paid. On time. Every time.',
    desc: "Send GST-compliant invoices in seconds. Track what's paid, what's overdue, and what's outstanding. Customers can pay by card directly from the invoice link. Record partial payments and deposits automatically.",
    points: [
      'GST-compliant invoices with your company branding and logo',
      'Accept card payments via Stripe — no extra app needed',
      'Partial payment tracking — deposits, progress payments',
      'Automatic overdue detection — invoices auto-marked daily',
      'One-click invoice generation from any booking',
      'Payment reminders via email',
      'Shareable public payment link per invoice',
      'Branded PDF generation with bank details and payment info',
    ],
    screenshot: <InvoiceScreenshot />,
  },
  {
    label: 'Reports',
    labelColor: 'text-teal-700',
    labelBg: 'bg-teal-50',
    labelBorder: 'border-teal-200',
    accentColor: '#0d9488',
    title: 'Know your numbers. Always.',
    desc: 'Profit & loss, revenue by machine, expense tracking, and GST summary. Everything your accountant needs auto-calculated and ready for BAS lodgement time. See which machines are earning their keep.',
    points: [
      'Profit & Loss by month, quarter, or custom date range',
      'GST collected and paid summary ready for BAS',
      'Revenue by machine — identify your top earners',
      'Expense tracking across 12 categories with receipts',
      'Machine profitability — revenue, expenses, net profit per asset',
      'Fleet ROI analysis with margin percentages',
    ],
    screenshot: <ReportsScreenshot />,
  },
  {
    label: 'Dashboard',
    labelColor: 'text-indigo-700',
    labelBg: 'bg-indigo-50',
    labelBorder: 'border-indigo-200',
    accentColor: '#6366f1',
    title: 'Everything at a glance.',
    desc: "Your command centre. See fleet status, upcoming jobs, overdue invoices, and attention items all in one place. Quick actions let you create a new job, quote, or invoice in one click. Never miss an overdue return or expiring quote again.",
    points: [
      'Fleet status summary — total, on hire, available, under repair',
      'Attention panel — overdue invoices, expiring quotes, pending jobs, overdue returns',
      'Quick action buttons for new job, quote, and invoice',
      'Revenue collected this month',
      'Upcoming bookings with status badges',
      'Fleet utilisation chart',
    ],
    screenshot: <DashboardScreenshot />,
  },
  {
    label: 'Maintenance',
    labelColor: 'text-amber-700',
    labelBg: 'bg-amber-50',
    labelBorder: 'border-amber-200',
    accentColor: '#d97706',
    title: 'Keep your fleet compliant and running.',
    desc: "Track every service, repair, inspection, and certification for each machine. Set next service due dates and get alerts before they expire. Upload documentation and track costs. Know exactly how much each machine costs to maintain.",
    points: [
      'Log services, repairs, inspections, and certifications',
      'Next service due date with alerts',
      'Cost tracking per service entry',
      'Upload maintenance documents and certificates',
      'Performed by field — track which mechanic or company',
      'Full maintenance history per machine',
    ],
    screenshot: <MaintenanceScreenshot />,
  },
  {
    label: 'Expenses',
    labelColor: 'text-red-700',
    labelBg: 'bg-red-50',
    labelBorder: 'border-red-200',
    accentColor: '#dc2626',
    title: 'Track every dollar going out.',
    desc: "12 expense categories cover everything from fuel to insurance to wages. Upload receipts, link expenses to specific machines or jobs, and track GST paid for BAS. Know exactly where your money goes.",
    points: [
      '12 categories: Fuel, Maintenance, Insurance, Wages, Office, Equipment, Transport, Marketing, Professional Services, Rent, Tax, Other',
      'Amount (ex GST) and GST amount tracked separately',
      'Upload receipt images and PDFs',
      'Link expenses to specific machines for per-asset profitability',
      'Link expenses to specific bookings/jobs',
      'Filter by category, date range, machine, or job',
    ],
    screenshot: <ExpensesScreenshot />,
  },
  {
    label: 'Team',
    labelColor: 'text-purple-700',
    labelBg: 'bg-purple-50',
    labelBorder: 'border-purple-200',
    accentColor: '#9333ea',
    title: 'Your whole team. One system.',
    desc: "Invite team members via email with the right level of access. Admins get full control, Users can manage day-to-day operations, and Viewers can see everything without making changes. Everyone on the same page.",
    points: [
      'Invite team members via email',
      'Three roles: Admin (full access), User (standard), Viewer (read-only)',
      'Track invite status — pending, accepted, expired',
      'Everyone sees the same real-time data',
      'Company-scoped data isolation — your team only sees your data',
    ],
    screenshot: <TeamScreenshot />,
  },
  {
    label: 'Sharing',
    labelColor: 'text-blue-700',
    labelBg: 'bg-blue-50',
    labelBorder: 'border-blue-200',
    accentColor: '#2563eb',
    title: 'Share documents. Get paid. No friction.',
    desc: "Every quote and invoice gets a unique secure link. Share it via email or SMS. Your customers can view the document, accept quotes, pay invoices, and download PDFs — all without creating an account. Professional and frictionless.",
    points: [
      'Unique secure token-based links for every document',
      'No account required for customers to view or pay',
      'Online quote acceptance with one click',
      'Card payments via Stripe directly from the shared link',
      'PDF download for customer records',
      'Email delivery via Resend with tracking',
      'Payment reminders for overdue invoices',
    ],
    screenshot: <DocumentSharingScreenshot />,
  },
];

// ── Animation variants ───────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

// ── Page ─────────────────────────────────────────────────────────────────────

export default function FeaturesPage() {
  return (
    <LandingLayout>
      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section className="px-6 pb-16 pt-24 text-center lg:px-12 lg:pt-32">
        <motion.div
          className="mx-auto max-w-3xl"
          initial="hidden"
          animate="visible"
          variants={stagger}
        >
          <motion.div variants={fadeUp}>
            <span
              className="mb-4 inline-block rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-violet-700"
              style={{
                background: 'rgba(245,243,255,0.85)',
                border: '1px solid rgba(139,92,246,0.25)',
              }}
            >
              Features
            </span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="mb-5 text-5xl font-black tracking-tight text-slate-900 sm:text-6xl lg:text-7xl"
          >
            Every feature.{' '}
            <span
              className="inline-block"
              style={{
                background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 60%, #0ea5e9 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              No price.
            </span>
          </motion.h1>

          <motion.p variants={fadeUp} className="mx-auto mb-4 max-w-xl text-lg text-slate-500">
            Everything a machinery hire business needs — fleet, jobs, CRM, quotes, invoices,
            reports, maintenance, expenses, and team management. All built specifically for Australian operators. All free.
          </motion.p>

          <motion.p variants={fadeUp} className="mx-auto mb-8 max-w-lg text-sm text-slate-400">
            12 feature areas · 17 machine categories · Unlimited everything
          </motion.p>

          <motion.div variants={fadeUp}>
            <Link to="/signup" className={ctaBtnClass} style={{ ...ctaBtnStyle, fontSize: '1rem', padding: '0.875rem 2.5rem', borderRadius: '1rem' }}>
              Get started for free →
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Quick feature nav ───────────────────────────────────────── */}
      <div
        className="border-y px-6 py-6"
        style={{ background: 'rgba(255,255,255,0.50)', borderColor: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(8px)' }}
      >
        <div className="mx-auto flex max-w-6xl flex-wrap justify-center gap-2">
          {featuresData.map((f) => (
            <span
              key={f.label}
              className={`rounded-full border px-3 py-1.5 text-xs font-bold ${f.labelColor} ${f.labelBg} ${f.labelBorder}`}
            >
              {f.label}
            </span>
          ))}
        </div>
      </div>

      {/* ── Feature sections ──────────────────────────────────────── */}
      <div className="space-y-0">
        {featuresData.map((feature, i) => (
          <section key={feature.label} className="px-6 py-20 lg:px-12">
            <motion.div
              className={`mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 ${i % 2 !== 0 ? 'lg:[&>*:first-child]:order-2' : ''}`}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              variants={stagger}
            >
              <motion.div variants={fadeUp}>
                <span
                  className={`mb-4 inline-block rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-widest ${feature.labelColor} ${feature.labelBg} ${feature.labelBorder}`}
                >
                  {feature.label}
                </span>
                <h2 className="mb-4 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                  {feature.title}
                </h2>
                <p className="mb-6 text-base leading-relaxed text-slate-500">{feature.desc}</p>
                <ul className="space-y-3">
                  {feature.points.map((p) => (
                    <li key={p} className="flex items-start gap-3 text-sm text-slate-600">
                      <span
                        className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-white text-[10px]"
                        style={{ background: feature.accentColor }}
                      >
                        ✔
                      </span>
                      {p}
                    </li>
                  ))}
                </ul>
              </motion.div>

              <motion.div variants={fadeUp}>
                {feature.screenshot}
              </motion.div>
            </motion.div>
          </section>
        ))}
      </div>

      {/* ── CTA section ───────────────────────────────────────────── */}
      <section className="px-6 py-24 text-center lg:px-12">
        <motion.div
          className="relative mx-auto max-w-2xl overflow-hidden rounded-3xl px-8 py-16"
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          style={{
            background: 'rgba(255,255,255,0.72)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.70)',
            boxShadow: '0 8px 40px rgba(100,60,180,0.10)',
          }}
        >
          <div
            className="absolute inset-x-0 top-0 h-[3px]"
            style={{ background: 'linear-gradient(90deg, #c084fc, #818cf8, #38bdf8)' }}
          />

          <h2
            className="mb-4 text-4xl font-black tracking-tight"
            style={{
              background: 'linear-gradient(135deg, #1e1b4b 0%, #4c1d95 50%, #0c4a6e 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            All of this. Free.
          </h2>
          <p className="mb-3 text-lg text-slate-500">
            Every feature above — all 12 categories — yours for $0. No subscription, no credit card, no catches. Ever.
          </p>
          <p className="mb-8 text-sm text-slate-400">
            Unlimited machines · Unlimited customers · Unlimited invoices · Unlimited team members
          </p>
          <Link to="/signup" className={ctaBtnClass} style={{ ...ctaBtnStyle, fontSize: '1rem', padding: '0.875rem 2.5rem', borderRadius: '1rem' }}>
            Create your free account →
          </Link>
          <p className="mt-5 text-sm text-slate-400">Takes less than 2 minutes to set up.</p>
        </motion.div>
      </section>
    </LandingLayout>
  );
}
