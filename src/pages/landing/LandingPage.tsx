import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Sparkles, Shield, Smartphone, Zap, Clock, CreditCard, BarChart3, Wrench, Users, FileText, Receipt, TrendingUp, X, Check, Truck, CalendarDays, DollarSign, Lock } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { LandingLayout } from '../../components/landing/LandingLayout';
import { ctaBtnClass, ctaBtnStyle } from '../../components/landing/ctaStyles';
import { useAuth } from '../../hooks/useAuth';

const fadeUp = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
};

/* ── Mock app chrome ──────────────────────────────────────── */
function AppChrome({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <div className="overflow-hidden rounded-2xl shadow-2xl" style={{ boxShadow: '0 32px 80px rgba(139,92,246,0.15), 0 8px 32px rgba(0,0,0,0.10)', border: '1px solid rgba(255,255,255,0.55)' }}>
      <div className="flex h-9 items-center gap-2 border-b border-white/10 bg-slate-950/90 px-4">
        <div className="size-3 rounded-full bg-[#FF5F57]" />
        <div className="size-3 rounded-full bg-[#FEBC2E]" />
        <div className="size-3 rounded-full bg-[#28C840]" />
        {title && <span className="ml-3 text-[11px] text-slate-500">{title}</span>}
      </div>
      {children}
    </div>
  );
}

