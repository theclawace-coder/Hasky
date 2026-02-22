import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { LandingLayout } from '../../components/landing/LandingLayout';
import { ctaBtnClass, ctaBtnStyle } from '../../components/landing/ctaStyles';
import { useAuth } from '../../hooks/useAuth';

/* â”€â”€ Shared animation variants â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const fadeUp = {
  hidden:  { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
};

/* â”€â”€ Mock app chrome (updated to new glass style) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function AppChrome({ children, title }: { children: React.ReactNode; title?: string }) {
  return (
    <div className="overflow-hidden rounded-2xl shadow-2xl" style={{ boxShadow: '0 32px 80px rgba(139,92,246,0.15), 0 8px 32px rgba(0,0,0,0.10)', border: '1px solid rgba(255,255,255,0.55)' }}>
      {/* Mac-style bar */}
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

/* Glass sidebar matching the new glass-dark sidebar */
function AppSidebar({ active }: { active: string }) {
  const nav = [
    { label: 'Dashboard', dot: '#818cf8' },
    { label: 'Fleet',     dot: '#f59e0b' },
    { label: 'Jobs',      dot: '#8b5cf6' },
    { label: 'Customers', dot: '#10b981' },
    { label: 'Quotes',    dot: '#38bdf8' },
    { label: 'Invoices',  dot: '#f97316' },
    { label: 'Reports',   dot: '#2dd4bf' },
  ];
  return (
    <div className="flex w-44 shrink-0 flex-col p-3" style={{ background: 'rgba(8,6,20,0.88)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
      {/* Logo */}
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

/* Dashboard mock screenshot */
function DashboardScreenshot() {
  return (
    <AppChrome title="hasky.com.au/dashboard">
      <div className="flex" style={{ minHeight: 480, background: 'linear-gradient(160deg, #fdf4ff 0%, #f5f3ff 35%, #f0f9ff 100%)' }}>
        <AppSidebar active="Dashboard" />
        <div className="flex-1 overflow-hidden p-5">
          {/* Hero card */}
          <div className="mb-4 overflow-hidden rounded-2xl p-4" style={{ background: 'linear-gradient(135deg, rgba(192,132,252,0.14), rgba(56,189,248,0.09))', border: '1px solid rgba(255,255,255,0.70)', backdropFilter: 'blur(12px)' }}>
            <p className="text-[9px] text-slate-400">Wednesday, 19 February 2025</p>
            <p className="text-sm font-black text-slate-900">Good morning, <span style={{ background: 'linear-gradient(135deg, #8b5cf6, #38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Jake</span> ðŸ‘‹</p>
            <p className="text-[10px] text-slate-500">You've collected <span className="text-sm font-black" style={{ background: 'linear-gradient(135deg, #8b5cf6, #38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>$62,400</span> this month</p>
          </div>

          {/* Quick action cards */}
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

          {/* Fleet stat cards */}
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

          {/* Recent jobs */}
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

/* â”€â”€ Data â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
const features = [
  { icon: 'ðŸšœ', title: 'Fleet Management',  desc: 'Track every machine â€” status, availability, service history, and hire rates.' },
  { icon: 'ðŸ“…', title: 'Job Scheduling',    desc: 'Book jobs in seconds. Conflicts flagged automatically. Never double-book.' },
  { icon: 'ðŸ‘¥', title: 'Customer CRM',      desc: 'Full customer database with complete hire history and contact details.' },
  { icon: 'ðŸ“„', title: 'Quotes',            desc: 'Professional quotes sent instantly. Customers accept online. One click to invoice.' },
  { icon: 'ðŸ§¾', title: 'Invoicing',         desc: 'GST-compliant invoices with Stripe card payments built right in.' },
  { icon: 'ðŸ“Š', title: 'Reports',           desc: 'P&L, GST summary for BAS, and revenue by machine â€” all calculated automatically.' },
];

const testimonials = [
  {
    quote: "Finally something built for us. I was running everything on spreadsheets. Hasky replaced all of it â€” and it's actually free.",
    name: 'Matt H.', role: 'Earthmoving operator Â· QLD',
    avatar: 'MH', grad: 'from-violet-500 to-indigo-600',
  },
  {
    quote: "Sending invoices used to take me an hour. Now it's two minutes. Customers pay by card straight from the invoice. Game changer.",
    name: 'Tanya C.', role: 'Plant hire business Â· NSW',
    avatar: 'TC', grad: 'from-sky-500 to-cyan-600',
  },
  {
    quote: "The fleet view alone is worth it. I know what's out, what's available and what needs a service. From my phone, any time.",
    name: 'Ryan B.', role: 'Crane hire Â· WA',
    avatar: 'RB', grad: 'from-emerald-500 to-teal-600',
  },
];

/* â”€â”€ Page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
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
      {/* â”€â”€ Hero â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="relative overflow-hidden px-6 pb-20 pt-24 lg:px-12 lg:pt-32">
        {/* Glow orb */}
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
          {/* Badge */}
          <motion.div variants={fadeUp} className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold" style={{ background: 'rgba(139,92,246,0.10)', border: '1px solid rgba(139,92,246,0.22)', color: '#6d28d9' }}>
            <Sparkles className="size-3.5" />
            Australia's only completely free machinery CRM
          </motion.div>

          {/* Headline */}
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
            Fleet management, job scheduling, CRM, quotes, invoices, and reports â€”
            all in one app built for machinery hire.{' '}
            <strong className="font-bold text-slate-800">100% free. Forever.</strong>
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              to="/signup"
              className="group flex items-center gap-2 rounded-2xl px-8 py-4 text-base font-bold text-white shadow-xl transition-all hover:-translate-y-0.5 hover:brightness-110 hover:shadow-2xl active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9, #4f46e5)', boxShadow: '0 8px 28px rgba(124,58,237,0.35)' }}
            >
              Start for free â€” no credit card
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
            {['No credit card required', 'Unlimited machines', 'Setup in minutes'].map((t) => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-violet-500" />
                {t}
              </span>
            ))}
          </motion.div>
        </motion.div>

        {/* App screenshot */}
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

      {/* â”€â”€ Industry strip â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div
        className="border-y px-6 py-10"
        style={{ background: 'rgba(255,255,255,0.50)', borderColor: 'rgba(255,255,255,0.55)', backdropFilter: 'blur(8px)' }}
      >
        <p className="mb-6 text-center text-xs font-bold uppercase tracking-widest text-slate-400">
          Built for every kind of machinery hire
        </p>
        <div className="mx-auto flex max-w-4xl flex-wrap justify-center gap-3">
          {['ðŸšœ Excavators', 'ðŸš› Tipper Trucks', 'ðŸ—ï¸ Cranes', 'âš™ï¸ Skid Steers', 'ðŸ”© Forklifts', 'ðŸ›¤ï¸ Rollers & Pavers', 'ðŸ’§ Water Carts', 'ðŸšï¸ Telehandlers'].map((item) => (
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

      {/* â”€â”€ $0 callout â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="px-6 py-24 lg:px-12">
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
            Unlimited machines, unlimited customers, unlimited invoices â€” free forever.
          </p>
          <Link to="/signup" className={`inline-flex items-center gap-2 ${ctaBtnClass}`} style={{ ...ctaBtnStyle, padding: '14px 32px', fontSize: '15px' }}>
            Get started â€” it's free
          </Link>
          <p className="mt-5 text-xs text-slate-400">
            âœ“ Unlimited machines Â· âœ“ Unlimited customers Â· âœ“ Unlimited invoices Â· âœ“ No credit card ever
          </p>
        </div>
      </section>

      {/* â”€â”€ Feature cards â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="px-6 pb-24 lg:px-12">
        <div className="mx-auto max-w-6xl">
          <p className="mb-3 text-sm font-bold uppercase tracking-widest" style={{ color: '#7c3aed' }}>Everything included</p>
          <h2 className="mb-4 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">One app. Everything you need.</h2>
          <p className="mb-12 max-w-xl text-lg text-slate-500">
            From the first phone call to the final payment â€” Hasky handles the full lifecycle of every hire job.
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.06, ease: [0.25, 0.46, 0.45, 0.94] as const }}
                className="group rounded-2xl p-7 transition-all hover:-translate-y-1 hover:shadow-xl"
                style={{
                  background: 'rgba(255,255,255,0.72)',
                  border: '1px solid rgba(255,255,255,0.62)',
                  backdropFilter: 'blur(14px)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                }}
              >
                <div className="mb-5 text-4xl">{f.icon}</div>
                <h3 className="mb-2 text-lg font-bold text-slate-900">{f.title}</h3>
                <p className="text-sm leading-relaxed text-slate-500">{f.desc}</p>
              </motion.div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <Link to="/features" className="text-sm font-semibold text-violet-600 hover:text-violet-700">
              See every feature in detail â†’
            </Link>
          </div>
        </div>
      </section>

      {/* â”€â”€ Testimonials â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
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
                transition={{ duration: 0.4, delay: i * 0.08, ease: [0.25, 0.46, 0.45, 0.94] as const }}
                className="rounded-2xl p-7"
                style={{
                  background: 'rgba(255,255,255,0.78)',
                  border: '1px solid rgba(255,255,255,0.65)',
                  backdropFilter: 'blur(16px)',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
                }}
              >
                <div className="mb-4 text-amber-400">â˜…â˜…â˜…â˜…â˜…</div>
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

      {/* â”€â”€ CTA â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
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
            Join machinery hire businesses across Australia using Hasky to save time, get paid faster, and grow.
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



