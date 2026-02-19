import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { LandingLayout, ctaBtnClass, ctaBtnStyle } from '../../components/landing/LandingLayout';

// ── Shared App Chrome ──────────────────────────────────────────────────────

function AppChrome({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="overflow-hidden rounded-2xl"
      style={{
        boxShadow: '0 24px 80px rgba(100,60,180,0.14), 0 4px 24px rgba(0,0,0,0.08)',
        border: '1px solid rgba(255,255,255,0.70)',
      }}
    >
      {/* Window chrome bar */}
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

// ── Fleet Screenshot ───────────────────────────────────────────────────────

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
      <div style={{ background: 'linear-gradient(160deg,#fdf4ff 0%,#f5f3ff 40%,#f0f9ff 100%)', padding: '16px' }}>
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

// ── Jobs/Bookings Screenshot ───────────────────────────────────────────────

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
      <div style={{ background: 'linear-gradient(160deg,#fdf4ff 0%,#f5f3ff 40%,#f0f9ff 100%)', padding: '16px' }}>
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

// ── CRM Screenshot ─────────────────────────────────────────────────────────

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
      <div style={{ background: 'linear-gradient(160deg,#fdf4ff 0%,#f5f3ff 40%,#f0f9ff 100%)', padding: '16px' }}>
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

// ── Quotes Screenshot ──────────────────────────────────────────────────────

function QuotesScreenshot() {
  return (
    <AppChrome>
      <div style={{ background: 'linear-gradient(160deg,#fdf4ff 0%,#f5f3ff 40%,#f0f9ff 100%)', padding: '16px' }}>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-800">Quotes</p>
          <div className="rounded-lg px-2 py-1 text-[10px] font-bold text-white" style={{ background: 'linear-gradient(135deg,#0284c7,#0369a1)' }}>+ New Quote</div>
        </div>
        <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.82)', border: '1px solid rgba(255,255,255,0.70)', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
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

// ── Invoice Screenshot ─────────────────────────────────────────────────────

function InvoiceScreenshot() {
  return (
    <AppChrome>
      <div style={{ background: 'linear-gradient(160deg,#fdf4ff 0%,#f5f3ff 40%,#f0f9ff 100%)', padding: '16px' }}>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-800">Invoices</p>
          <div className="flex gap-2">
            <span className="rounded-full px-2 py-0.5 text-[9px] font-bold" style={{ background: '#fee2e2', color: '#b91c1c' }}>3 Overdue</span>
            <div className="rounded-lg px-2 py-1 text-[10px] font-bold text-white" style={{ background: 'linear-gradient(135deg,#ea580c,#c2410c)' }}>+ New Invoice</div>
          </div>
        </div>
        <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.82)', border: '1px solid rgba(255,255,255,0.70)', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
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
            <span className="text-[10px] font-bold text-violet-700">💳 Pay by card online</span>
            <span className="text-[9px] text-slate-400">Powered by Stripe</span>
          </div>
        </div>
      </div>
    </AppChrome>
  );
}

// ── Reports Screenshot ─────────────────────────────────────────────────────

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
      <div style={{ background: 'linear-gradient(160deg,#fdf4ff 0%,#f5f3ff 40%,#f0f9ff 100%)', padding: '16px' }}>
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
        <div className="rounded-2xl p-3" style={{ background: 'rgba(255,255,255,0.82)', border: '1px solid rgba(255,255,255,0.70)', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
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

// ── Feature Section data ───────────────────────────────────────────────────

const featuresData = [
  {
    label: 'Fleet',
    labelColor: 'text-amber-600',
    labelBg: 'bg-amber-50',
    labelBorder: 'border-amber-200',
    accentColor: '#f59e0b',
    title: 'Your whole fleet. One screen.',
    desc: "See every machine at a glance — what's out on hire, what's available, what needs a service. Colour-coded status strips make it instant to read.",
    points: [
      'Real-time status: Available, On Hire, Under Repair, In Transit',
      'Service due alerts and maintenance history',
      'Full hire history for every asset',
      'Daily, weekly, monthly hire rates per machine',
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
    desc: 'The 4-step booking wizard makes scheduling stupidly simple. Delivery details, operator, dates, machine — done in under a minute. Conflicts are flagged before they happen.',
    points: [
      '4-step guided new booking wizard',
      'Automatic double-booking conflict detection',
      '"Needs Attention" panel for overdue items',
      'Hourly, daily, weekly, monthly rate types',
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
    desc: "Every customer, every job they've ever had with you, every invoice, every quote. A complete history at your fingertips so you always know who you're dealing with.",
    points: [
      'Full contact info, ABN, and Australian address',
      'Complete hire and invoice history per customer',
      'One-click to create quote or invoice for a customer',
      'Customer lifetime value at a glance',
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
    desc: 'Generate and send professional quotes in seconds. Customers can accept online. Convert accepted quotes to invoices with a single click.',
    points: [
      'Professional branded PDF quotes',
      'Share via secure public link — no login needed for customers',
      'Online acceptance by customers',
      'Auto-convert to invoice when accepted',
    ],
    screenshot: <QuotesScreenshot />,
  },
  {
    label: 'Invoicing',
    labelColor: 'text-orange-700',
    labelBg: 'bg-orange-50',
    labelBorder: 'border-orange-200',
    accentColor: '#ea580c',
    title: 'Get paid. On time.',
    desc: "Send GST-compliant invoices in seconds. Track what's paid, what's overdue. Customers can pay by card directly from the invoice link.",
    points: [
      'GST-compliant invoices with your company branding',
      'Accept card payments via Stripe — no extra app needed',
      'Overdue invoice alerts on your dashboard',
      'Shareable public payment link per invoice',
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
    desc: 'Profit & loss, revenue by machine, expense tracking, and GST summary. Everything your accountant needs auto-calculated and ready for BAS lodgement time.',
    points: [
      'Profit & Loss by month or financial quarter',
      'GST collected and paid summary ready for BAS',
      'Revenue by machine — identify your best performers',
      'Expense tracking across 12 categories',
    ],
    screenshot: <ReportsScreenshot />,
  },
];

// ── Animation variants ─────────────────────────────────────────────────────

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

// ── Page ──────────────────────────────────────────────────────────────────

export default function FeaturesPage() {
  return (
    <LandingLayout>
      {/* ── Hero ──────────────────────────────────────────────────────── */}
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

          <motion.p variants={fadeUp} className="mx-auto mb-8 max-w-xl text-lg text-slate-500">
            Everything a machinery hire business needs — fleet, jobs, CRM, quotes, invoices, and
            reports. All built specifically for Australian operators. All free.
          </motion.p>

          <motion.div variants={fadeUp}>
            <Link to="/signup" className={ctaBtnClass} style={{ ...ctaBtnStyle, fontSize: '1rem', padding: '0.875rem 2.5rem', borderRadius: '1rem' }}>
              Get started for free →
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Feature sections ──────────────────────────────────────────── */}
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
              {/* Text side */}
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
                        ✓
                      </span>
                      {p}
                    </li>
                  ))}
                </ul>
              </motion.div>

              {/* Screenshot side */}
              <motion.div variants={fadeUp}>
                {feature.screenshot}
              </motion.div>
            </motion.div>
          </section>
        ))}
      </div>

      {/* ── CTA section ───────────────────────────────────────────────── */}
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
          {/* Gradient accent bar */}
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
          <p className="mb-8 text-lg text-slate-500">
            Every feature above, all yours. No subscription, no credit card, no catches. Ever.
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