function AppSidebar({ active }: { active: string }) {
  const nav = [
    { label: 'Dashboard', dot: '#818cf8' },
    { label: 'Fleet',     dot: '#f59e0b' },
    { label: 'Jobs',      dot: '#8b5cf6' },
    { label: 'Customers', dot: '#10b981' },
    { label: 'Quotes',    dot: '#38bdf8' },
    { label: 'Invoices',  dot: '#f97316' },
    { label: 'Accounting',dot: '#2dd4bf' },
  ];
  return (
    <div className="flex w-44 shrink-0 flex-col p-3" style={{ background: 'rgba(8,6,20,0.88)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="mb-4 flex items-center gap-2 px-2 py-1.5">
        <div className="flex size-8 items-center justify-center rounded-xl text-xs font-black text-white" style={{ background: 'linear-gradient(135deg, #c084fc, #818cf8, #38bdf8)' }}>H</div>
        <span className="text-sm font-bold text-white">Hasky</span>
      </div>
      <div className="space-y-0.5">
        {nav.map((item) => {
          const isActive = item.label === active;
          return (
            <div
              key={item.label}
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-[11px] font-semibold"
              style={isActive ? { background: 'rgba(139,92,246,0.18)', color: '#c4b5fd' } : { color: 'rgba(255,255,255,0.35)' }}
            >
              <div className="size-2 rounded-full" style={{ backgroundColor: item.dot, opacity: isActive ? 1 : 0.35 }} />
              {item.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Dashboard mock screenshot ────────────────────────────── */
function DashboardScreenshot() {
  return (
    <AppChrome title="hasky.com.au/dashboard">
      <div className="flex" style={{ minHeight: 480, background: 'linear-gradient(160deg, #fdf4ff 0%, #f5f3ff 35%, #f0f9ff 100%)' }}>
        <AppSidebar active="Dashboard" />
        <div className="flex-1 overflow-hidden p-5">
          <div className="mb-4 overflow-hidden rounded-2xl p-4" style={{ background: 'linear-gradient(135deg, rgba(192,132,252,0.14), rgba(56,189,248,0.09))', border: '1px solid rgba(255,255,255,0.70)', backdropFilter: 'blur(12px)' }}>
            <p className="text-[9px] text-slate-400">Wednesday, 19 February 2025</p>
            <p className="text-sm font-black text-slate-900">Good morning, <span style={{ background: 'linear-gradient(135deg, #8b5cf6, #38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Jake</span></p>
            <p className="text-[10px] text-slate-500">You've collected <span className="text-sm font-black" style={{ background: 'linear-gradient(135deg, #8b5cf6, #38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>$62,400</span> this month</p>
          </div>
          <div className="mb-4 grid grid-cols-3 gap-2">
            {[
              { label: 'New Job', sub: 'Start a booking', bg: 'linear-gradient(135deg, #7c3aed, #5b21b6)' },
              { label: 'New Quote', sub: 'Send a price', bg: 'linear-gradient(135deg, #0284c7, #075985)' },
              { label: 'New Invoice', sub: 'Bill a customer', bg: 'linear-gradient(135deg, #ea580c, #9a3412)' },
            ].map((c) => (
              <div key={c.label} className="flex items-center gap-2 rounded-2xl px-3 py-2.5" style={{ background: c.bg, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
                <div className="flex size-6 items-center justify-center rounded-lg bg-white/20"><div className="size-2.5 rounded-sm bg-white/90" /></div>
                <div><p className="text-[10px] font-bold text-white">{c.label}</p><p className="text-[8px] text-white/70">{c.sub}</p></div>
              </div>
            ))}
          </div>
          <div className="mb-4 grid grid-cols-4 gap-2">
            {[
              { label: 'Total Machines', val: '12', border: '#3b82f6', bg: 'rgba(239,246,255,0.82)' },
              { label: 'On Hire',        val: '7',  border: '#f59e0b', bg: 'rgba(255,251,235,0.82)' },
              { label: 'Available',      val: '4',  border: '#10b981', bg: 'rgba(236,253,245,0.82)' },
              { label: 'Under Repair',   val: '1',  border: '#ef4444', bg: 'rgba(254,242,242,0.82)' },
            ].map((c) => (
              <div key={c.label} className="rounded-xl p-2.5" style={{ background: c.bg, borderLeft: `2px solid ${c.border}`, border: '1px solid rgba(255,255,255,0.60)', backdropFilter: 'blur(8px)' }}>
                <p className="text-[8px] text-slate-500">{c.label}</p>
                <p className="text-lg font-black text-slate-900">{c.val}</p>
              </div>
            ))}
          </div>
          <div className="rounded-2xl p-3" style={{ background: 'rgba(255,255,255,0.70)', border: '1px solid rgba(255,255,255,0.60)', backdropFilter: 'blur(8px)' }}>
            <p className="mb-2 text-[10px] font-bold text-slate-700">Upcoming Jobs</p>
            {[
              { m: 'Bobcat S650',  c: 'Smith Constructions', sc: 'rgba(236,253,245,0.9)', tc: '#047857', s: 'Active'   },
              { m: '20T Excavator',c: 'Hartley Civil',        sc: 'rgba(238,242,255,0.9)', tc: '#4338ca', s: 'Invoiced' },
              { m: 'Tipper Truck', c: 'Apex Earthworks',      sc: 'rgba(255,251,235,0.9)', tc: '#92400e', s: 'Quoted'  },
            ].map((row) => (
              <div key={row.m} className="flex items-center gap-2 border-b py-1.5 text-[9px]" style={{ borderColor: 'rgba(255,255,255,0.40)' }}>
                <span className="w-20 font-semibold text-slate-800 truncate">{row.m}</span>
                <span className="flex-1 text-slate-500 truncate">{row.c}</span>
                <span className="shrink-0 rounded-full px-2 py-0.5 text-[8px] font-bold" style={{ background: row.sc, color: row.tc }}>{row.s}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppChrome>
  );
}

/* ── Accounting mock screenshot ───────────────────────────── */
function AccountingScreenshot() {
  return (
    <AppChrome title="hasky.com.au/accounting">
      <div style={{ background: 'linear-gradient(160deg,#fdf4ff 0%,#f5f3ff 40%,#f0f9ff 100%)', padding: '14px', minHeight: 320 }}>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-800">Accounting</p>
          <div className="flex gap-1.5">
            <div className="rounded-lg px-2 py-1 text-[10px] font-semibold text-violet-700" style={{ background: 'rgba(245,243,255,0.90)', border: '1px solid rgba(139,92,246,0.25)' }}>This Quarter</div>
          </div>
        </div>
        <div className="mb-3 grid grid-cols-3 gap-2">
          {[
            { label: 'Revenue', val: '$186,400', bg: 'rgba(239,246,255,0.90)', border: '#3b82f6', t: '#1d4ed8' },
            { label: 'Expenses', val: '$42,800', bg: 'rgba(255,247,237,0.90)', border: '#f97316', t: '#c2410c' },
            { label: 'Net Profit', val: '$143,600', bg: 'rgba(240,253,250,0.90)', border: '#10b981', t: '#047857' },
          ].map((k) => (
            <div key={k.label} className="rounded-2xl p-2.5" style={{ background: k.bg, borderLeft: `3px solid ${k.border}`, border: '1px solid rgba(255,255,255,0.65)' }}>
              <p className="text-[9px] text-slate-500">{k.label}</p>
              <p className="text-sm font-black" style={{ color: k.t }}>{k.val}</p>
            </div>
          ))}
        </div>
        <div className="mb-3 grid grid-cols-2 gap-2">
          <div className="rounded-2xl p-3" style={{ background: 'rgba(255,255,255,0.82)', border: '1px solid rgba(255,255,255,0.70)' }}>
            <p className="mb-2 text-[10px] font-bold text-slate-700">GST Summary (BAS)</p>
            <div className="space-y-1.5">
              {[
                { label: 'GST Collected', val: '$18,640', color: '#3b82f6' },
                { label: 'GST Paid', val: '$4,280', color: '#f97316' },
                { label: 'Net GST Payable', val: '$14,360', color: '#7c3aed' },
              ].map((r) => (
                <div key={r.label} className="flex justify-between text-[10px]">
                  <span className="text-slate-500">{r.label}</span>
                  <span className="font-bold" style={{ color: r.color }}>{r.val}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl p-3" style={{ background: 'rgba(255,255,255,0.82)', border: '1px solid rgba(255,255,255,0.70)' }}>
            <p className="mb-2 text-[10px] font-bold text-slate-700">Revenue by Machine</p>
            {[
              { name: 'Excavator', pct: 85, color: '#8b5cf6', val: '$52k' },
              { name: 'Tipper', pct: 62, color: '#38bdf8', val: '$38k' },
              { name: 'Bobcat', pct: 48, color: '#10b981', val: '$29k' },
              { name: 'Crane', pct: 35, color: '#f59e0b', val: '$21k' },
            ].map((b) => (
              <div key={b.name} className="mb-1.5 flex items-center gap-2">
                <span className="w-14 text-right text-[8px] text-slate-400">{b.name}</span>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ background: 'rgba(200,180,240,0.20)' }}>
                  <div className="h-full rounded-full" style={{ width: `${b.pct}%`, background: b.color }} />
                </div>
                <span className="w-8 text-[8px] font-semibold text-slate-600">{b.val}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl p-3" style={{ background: 'rgba(255,255,255,0.82)', border: '1px solid rgba(255,255,255,0.70)' }}>
          <p className="mb-2 text-[10px] font-bold text-slate-700">Expense Breakdown</p>
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { label: 'Fuel', val: '$12,400', color: '#f59e0b' },
              { label: 'Maintenance', val: '$8,200', color: '#ef4444' },
              { label: 'Insurance', val: '$6,800', color: '#3b82f6' },
              { label: 'Transport', val: '$4,600', color: '#8b5cf6' },
            ].map((e) => (
              <div key={e.label} className="rounded-lg p-1.5 text-center" style={{ background: `${e.color}10`, border: `1px solid ${e.color}20` }}>
                <p className="text-[8px] text-slate-500">{e.label}</p>
                <p className="text-[10px] font-bold" style={{ color: e.color }}>{e.val}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppChrome>
  );
}

/* ── Invoice PDF mock ─────────────────────────────────────── */
function InvoicePDFScreenshot() {
  return (
    <AppChrome title="Invoice PDF Preview">
      <div style={{ background: '#f1f5f9', padding: '16px', minHeight: 340 }}>
        <div className="mx-auto max-w-sm rounded-lg bg-white p-5 shadow-md">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="flex size-6 items-center justify-center rounded-lg text-[8px] font-black text-white" style={{ background: 'linear-gradient(135deg, #c084fc, #818cf8, #38bdf8)' }}>H</div>
                <span className="text-[11px] font-bold text-slate-800">Hasky Earthmoving</span>
              </div>
              <p className="text-[8px] text-slate-400">ABN 12 345 678 901</p>
              <p className="text-[8px] text-slate-400">42 Smith St, Brisbane QLD 4000</p>
            </div>
            <div className="text-right">
              <p className="text-[11px] font-bold text-orange-500">INVOICE</p>
              <p className="text-[9px] font-semibold text-slate-700">INV-HE-0042</p>
              <p className="text-[8px] text-slate-400">Issue: 15 Feb 2025</p>
              <p className="text-[8px] text-slate-400">Due: 1 Mar 2025</p>
            </div>
          </div>
          <div className="mb-3 rounded-lg p-2" style={{ background: '#f8fafc' }}>
            <p className="text-[8px] font-semibold text-slate-500">Bill To</p>
            <p className="text-[10px] font-bold text-slate-800">Smith Constructions</p>
            <p className="text-[8px] text-slate-400">ABN 98 765 432 · Sydney NSW</p>
          </div>
          <table className="w-full mb-3">
            <thead>
              <tr className="border-b text-[8px] text-slate-400" style={{ borderColor: '#e2e8f0' }}>
                <th className="text-left py-1 font-medium">Description</th>
                <th className="text-right py-1 font-medium">Qty</th>
                <th className="text-right py-1 font-medium">Price</th>
                <th className="text-right py-1 font-medium">Amount</th>
              </tr>
            </thead>
            <tbody className="text-[9px]">
              {[
                { desc: '20T Excavator — 3 days', qty: '3', price: '$1,200', amount: '$3,600' },
                { desc: 'Delivery & Pickup', qty: '1', price: '$480', amount: '$480' },
                { desc: 'Operator — J. Stevens', qty: '3', price: '$450', amount: '$1,350' },
              ].map((r) => (
                <tr key={r.desc} className="border-b" style={{ borderColor: '#f1f5f9' }}>
                  <td className="py-1 text-slate-700">{r.desc}</td>
                  <td className="py-1 text-right text-slate-500">{r.qty}</td>
                  <td className="py-1 text-right text-slate-500">{r.price}</td>
                  <td className="py-1 text-right font-semibold text-slate-800">{r.amount}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="space-y-0.5 mb-3">
            <div className="flex justify-between text-[9px]"><span className="text-slate-500">Subtotal</span><span className="text-slate-700">$5,430.00</span></div>
            <div className="flex justify-between text-[9px]"><span className="text-slate-500">GST (10%)</span><span className="text-slate-700">$543.00</span></div>
            <div className="flex justify-between text-[10px] font-bold border-t pt-1" style={{ borderColor: '#e2e8f0' }}>
              <span className="text-slate-800">Total AUD</span><span className="text-slate-900">$5,973.00</span>
            </div>
          </div>
          <div className="rounded-lg p-2 text-center" style={{ background: 'linear-gradient(135deg, rgba(245,243,255,0.9), rgba(224,242,254,0.9))', border: '1px solid rgba(139,92,246,0.15)' }}>
            <p className="text-[9px] font-bold text-violet-700">Pay online via Stripe</p>
          </div>
        </div>
      </div>
    </AppChrome>
  );
}

/* ── Mobile Phone mock ────────────────────────────────────── */
function PhoneMockup() {
  return (
    <div className="mx-auto w-[240px]">
      <div className="overflow-hidden rounded-[28px] border-[6px] border-slate-900" style={{ boxShadow: '0 24px 60px rgba(0,0,0,0.18)' }}>
        {/* Notch */}
        <div className="relative bg-slate-900 flex justify-center pt-1 pb-2">
          <div className="h-4 w-20 rounded-full bg-slate-800" />
        </div>
        <div style={{ background: 'linear-gradient(160deg, #fdf4ff 0%, #f5f3ff 35%, #f0f9ff 100%)' }}>
          {/* Mini dashboard */}
          <div className="p-3">
            <div className="mb-2 rounded-xl p-2.5" style={{ background: 'linear-gradient(135deg, rgba(192,132,252,0.14), rgba(56,189,248,0.09))', border: '1px solid rgba(255,255,255,0.60)' }}>
              <p className="text-[8px] text-slate-400">February 2025</p>
              <p className="text-[10px] font-bold text-slate-900">Good morning, Jake</p>
              <p className="text-[8px] text-slate-500">Collected <span className="font-bold text-violet-600">$62,400</span> this month</p>
            </div>
            <div className="grid grid-cols-2 gap-1.5 mb-2">
              {[
                { label: 'On Hire', val: '7', color: '#f59e0b', bg: 'rgba(255,251,235,0.85)' },
                { label: 'Available', val: '4', color: '#10b981', bg: 'rgba(236,253,245,0.85)' },
              ].map((s) => (
                <div key={s.label} className="rounded-lg p-2" style={{ background: s.bg, border: '1px solid rgba(255,255,255,0.60)' }}>
                  <p className="text-[7px] text-slate-500">{s.label}</p>
                  <p className="text-sm font-black" style={{ color: s.color }}>{s.val}</p>
                </div>
              ))}
            </div>
            <div className="rounded-xl p-2" style={{ background: 'rgba(255,255,255,0.70)', border: '1px solid rgba(255,255,255,0.60)' }}>
              <p className="text-[8px] font-bold text-slate-700 mb-1">Attention</p>
              {[
                { label: '2 overdue invoices', color: '#ef4444' },
                { label: '1 quote expiring today', color: '#f59e0b' },
                { label: '1 overdue return', color: '#8b5cf6' },
              ].map((a) => (
                <div key={a.label} className="flex items-center gap-1.5 mb-0.5">
                  <div className="size-1 rounded-full" style={{ background: a.color }} />
                  <span className="text-[7px] text-slate-600">{a.label}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Bottom nav */}
          <div className="flex justify-around border-t py-2 px-2" style={{ background: 'rgba(255,255,255,0.85)', borderColor: 'rgba(255,255,255,0.50)' }}>
            {['Home', 'Fleet', 'Jobs', 'More'].map((tab) => (
              <div key={tab} className="flex flex-col items-center">
                <div className="size-3 mb-0.5 rounded-sm" style={{ background: tab === 'Home' ? '#7c3aed' : '#cbd5e1' }} />
                <span className="text-[6px]" style={{ color: tab === 'Home' ? '#7c3aed' : '#94a3b8' }}>{tab}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Data ─────────────────────────────────────────────────── */
const features: { Icon: LucideIcon; color: string; title: string; desc: string }[] = [
  { Icon: Truck,        color: '#f59e0b', title: 'Fleet Management',     desc: 'Track every machine \u2014 status, availability, service history, photos, location, and hire rates. Know what\u2019s out, what\u2019s available, and what needs a service at a glance.' },
  { Icon: CalendarDays, color: '#7c3aed', title: 'Job Scheduling',       desc: 'Book jobs in seconds with the 4-step wizard. Conflicts flagged automatically. Never double-book a machine again.' },
  { Icon: Users,        color: '#10b981', title: 'Customer CRM',         desc: 'Full customer database with ABN, contact details, hire history, invoice history, and lifetime value per customer.' },
  { Icon: FileText,     color: '#0284c7', title: 'Quotes & Acceptance',  desc: 'Professional quotes sent instantly via link or email. Customers accept online. Convert to booking with one click.' },
  { Icon: Receipt,      color: '#ea580c', title: 'Invoicing & Payments', desc: 'GST-compliant invoices with Stripe card payments, partial payments, automatic overdue tracking, and branded PDFs.' },
  { Icon: BarChart3,    color: '#0d9488', title: 'Reports & BAS',        desc: 'P&L, GST summary for BAS, revenue by machine, expense tracking across 12 categories \u2014 all calculated automatically.' },
  { Icon: Wrench,       color: '#d97706', title: 'Maintenance Tracking', desc: 'Log services, inspections, repairs, and certifications. Get alerts when service is due. Keep your fleet compliant.' },
  { Icon: DollarSign,   color: '#dc2626', title: 'Expense Tracking',     desc: 'Track fuel, insurance, wages, maintenance costs and more across 12 categories. Upload receipts. Link expenses to machines and jobs.' },
  { Icon: Users,        color: '#9333ea', title: 'Team Management',      desc: 'Invite team members with Admin, User, or Viewer roles. Everyone sees the same data. Control who can do what.' },
  { Icon: Smartphone,   color: '#8b5cf6', title: 'Mobile Optimised',     desc: 'Fully responsive \u2014 works perfectly on your phone, tablet, and desktop. Manage your fleet from anywhere on site.' },
  { Icon: Lock,         color: '#3b82f6', title: 'Secure & Australian',  desc: 'Built on enterprise-grade infrastructure with row-level security. Your data is isolated and encrypted. Hosted in Australia.' },
];

const testimonials = [
  {
    quote: "Finally something built for us. I was running everything on spreadsheets. Hasky replaced all of it — and it's actually free.",
    name: 'Matt H.', role: 'Earthmoving operator · QLD',
    avatar: 'MH', grad: 'from-violet-500 to-indigo-600',
  },
  {
    quote: "Sending invoices used to take me an hour. Now it's two minutes. Customers pay by card straight from the invoice. Game changer.",
    name: 'Tanya C.', role: 'Plant hire business · NSW',
    avatar: 'TC', grad: 'from-sky-500 to-cyan-600',
  },
  {
    quote: "The fleet view alone is worth it. I know what's out, what's available and what needs a service. From my phone, any time.",
    name: 'Ryan B.', role: 'Crane hire · WA',
    avatar: 'RB', grad: 'from-emerald-500 to-teal-600',
  },
  {
    quote: "The job scheduling wizard is brilliant. I can book a job in under two minutes. Double-booking protection gives me peace of mind.",
    name: 'Dave K.', role: 'Equipment hire · VIC',
    avatar: 'DK', grad: 'from-amber-500 to-orange-600',
  },
  {
    quote: "BAS time used to be a nightmare. Now I just pull up the GST summary and send it to my accountant. Done in five minutes.",
    name: 'Sarah L.', role: 'Civil plant hire · SA',
    avatar: 'SL', grad: 'from-rose-500 to-pink-600',
  },
  {
    quote: "My team can all log in and see the same data. No more texting me to ask if a machine is available. It's all right there.",
    name: 'Chris P.', role: 'Mining equipment hire · WA',
    avatar: 'CP', grad: 'from-teal-500 to-cyan-600',
  },
];

const comparisonRows = [
  { feature: 'Fleet tracking & status',         hasky: true,  spreadsheet: false, expensive: true  },
  { feature: 'Job scheduling & booking wizard',  hasky: true,  spreadsheet: false, expensive: true  },
  { feature: 'Double-booking prevention',         hasky: true,  spreadsheet: false, expensive: true  },
  { feature: 'Customer CRM with history',         hasky: true,  spreadsheet: false, expensive: true  },
  { feature: 'Professional quotes with online acceptance', hasky: true,  spreadsheet: false, expensive: true },
  { feature: 'GST-compliant invoicing',           hasky: true,  spreadsheet: false, expensive: true  },
  { feature: 'Stripe card payments built in',     hasky: true,  spreadsheet: false, expensive: true  },
  { feature: 'Partial payment tracking',          hasky: true,  spreadsheet: false, expensive: false },
  { feature: 'Maintenance tracking & alerts',     hasky: true,  spreadsheet: false, expensive: true  },
  { feature: 'Expense tracking (12 categories)',  hasky: true,  spreadsheet: false, expensive: true  },
  { feature: 'P&L reports & GST summary for BAS', hasky: true,  spreadsheet: false, expensive: true  },
  { feature: 'Revenue by machine analytics',      hasky: true,  spreadsheet: false, expensive: false },
  { feature: 'Branded PDF invoices & quotes',     hasky: true,  spreadsheet: false, expensive: true  },
  { feature: 'Team roles (Admin/User/Viewer)',    hasky: true,  spreadsheet: false, expensive: true  },
  { feature: 'Mobile optimised',                  hasky: true,  spreadsheet: false, expensive: true  },
  { feature: 'Built for Australian machinery hire', hasky: true,  spreadsheet: false, expensive: false },
  { feature: 'Price',                             hasky: '$0',  spreadsheet: '$0', expensive: '$200+/mo' },
];

/* ── Page ─────────────────────────────────────────────────── */
export default function LandingPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: 'var(--gradient-bg)' }}>
        <div className="size-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <LandingLayout>
      {/* ── Hero ─────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-6 pb-20 pt-24 lg:px-12 lg:pt-32">
        <div
          className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 rounded-full opacity-40 blur-3xl"
          style={{ width: 800, height: 500, background: 'radial-gradient(ellipse, rgba(192,132,252,0.18) 0%, rgba(56,189,248,0.10) 50%, transparent 80%)' }}
        />

        <motion.div
          className="relative mx-auto max-w-5xl text-center"
          variants={stagger}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={fadeUp} className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold" style={{ background: 'rgba(139,92,246,0.10)', border: '1px solid rgba(139,92,246,0.22)', color: '#6d28d9' }}>
            <Sparkles className="size-3.5" />
            Australia's only completely free machinery CRM
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="mb-6 text-5xl font-black leading-[1.04] tracking-tight text-slate-900 sm:text-6xl lg:text-7xl xl:text-8xl"
          >
            Run your hire<br />
            business.{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #c084fc 0%, #818cf8 45%, #38bdf8 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Not a spreadsheet.
            </span>
          </motion.h1>

          <motion.p variants={fadeUp} className="mx-auto mb-10 max-w-2xl text-lg text-slate-500 sm:text-xl">
            Fleet management, job scheduling, CRM, quotes, invoices, maintenance logs, expense tracking, and reports —
            all in one app built for machinery hire.{' '}
            <strong className="font-bold text-slate-800">100% free. Forever.</strong>
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              to="/signup"
              className="group flex items-center gap-2 rounded-2xl px-8 py-4 text-base font-bold text-white shadow-xl transition-all hover:-translate-y-0.5 hover:brightness-110 hover:shadow-2xl active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9, #4f46e5)', boxShadow: '0 8px 28px rgba(124,58,237,0.35)' }}
            >
              Start for free — no credit card
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              to="/how-it-works"
              className="flex items-center gap-2 rounded-2xl px-8 py-4 text-base font-semibold text-slate-600 transition-all hover:text-slate-900"
              style={{ background: 'rgba(255,255,255,0.72)', border: '1px solid rgba(255,255,255,0.60)', backdropFilter: 'blur(12px)', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}
            >
              See how it works
            </Link>
          </motion.div>

          <motion.div variants={fadeUp} className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-slate-500">
            {['No credit card required', 'Unlimited machines', 'Setup in minutes', 'Works on mobile'].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-violet-500" />
                {t}
              </span>
            ))}
          </motion.div>
        </motion.div>

        <motion.div
          className="relative mx-auto mt-16 max-w-5xl"
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] as const }}
        >
          <div className="pointer-events-none absolute -inset-12 rounded-3xl blur-3xl opacity-30" style={{ background: 'radial-gradient(ellipse at 50% 100%, rgba(192,132,252,0.25) 0%, transparent 70%)' }} />
          <DashboardScreenshot />
        </motion.div>
      </section>

      {/* ── Industry strip ───────────────────────────────── */}
      <div
        className="border-y px-6 py-10"
        style={{ background: 'rgba(255,255,255,0.50)', borderColor: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(8px)' }}
      >
        <p className="mb-6 text-center text-xs font-bold uppercase tracking-widest text-slate-400">
          Built for every kind of machinery hire
        </p>
        <div className="mx-auto flex max-w-5xl flex-wrap justify-center gap-3">
          {['Excavators', 'Tipper Trucks', 'Cranes', 'Skid Steers', 'Forklifts', 'Rollers & Pavers', 'Water Carts', 'Telehandlers', 'Boom Lifts', 'Scissor Lifts', 'Generators', 'Light Towers', 'Compressors', 'Graders', 'Dozers'].map((item) => (
            <span
              key={item}
              className="rounded-full px-4 py-2 text-sm font-medium text-slate-600"
              style={{ background: 'rgba(255,255,255,0.72)', border: '1px solid rgba(255,255,255,0.60)', backdropFilter: 'blur(8px)' }}
            >
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* ── Stats / Social Proof ─────────────────────────── */}
      <section className="px-6 py-20 lg:px-12">
        <motion.div
          className="mx-auto max-w-5xl"
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <p className="mb-8 text-center text-xs font-bold uppercase tracking-widest text-slate-400">
            Built for serious operators
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: Zap,        val: '17',       label: 'Machine categories supported', color: '#f59e0b' },
              { icon: Clock,      val: '<2 min',   label: 'Average time to book a job',   color: '#7c3aed' },
              { icon: CreditCard, val: '$0',        label: 'Cost — free forever',          color: '#10b981' },
              { icon: Shield,     val: '100%',      label: 'Data encrypted & isolated',    color: '#3b82f6' },
            ].map((stat) => (
              <div
                key={stat.label}
                className="relative overflow-hidden rounded-2xl p-6 text-center"
                style={{
                  background: 'rgba(255,255,255,0.72)',
                  backdropFilter: 'blur(14px)',
                  border: '1px solid rgba(255,255,255,0.62)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                }}
              >
                <div className="absolute inset-x-0 top-0 h-[3px]" style={{ background: `linear-gradient(90deg, ${stat.color}66, ${stat.color})` }} />
                <stat.icon className="mx-auto mb-3 size-6" style={{ color: stat.color }} />
                <p className="text-3xl font-black text-slate-900">{stat.val}</p>
                <p className="mt-1 text-sm text-slate-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── $0 callout ───────────────────────────────────── */}
      <section className="px-6 py-12 lg:px-12">
        <div
          className="mx-auto max-w-4xl overflow-hidden rounded-3xl p-12 text-center"
          style={{
            background: 'linear-gradient(135deg, rgba(192,132,252,0.12) 0%, rgba(255,255,255,0.80) 50%, rgba(56,189,248,0.08) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.70)',
            boxShadow: '0 8px 40px rgba(139,92,246,0.10)',
          }}
        >
          <div
            className="mb-2 text-[100px] font-black leading-none tracking-tighter sm:text-[140px]"
            style={{ background: 'linear-gradient(135deg, #8b5cf6, #38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}
          >
            $0
          </div>
          <p className="mb-2 text-xl font-bold text-slate-900">Completely free. No trials. No limits. No catch.</p>
          <p className="mx-auto mb-8 max-w-lg text-sm text-slate-500">
            The only fully free CRM and scheduling platform built specifically for machinery hire businesses in Australia.
            Unlimited machines, unlimited customers, unlimited invoices — free forever.
          </p>
          <Link to="/signup" className={`inline-flex items-center gap-2 ${ctaBtnClass}`} style={{ ...ctaBtnStyle, padding: '14px 32px', fontSize: '15px' }}>
            Get started — it's free
          </Link>
          <p className="mt-5 text-xs text-slate-400">
            ✔ Unlimited machines · ✔ Unlimited customers · ✔ Unlimited invoices · ✔ No credit card ever
          </p>
        </div>
      </section>

      {/* ── Feature cards (12 features) ──────────────────── */}
      <section className="px-6 py-24 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <p className="mb-3 text-sm font-bold uppercase tracking-widest" style={{ color: '#7c3aed' }}>Everything included</p>
          <h2 className="mb-4 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">One app. Everything you need.</h2>
          <p className="mb-12 max-w-xl text-lg text-slate-500">
            From the first phone call to the final payment — Hasky handles the full lifecycle of every hire job. Here's everything that's included for free.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.04, ease: [0.25, 0.46, 0.45, 0.94] as const }}
                className="group rounded-2xl p-6 transition-all hover:-translate-y-1 hover:shadow-xl"
                style={{
                  background: 'rgba(255,255,255,0.72)',
                  border: '1px solid rgba(255,255,255,0.62)',
                  backdropFilter: 'blur(14px)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                }}
              >
                <div className="mb-4 flex size-10 items-center justify-center rounded-xl" style={{ background: `${f.color}12`, border: `1px solid ${f.color}22` }}>
                  <f.Icon className="size-5" style={{ color: f.color }} />
                </div>
                <h3 className="mb-2 text-base font-bold text-slate-900">{f.title}</h3>
                <p className="text-sm leading-relaxed text-slate-500">{f.desc}</p>
              </motion.div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link to="/features" className="text-sm font-semibold text-violet-600 hover:text-violet-700">
              See every feature in detail with screenshots →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Deep dive: Accounting & BAS ──────────────────── */}
      <section className="px-6 py-20 lg:px-12">
        <motion.div
          className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={stagger}
        >
          <motion.div variants={fadeUp} className="order-2 lg:order-1">
            <AccountingScreenshot />
          </motion.div>
          <motion.div variants={fadeUp} className="order-1 lg:order-2">
            <span className="mb-4 inline-block rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-bold uppercase tracking-widest text-teal-700">
              Accounting & BAS
            </span>
            <h2 className="mb-4 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
              Know your numbers. BAS-ready.
            </h2>
            <p className="mb-6 text-base leading-relaxed text-slate-500">
              Revenue, expenses, profit & loss, and GST summary — all calculated automatically. Stop spending hours preparing for BAS. Your accountant will thank you.
            </p>
            <ul className="space-y-3">
              {[
                'Profit & Loss reports by month, quarter, or custom date range',
                'GST collected and paid — ready for BAS lodgement',
                'Revenue broken down by machine to find your top earners',
                'Expense tracking across 12 categories with receipt uploads',
                'Net profit and margin percentage per machine',
              ].map((p) => (
                <li key={p} className="flex items-start gap-3 text-sm text-slate-600">
                  <BarChart3 className="mt-0.5 size-4 shrink-0 text-teal-500" />
                  {p}
                </li>
              ))}
            </ul>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Deep dive: Invoices & Payments ────────────────── */}
      <section className="px-6 py-20 lg:px-12">
        <motion.div
          className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={stagger}
        >
          <motion.div variants={fadeUp}>
            <span className="mb-4 inline-block rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-bold uppercase tracking-widest text-orange-700">
              Invoicing & Payments
            </span>
            <h2 className="mb-4 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
              Professional invoices. Get paid faster.
            </h2>
            <p className="mb-6 text-base leading-relaxed text-slate-500">
              Generate branded PDF invoices from any booking in seconds. Share via link or email. Your customers can pay by card directly — no separate payment app needed. Track partial payments, deposits, and overdue invoices automatically.
            </p>
            <ul className="space-y-3">
              {[
                'Branded PDF invoices with your company logo and details',
                'One-click invoice generation from any booking',
                'Share via secure link — customers pay online via Stripe',
                'Partial payment tracking — record deposits and progress payments',
                'Automatic overdue detection — invoices marked overdue daily',
                'Payment plans: deposit, upfront, or on completion',
              ].map((p) => (
                <li key={p} className="flex items-start gap-3 text-sm text-slate-600">
                  <Receipt className="mt-0.5 size-4 shrink-0 text-orange-500" />
                  {p}
                </li>
              ))}
            </ul>
          </motion.div>
          <motion.div variants={fadeUp}>
            <InvoicePDFScreenshot />
          </motion.div>
        </motion.div>
      </section>

      {/* ── Mobile section ───────────────────────────────── */}
      <section
        className="border-y px-6 py-24 lg:px-12"
        style={{ background: 'rgba(255,255,255,0.42)', borderColor: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(8px)' }}
      >
        <motion.div
          className="mx-auto grid max-w-5xl items-center gap-12 lg:grid-cols-2"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-80px' }}
          variants={stagger}
        >
          <motion.div variants={fadeUp} className="order-2 lg:order-1 flex justify-center">
            <PhoneMockup />
          </motion.div>
          <motion.div variants={fadeUp} className="order-1 lg:order-2">
            <span className="mb-4 inline-block rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-bold uppercase tracking-widest text-violet-700">
              Works Everywhere
            </span>
            <h2 className="mb-4 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
              Run your business from your pocket.
            </h2>
            <p className="mb-6 text-base leading-relaxed text-slate-500">
              Hasky is fully mobile-optimised. Check fleet status, book jobs, send quotes, and manage invoices — all from your phone on site. No app download needed — just open your browser.
            </p>
            <ul className="space-y-3">
              {[
                'Fully responsive — phone, tablet, and desktop',
                'Mobile bottom navigation for easy one-handed use',
                'Dashboard with attention items — see overdue invoices and returns',
                'Book a job from your phone in under 2 minutes',
                'No app store download required — works in any browser',
              ].map((p) => (
                <li key={p} className="flex items-start gap-3 text-sm text-slate-600">
                  <Smartphone className="mt-0.5 size-4 shrink-0 text-violet-500" />
                  {p}
                </li>
              ))}
            </ul>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Comparison table ─────────────────────────────── */}
      <section className="px-6 py-24 lg:px-12">
        <div className="mx-auto max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <p className="mb-3 text-sm font-bold uppercase tracking-widest" style={{ color: '#7c3aed' }}>Why Hasky?</p>
            <h2 className="mb-4 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
              Compare the options.
            </h2>
            <p className="mb-10 max-w-xl text-lg text-slate-500">
              See how Hasky stacks up against spreadsheets and expensive hire software.
            </p>
          </motion.div>

          <motion.div
            className="overflow-hidden rounded-2xl"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            style={{
              background: 'rgba(255,255,255,0.80)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.70)',
              boxShadow: '0 8px 40px rgba(100,60,180,0.08)',
            }}
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr style={{ background: 'linear-gradient(135deg, rgba(245,243,255,0.95), rgba(224,242,254,0.80))' }}>
                    <th className="px-5 py-4 text-left text-sm font-bold text-slate-700">Feature</th>
                    <th className="px-4 py-4 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        <div className="flex size-6 items-center justify-center rounded-lg text-[8px] font-black text-white" style={{ background: 'linear-gradient(135deg, #c084fc, #818cf8, #38bdf8)' }}>H</div>
                        <span className="text-sm font-black text-slate-900">Hasky</span>
                      </div>
                    </th>
                    <th className="px-4 py-4 text-center text-sm font-semibold text-slate-500">Spreadsheets</th>
                    <th className="px-4 py-4 text-center text-sm font-semibold text-slate-500">Expensive Software</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonRows.map((row, i) => (
                    <tr key={row.feature} style={{ background: i % 2 === 0 ? 'transparent' : 'rgba(245,243,255,0.25)', borderBottom: '1px solid rgba(200,180,240,0.12)' }}>
                      <td className="px-5 py-3 text-sm text-slate-700">{row.feature}</td>
                      <td className="px-4 py-3 text-center">
                        {typeof row.hasky === 'boolean' ? (
                          row.hasky ? <Check className="mx-auto size-5 text-emerald-500" /> : <X className="mx-auto size-5 text-slate-300" />
                        ) : (
                          <span className="text-sm font-black" style={{ background: 'linear-gradient(135deg, #8b5cf6, #38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{row.hasky}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {typeof row.spreadsheet === 'boolean' ? (
                          row.spreadsheet ? <Check className="mx-auto size-5 text-emerald-500" /> : <X className="mx-auto size-5 text-slate-300" />
                        ) : (
                          <span className="text-sm font-semibold text-slate-600">{row.spreadsheet}</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {typeof row.expensive === 'boolean' ? (
                          row.expensive ? <Check className="mx-auto size-5 text-emerald-500" /> : <X className="mx-auto size-5 text-slate-300" />
                        ) : (
                          <span className="text-sm font-semibold text-red-500">{row.expensive}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Integrations / Trust ─────────────────────────── */}
      <section
        className="border-y px-6 py-20 lg:px-12"
        style={{ background: 'rgba(255,255,255,0.42)', borderColor: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(8px)' }}
      >
        <div className="mx-auto max-w-5xl text-center">
          <p className="mb-3 text-sm font-bold uppercase tracking-widest" style={{ color: '#7c3aed' }}>Powered by the best</p>
          <h2 className="mb-4 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Built on enterprise-grade infrastructure.</h2>
          <p className="mx-auto mb-12 max-w-2xl text-base text-slate-500">
            Hasky is built with the same technology used by the world's largest companies. Your data is secure, fast, and always available.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { name: 'Stripe', desc: 'PCI-compliant card payments. Your customers pay securely.', icon: CreditCard, color: '#635bff' },
              { name: 'Supabase', desc: 'Enterprise PostgreSQL database with row-level security.', icon: Shield, color: '#3ecf8e' },
              { name: 'Resend', desc: 'Reliable email delivery for invoices, quotes, and reminders.', icon: FileText, color: '#000' },
              { name: 'React', desc: 'Fast, modern UI that works across all devices and browsers.', icon: Zap, color: '#61dafb' },
            ].map((tech) => (
              <div
                key={tech.name}
                className="rounded-2xl p-6 text-center"
                style={{
                  background: 'rgba(255,255,255,0.72)',
                  border: '1px solid rgba(255,255,255,0.62)',
                  backdropFilter: 'blur(14px)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                }}
              >
                <tech.icon className="mx-auto mb-3 size-7" style={{ color: tech.color }} />
                <p className="mb-1 text-base font-bold text-slate-900">{tech.name}</p>
                <p className="text-sm text-slate-500">{tech.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Key capabilities strip ───────────────────────── */}
      <section className="px-6 py-20 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <p className="mb-3 text-center text-sm font-bold uppercase tracking-widest" style={{ color: '#7c3aed' }}>Why operators love Hasky</p>
          <h2 className="mb-12 text-center text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Designed for the way you actually work.</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Wrench,     color: '#f59e0b', title: 'Maintenance Alerts',       desc: 'Track service history, inspections, and certifications. Get alerts when service is due so nothing falls through the cracks.' },
              { icon: Users,      color: '#10b981', title: 'Team Roles',               desc: 'Invite your whole team with Admin, User, or Viewer roles. Everyone stays in the loop without compromising control.' },
              { icon: FileText,   color: '#0284c7', title: 'Document Sharing',         desc: 'Share quotes and invoices via secure link. Your customers view and act on them without needing to create an account.' },
              { icon: TrendingUp, color: '#8b5cf6', title: 'Machine Profitability',    desc: 'See revenue, expenses, and net profit per machine. Know which machines are earning their keep and which aren\'t.' },
              { icon: Receipt,    color: '#ea580c', title: 'Partial Payments',         desc: 'Record deposits and progress payments. Track outstanding balances. Invoices auto-update when fully paid.' },
              { icon: Shield,     color: '#0d9488', title: 'Double-Booking Prevention', desc: 'Database-level protection ensures you can never accidentally double-book a machine. Conflicts flagged before they happen.' },
            ].map((cap) => (
              <motion.div
                key={cap.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
                className="flex gap-4 rounded-2xl p-5"
                style={{
                  background: 'rgba(255,255,255,0.72)',
                  border: '1px solid rgba(255,255,255,0.62)',
                  backdropFilter: 'blur(14px)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                }}
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-xl" style={{ background: `${cap.color}12`, border: `1px solid ${cap.color}22` }}>
                  <cap.icon className="size-5" style={{ color: cap.color }} />
                </div>
                <div>
                  <h3 className="mb-1 text-sm font-bold text-slate-900">{cap.title}</h3>
                  <p className="text-sm leading-relaxed text-slate-500">{cap.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ─────────────────────────────────── */}
      <section
        className="border-y px-6 py-24 lg:px-12"
        style={{ background: 'rgba(255,255,255,0.42)', borderColor: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(8px)' }}
      >
        <div className="mx-auto max-w-6xl">
          <p className="mb-3 text-sm font-bold uppercase tracking-widest" style={{ color: '#7c3aed' }}>Trusted by tradies</p>
          <h2 className="mb-12 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">What hire operators are saying.</h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.06, ease: [0.25, 0.46, 0.45, 0.94] as const }}
                className="rounded-2xl p-7"
                style={{
                  background: 'rgba(255,255,255,0.78)',
                  border: '1px solid rgba(255,255,255,0.65)',
                  backdropFilter: 'blur(16px)',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
                }}
              >
                <div className="mb-4 text-amber-400">★★★★★</div>
                <p className="mb-6 text-base italic leading-relaxed text-slate-700">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className={`flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${t.grad} text-sm font-bold text-white`}>
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────── */}
      <section className="px-6 py-28 text-center lg:px-12">
        <div className="mx-auto max-w-2xl">
          <div
            className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold"
            style={{ background: 'rgba(139,92,246,0.10)', border: '1px solid rgba(139,92,246,0.22)', color: '#6d28d9' }}
          >
            <span className="size-2 animate-pulse rounded-full bg-violet-500" />
            Free. Always.
          </div>
          <h2 className="mb-5 text-4xl font-black tracking-tight text-slate-900 sm:text-6xl">
            Ready to run a tighter operation?
          </h2>
          <p className="mb-10 text-lg text-slate-500">
            Join machinery hire businesses across Australia using Hasky to save time, get paid faster, and grow. Setup takes under 2 minutes.
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              to="/signup"
              className="rounded-2xl px-10 py-4 font-bold text-white transition-all hover:-translate-y-0.5 hover:brightness-110 hover:shadow-xl active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)', boxShadow: '0 6px 24px rgba(124,58,237,0.30)' }}
            >
              Create your free account
            </Link>
            <Link
              to="/login"
              className="rounded-2xl px-10 py-4 font-semibold text-slate-600 transition-all hover:text-slate-900"
              style={{ background: 'rgba(255,255,255,0.72)', border: '1px solid rgba(255,255,255,0.60)', backdropFilter: 'blur(12px)', boxShadow: '0 4px 16px rgba(0,0,0,0.05)' }}
            >
              Sign in
            </Link>
          </div>
          <p className="mt-6 text-sm text-slate-400">No credit card. No trial. No cost. Ever.</p>
        </div>
      </section>
    </LandingLayout>
  );
}
