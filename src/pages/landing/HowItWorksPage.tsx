import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { LandingLayout, ctaBtnClass, ctaBtnStyle } from '../../components/landing/LandingLayout';

// ── Step visuals (updated to glass style) ─────────────────────────────────

function AppChrome({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="overflow-hidden rounded-2xl"
      style={{
        boxShadow: '0 24px 80px rgba(100,60,180,0.14), 0 4px 24px rgba(0,0,0,0.07)',
        border: '1px solid rgba(255,255,255,0.70)',
      }}
    >
      <div
        className="flex h-8 items-center gap-2 px-3"
        style={{
          background: 'rgba(240,234,255,0.85)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(200,180,240,0.30)',
        }}
      >
        <div className="size-2.5 rounded-full bg-[#FF5F57]" />
        <div className="size-2.5 rounded-full bg-[#FEBC2E]" />
        <div className="size-2.5 rounded-full bg-[#28C840]" />
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

function AddMachineVisual() {
  return (
    <AppChrome>
      <div style={{ background: glassBg, padding: '16px' }}>
        <div className="rounded-2xl p-4" style={glassCard}>
          <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Add New Machine</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Machine Name', val: 'Bobcat S650' },
              { label: 'Category', val: 'Skid Steer Loader' },
              { label: 'Daily Rate', val: '$480.00' },
              { label: 'Status', val: 'Available' },
            ].map((f) => (
              <div key={f.label}>
                <p className="mb-0.5 text-[9px] font-medium text-slate-400">{f.label}</p>
                <div
                  className="rounded-lg px-2 py-1.5 text-[10px] font-semibold text-slate-800"
                  style={{ background: 'rgba(245,243,255,0.80)', border: '1px solid rgba(200,180,240,0.30)' }}
                >
                  {f.val}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-end">
            <div
              className="rounded-xl px-3 py-1.5 text-[10px] font-bold text-white"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}
            >
              Save Machine
            </div>
          </div>
        </div>
      </div>
    </AppChrome>
  );
}

function BookingWizardVisual() {
  return (
    <AppChrome>
      <div style={{ background: glassBg, padding: '16px' }}>
        <div className="rounded-2xl p-4" style={glassCard}>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-bold text-slate-700">New Job — Step 2 of 4</p>
            <p className="text-[10px] text-slate-400">Machine selected ✓</p>
          </div>
          <div className="mb-3 flex gap-1">
            {['Machine', 'Customer', 'Dates', 'Details'].map((s, i) => (
              <div
                key={s}
                className="flex-1 rounded-full py-1 text-center text-[9px] font-bold"
                style={
                  i <= 1
                    ? { background: 'rgba(245,243,255,0.90)', color: '#6d28d9', border: '1px solid rgba(139,92,246,0.25)' }
                    : { background: 'rgba(248,250,252,0.80)', color: '#94a3b8' }
                }
              >
                {s}
              </div>
            ))}
          </div>
          <div className="space-y-2">
            {[
              { label: 'Customer', val: 'Smith Constructions' },
              { label: 'Contact', val: 'Jake Smith · 0412 345 678' },
              { label: 'Job Address', val: '42 George St, Sydney NSW' },
            ].map((f) => (
              <div key={f.label} className="flex items-center justify-between border-b py-1" style={{ borderColor: 'rgba(200,180,240,0.20)' }}>
                <span className="text-[9px] text-slate-400">{f.label}</span>
                <span className="text-[10px] font-semibold text-slate-800">{f.val}</span>
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-between">
            <div
              className="rounded-xl px-3 py-1.5 text-[10px] font-medium text-slate-500"
              style={{ background: 'rgba(248,250,252,0.90)', border: '1px solid rgba(200,180,240,0.25)' }}
            >
              ← Back
            </div>
            <div
              className="rounded-xl px-3 py-1.5 text-[10px] font-bold text-white"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}
            >
              Next →
            </div>
          </div>
        </div>
      </div>
    </AppChrome>
  );
}

function InvoiceVisual() {
  return (
    <AppChrome>
      <div style={{ background: glassBg, padding: '16px' }}>
        <div className="rounded-2xl p-4" style={glassCard}>
          <div className="mb-3 flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-orange-500">INV-0042</p>
              <p className="text-sm font-bold text-slate-900">Smith Constructions</p>
            </div>
            <span
              className="rounded-full px-2 py-0.5 text-[9px] font-bold"
              style={{ background: '#fffbeb', color: '#92400e' }}
            >
              Awaiting Payment
            </span>
          </div>
          <div className="mb-3 space-y-1 border-y py-2" style={{ borderColor: 'rgba(200,180,240,0.20)' }}>
            {['20T Excavator — 3 days · $3,600', 'Delivery & Pickup · $480', 'Operator · $1,350', 'GST · $543'].map((l) => (
              <div key={l} className="text-[9px] text-slate-500">{l}</div>
            ))}
          </div>
          <div className="mb-3 flex justify-between">
            <span className="text-[10px] text-slate-500">Total AUD</span>
            <span className="text-xs font-black text-slate-900">$5,973.00</span>
          </div>
          <div
            className="flex items-center justify-between rounded-xl px-3 py-2"
            style={{
              background: 'linear-gradient(135deg,rgba(245,243,255,0.90),rgba(224,242,254,0.90))',
              border: '1px solid rgba(139,92,246,0.20)',
            }}
          >
            <span className="text-[10px] font-bold text-violet-700">💳 Pay by card</span>
            <span className="text-[9px] text-slate-400">Powered by Stripe</span>
          </div>
        </div>
      </div>
    </AppChrome>
  );
}

function ReportsVisual() {
  return (
    <AppChrome>
      <div style={{ background: glassBg, padding: '16px' }}>
        <p className="mb-2 text-xs font-bold text-slate-800">Reports — February 2025</p>
        <div className="mb-2 grid grid-cols-3 gap-2">
          {[
            { label: 'Revenue', val: '$75,100', bg: 'rgba(239,246,255,0.90)', border: '#3b82f6', t: '#1d4ed8' },
            { label: 'Expenses', val: '$18,400', bg: 'rgba(255,247,237,0.90)', border: '#f97316', t: '#c2410c' },
            { label: 'Profit', val: '$56,700', bg: 'rgba(240,253,250,0.90)', border: '#10b981', t: '#047857' },
          ].map((k) => (
            <div
              key={k.label}
              className="rounded-xl p-2"
              style={{ background: k.bg, borderLeft: `3px solid ${k.border}`, border: '1px solid rgba(255,255,255,0.65)', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
            >
              <p className="text-[8px] text-slate-500">{k.label}</p>
              <p className="text-xs font-black" style={{ color: k.t }}>{k.val}</p>
            </div>
          ))}
        </div>
        <div className="rounded-xl p-3" style={glassCard}>
          <p className="mb-2 text-[9px] font-bold text-slate-600">Revenue by Machine</p>
          {[
            { name: 'Excavator', pct: 85, color: '#8b5cf6' },
            { name: 'Tipper', pct: 62, color: '#38bdf8' },
            { name: 'Bobcat', pct: 48, color: '#10b981' },
          ].map((b) => (
            <div key={b.name} className="mb-1.5 flex items-center gap-2">
              <span className="w-12 text-[9px] text-slate-400">{b.name}</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ background: 'rgba(200,180,240,0.20)' }}>
                <div className="h-full rounded-full" style={{ width: `${b.pct}%`, background: b.color }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppChrome>
  );
}

// ── Steps data ─────────────────────────────────────────────────────────────

const steps = [
  {
    number: '01',
    gradientStart: '#f59e0b',
    gradientEnd: '#d97706',
    accentColor: '#f59e0b',
    title: 'Add your fleet',
    desc: "Enter each machine you hire out — name, type, daily rate, and any details. Takes about a minute per machine. You can add them all at once or one at a time as you go.",
    details: [
      'Add machines with name, category, and hire rate',
      'Set status: Available, On Hire, Under Repair, In Transit',
      'Track service history and maintenance notes',
      'Upload photos for each asset',
    ],
    visual: <AddMachineVisual />,
  },
  {
    number: '02',
    gradientStart: '#7c3aed',
    gradientEnd: '#4f46e5',
    accentColor: '#7c3aed',
    title: 'Book jobs instantly',
    desc: "When a customer calls, book the job in under a minute using the 4-step wizard. Pick the machine, customer, dates, and delivery details — Hasky will flag any conflicts automatically.",
    details: [
      '4-step guided booking wizard',
      'Conflict detection prevents double-bookings',
      'Set delivery address, operator, and special notes',
      'Hourly, daily, weekly, or monthly rates',
    ],
    visual: <BookingWizardVisual />,
  },
  {
    number: '03',
    gradientStart: '#0284c7',
    gradientEnd: '#0369a1',
    accentColor: '#0284c7',
    title: 'Send quotes & invoices',
    desc: "Generate a professional quote or invoice in seconds. Share it via a link — your customer gets a clean page where they can accept the quote or pay the invoice by card. No back and forth.",
    details: [
      'Professional branded PDFs in seconds',
      'Share via unique link — no login needed for customers',
      'Customers can accept quotes online',
      'Card payments via Stripe built right in',
    ],
    visual: <InvoiceVisual />,
  },
  {
    number: '04',
    gradientStart: '#0d9488',
    gradientEnd: '#0f766e',
    accentColor: '#0d9488',
    title: 'Track everything',
    desc: "Your dashboard shows everything at a glance — what's out, what's overdue, what's coming up. Reports give you P&L, revenue by machine, and a GST summary ready for your accountant.",
    details: [
      'Live dashboard with fleet status and attention items',
      'Profit & Loss by month or quarter',
      'GST summary for BAS lodgement',
      'Revenue broken down by machine',
    ],
    visual: <ReportsVisual />,
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

export default function HowItWorksPage() {
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
              style={{ background: 'rgba(245,243,255,0.85)', border: '1px solid rgba(139,92,246,0.25)' }}
            >
              How it works
            </span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="mb-5 text-5xl font-black tracking-tight text-slate-900 sm:text-6xl lg:text-7xl"
          >
            Up and running{' '}
            <span
              style={{
                background: 'linear-gradient(135deg,#7c3aed 0%,#4f46e5 60%,#0ea5e9 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              in minutes.
            </span>
          </motion.h1>

          <motion.p variants={fadeUp} className="mx-auto max-w-xl text-lg text-slate-500">
            Hasky is designed for tradies, not accountants. If you can use a smartphone, you can use
            Hasky. Here's the full flow from setup to getting paid.
          </motion.p>
        </motion.div>
      </section>

      {/* ── Steps ─────────────────────────────────────────────────────── */}
      <section className="px-6 pb-24 lg:px-12">
        <div className="mx-auto max-w-6xl space-y-24">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              className={`grid items-center gap-12 lg:grid-cols-2 ${i % 2 !== 0 ? 'lg:[&>*:first-child]:order-2' : ''}`}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-80px' }}
              variants={stagger}
            >
              {/* Text */}
              <motion.div variants={fadeUp}>
                {/* Step number badge */}
                <div
                  className="mb-4 inline-flex size-12 items-center justify-center rounded-2xl text-lg font-black text-white shadow-lg"
                  style={{
                    background: `linear-gradient(135deg,${step.gradientStart},${step.gradientEnd})`,
                    boxShadow: `0 4px 18px ${step.accentColor}40`,
                  }}
                >
                  {step.number}
                </div>
                <h2 className="mb-4 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                  {step.title}
                </h2>
                <p className="mb-6 text-base leading-relaxed text-slate-500">{step.desc}</p>
                <ul className="space-y-3">
                  {step.details.map((d) => (
                    <li key={d} className="flex items-start gap-3 text-sm text-slate-600">
                      <span
                        className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-white text-[10px]"
                        style={{ background: step.accentColor }}
                      >
                        ✓
                      </span>
                      {d}
                    </li>
                  ))}
                </ul>
              </motion.div>

              {/* Visual */}
              <motion.div variants={fadeUp}>
                {step.visual}
              </motion.div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Time estimate cards ───────────────────────────────────────── */}
      <section className="px-6 py-16 lg:px-12">
        <motion.div
          className="mx-auto max-w-4xl"
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="mb-8 text-center text-3xl font-black text-slate-900">
            From sign-up to first booking: under 10 minutes.
          </h2>
          <div className="grid gap-5 sm:grid-cols-3">
            {[
              { time: '2 min', label: 'Create your account', icon: '👤', color: '#7c3aed' },
              { time: '5 min', label: 'Add your machines', icon: '🚜', color: '#f59e0b' },
              { time: '1 min', label: 'Book your first job', icon: '📅', color: '#0d9488' },
            ].map((t, idx) => (
              <motion.div
                key={t.label}
                className="relative overflow-hidden rounded-3xl p-6 text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                style={{
                  background: 'rgba(255,255,255,0.78)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255,255,255,0.72)',
                  boxShadow: '0 4px 20px rgba(100,60,180,0.07)',
                }}
              >
                <div
                  className="absolute inset-x-0 top-0 h-[3px]"
                  style={{ background: `linear-gradient(90deg,${t.color}88,${t.color})` }}
                />
                <div className="mb-3 text-4xl">{t.icon}</div>
                <p className="text-3xl font-black" style={{ color: t.color }}>{t.time}</p>
                <p className="mt-1 text-sm text-slate-500">{t.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────── */}
      <section className="px-6 py-24 text-center lg:px-12">
        <motion.div
          className="relative mx-auto max-w-xl overflow-hidden rounded-3xl px-8 py-14"
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
            style={{ background: 'linear-gradient(90deg,#c084fc,#818cf8,#38bdf8)' }}
          />
          <h2 className="mb-4 text-4xl font-black tracking-tight text-slate-900">
            Ready to give it a go?
          </h2>
          <p className="mb-8 text-lg text-slate-500">
            Free to start. Free forever. No credit card needed.
          </p>
          <Link
            to="/signup"
            className={ctaBtnClass}
            style={{ ...ctaBtnStyle, fontSize: '1rem', padding: '0.875rem 2.5rem', borderRadius: '1rem' }}
          >
            Create your free account →
          </Link>
        </motion.div>
      </section>
    </LandingLayout>
  );
}
