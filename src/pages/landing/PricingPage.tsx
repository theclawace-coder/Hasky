import { motion, type Variants } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Check, X, ArrowRight } from 'lucide-react';
import { LandingLayout } from '../../components/landing/LandingLayout';
import { ctaBtnClass, ctaBtnStyle } from '../../components/landing/ctaStyles';

const everything = [
  'Fleet management — unlimited machines',
  'Job scheduling & 4-step booking wizard',
  'Double-booking prevention (database-level)',
  'Full customer CRM — unlimited contacts',
  'Professional quotes with PDF export',
  'Public quote/invoice sharing links',
  'Online quote acceptance by customers',
  'GST-compliant invoicing',
  'Stripe card payment acceptance',
  'Partial payment tracking (deposits & progress)',
  'Automated overdue invoice detection',
  'Payment reminders via email',
  'Profit & Loss reports',
  'GST summary for BAS lodgement',
  'Revenue reporting by machine',
  'Machine profitability analysis',
  'Expense tracking (12 categories)',
  'Receipt uploads (images & PDFs)',
  'Maintenance tracking & service alerts',
  'Interactive dashboard with attention items',
  'Needs Attention panel (overdue, expiring, pending)',
  'Mobile-optimised interface',
  'Team member access & roles (Admin/User/Viewer)',
  'Company branding on documents & PDFs',
  'Australian address & ABN support',
  '17 machine categories',
  'Auto-generated reference numbers',
  'Booking reference numbers (BOK-XX-001)',
  'Unlimited data storage',
  'Payment plans (deposit, upfront, on completion)',
  'Google Maps address autocomplete',
  'Email delivery via Resend',
  'Row-level security (data isolation)',
  'Guided onboarding wizard',
];

const competitors = [
  {
    name: 'Typical Hire Software',
    price: '$200–$400/mo',
    priceNote: 'Per user pricing adds up fast',
    included: [
      { feature: 'Fleet tracking', yes: true },
      { feature: 'Job scheduling', yes: true },
      { feature: 'Customer CRM', yes: true },
      { feature: 'Invoicing', yes: true },
      { feature: 'Built for Australian hire', yes: false },
      { feature: 'Machine profitability', yes: false },
      { feature: 'Stripe payments built in', yes: true },
      { feature: 'Partial payment tracking', yes: false },
      { feature: 'Maintenance tracking', yes: true },
      { feature: 'Expense tracking', yes: true },
      { feature: 'BAS-ready GST summary', yes: false },
      { feature: 'Machine profitability', yes: false },
      { feature: 'Team roles', yes: true },
      { feature: 'Public document sharing', yes: true },
    ],
  },
  {
    name: 'Generic CRM (Zoho, HubSpot)',
    price: '$50–$150/mo',
    priceNote: 'Not built for hire/rental',
    included: [
      { feature: 'Fleet tracking', yes: false },
      { feature: 'Job scheduling', yes: false },
      { feature: 'Customer CRM', yes: true },
      { feature: 'Invoicing', yes: true },
      { feature: 'Built for Australian hire', yes: false },
      { feature: 'Machine profitability', yes: false },
      { feature: 'Stripe payments built in', yes: false },
      { feature: 'Partial payment tracking', yes: false },
      { feature: 'Maintenance tracking', yes: false },
      { feature: 'Expense tracking', yes: false },
      { feature: 'BAS-ready GST summary', yes: false },
      { feature: 'Machine profitability', yes: false },
      { feature: 'Team roles', yes: true },
      { feature: 'Public document sharing', yes: false },
    ],
  },
  {
    name: 'Spreadsheets',
    price: '$0',
    priceNote: 'Free but no automation',
    included: [
      { feature: 'Fleet tracking', yes: false },
      { feature: 'Job scheduling', yes: false },
      { feature: 'Customer CRM', yes: false },
      { feature: 'Invoicing', yes: false },
      { feature: 'Built for Australian hire', yes: false },
      { feature: 'Machine profitability', yes: false },
      { feature: 'Stripe payments built in', yes: false },
      { feature: 'Partial payment tracking', yes: false },
      { feature: 'Maintenance tracking', yes: false },
      { feature: 'Expense tracking', yes: false },
      { feature: 'BAS-ready GST summary', yes: false },
      { feature: 'Machine profitability', yes: false },
      { feature: 'Team roles', yes: false },
      { feature: 'Public document sharing', yes: false },
    ],
  },
];

const faqs = [
  {
    q: 'Is it really free?',
    a: 'Yes. Hasky is completely free with no hidden fees, no trial period, and no credit card required. Every feature is available to every user at no cost.',
  },
  {
    q: 'How do you make money then?',
    a: "We're building the platform and community for Australian machinery hire businesses. In the future we may offer optional premium add-ons (like cross-hire marketplace features), but the core platform will always be free.",
  },
  {
    q: 'Are there any limits on machines or customers?',
    a: "None. Add as many machines, customers, jobs, quotes, and invoices as you need. We don't impose artificial limits to push you to a paid plan.",
  },
  {
    q: 'Is my data safe?',
    a: 'Yes. Hasky is built on Supabase (PostgreSQL) with row-level security. Your data is isolated from other companies and secured at the database level. Only your team can access your data.',
  },
  {
    q: 'What about Stripe payment fees?',
    a: 'Card payments are processed through Stripe. Stripe charges their standard processing fee (typically ~1.75% + 30¢ for Australian cards). Hasky charges nothing on top of Stripe\'s fees.',
  },
  {
    q: 'Can I invite my whole team?',
    a: 'Yes. Invite unlimited team members with three roles: Admin (full access), User (standard operations), and Viewer (read-only). No per-seat charges.',
  },
  {
    q: 'Do I need to install anything?',
    a: 'No. Hasky is a web app — open it in any browser on your phone, tablet, or desktop. Nothing to download or install. Works offline-ready on mobile.',
  },
  {
    q: 'Can I import my existing data?',
    a: "Reach out to us and we'll help. We can assist with importing customers, machines, and historical data from spreadsheets or other systems.",
  },
];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
};

const stagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

export default function PricingPage() {
  return (
    <LandingLayout>
      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-6 pb-20 pt-24 text-center lg:px-12 lg:pt-32">
        <motion.div
          className="relative mx-auto max-w-3xl"
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
              Pricing
            </span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            className="mb-3 font-black leading-none tracking-tighter"
            style={{
              fontSize: 'clamp(7rem, 22vw, 11rem)',
              background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 50%, #0ea5e9 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            $0
          </motion.h1>

          <motion.p variants={fadeUp} className="mb-3 text-2xl font-bold text-slate-900">
            Completely free. Every feature included.
          </motion.p>
          <motion.p variants={fadeUp} className="mx-auto mb-8 max-w-lg text-lg text-slate-500">
            No trials. No plans. No limits. No catch. Hasky is the only fully free CRM and
            scheduling platform built specifically for machinery hire businesses in Australia.
          </motion.p>

          <motion.div variants={fadeUp}>
            <Link
              to="/signup"
              className={ctaBtnClass}
              style={{ ...ctaBtnStyle, fontSize: '1rem', padding: '0.875rem 2.5rem', borderRadius: '1rem' }}
            >
              Get started — it's free →
            </Link>
            <p className="mt-4 text-sm text-slate-400">No credit card required. No expiry. Ever.</p>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Everything included card ──────────────────────────────── */}
      <section className="px-6 py-20 lg:px-12">
        <div className="mx-auto max-w-4xl">
          <motion.div
            className="overflow-hidden rounded-3xl"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55 }}
            style={{
              background: 'rgba(255,255,255,0.78)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.72)',
              boxShadow: '0 16px 64px rgba(100,60,180,0.10), 0 4px 16px rgba(0,0,0,0.06)',
            }}
          >
            <div
              className="relative overflow-hidden border-b p-8"
              style={{
                background: 'linear-gradient(135deg, rgba(245,243,255,0.90) 0%, rgba(224,242,254,0.70) 100%)',
                borderColor: 'rgba(200,180,240,0.25)',
              }}
            >
              <div
                className="absolute inset-x-0 top-0 h-[3px]"
                style={{ background: 'linear-gradient(90deg,#c084fc,#818cf8,#38bdf8)' }}
              />
              <div className="flex items-center gap-4">
                <div
                  className="flex size-14 items-center justify-center rounded-2xl font-black text-2xl text-white shadow-lg"
                  style={{
                    background: 'linear-gradient(135deg,#c084fc,#818cf8,#38bdf8)',
                    boxShadow: '0 0 20px rgba(192,132,252,0.35)',
                  }}
                >
                  H
                </div>
                <div>
                  <p className="text-xl font-black text-slate-900">Hasky</p>
                  <p className="text-sm text-slate-500">Everything. Always free. {everything.length} features included.</p>
                </div>
                <div className="ml-auto text-right">
                  <p
                    className="text-4xl font-black"
                    style={{
                      background: 'linear-gradient(135deg,#7c3aed,#0ea5e9)',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    $0
                  </p>
                  <p className="text-sm text-slate-400">/ forever</p>
                </div>
              </div>
            </div>

            <div className="p-8">
              <p className="mb-6 text-xs font-bold uppercase tracking-widest text-slate-400">
                Everything included — {everything.length} features
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                {everything.map((item) => (
                  <div key={item} className="flex items-start gap-3 text-sm text-slate-600">
                    <span
                      className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-white text-[10px]"
                      style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}
                    >
                      <Check className="size-3" />
                    </span>
                    {item}
                  </div>
                ))}
              </div>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/signup"
                  className={`flex-1 py-4 text-center font-bold ${ctaBtnClass}`}
                  style={{ ...ctaBtnStyle, borderRadius: '0.875rem' }}
                >
                  Get started for free
                </Link>
                <Link
                  to="/features"
                  className="flex-1 rounded-2xl border py-4 text-center font-semibold text-slate-600 transition-all hover:border-violet-300 hover:text-violet-700"
                  style={{
                    background: 'rgba(255,255,255,0.72)',
                    border: '1px solid rgba(200,180,240,0.40)',
                  }}
                >
                  See all features with screenshots
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Competitor comparison ─────────────────────────────────── */}
      <section className="px-6 py-20 lg:px-12">
        <div className="mx-auto max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span
              className="mb-4 inline-block rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-violet-700"
              style={{ background: 'rgba(245,243,255,0.85)', border: '1px solid rgba(139,92,246,0.25)' }}
            >
              Comparison
            </span>
            <h2 className="mb-4 text-4xl font-black tracking-tight text-slate-900">
              See how Hasky compares.
            </h2>
            <p className="mb-10 max-w-2xl text-lg text-slate-500">
              Other hire software charges $200–$400/month. Generic CRMs weren't built for machinery hire. Spreadsheets have no automation. Hasky gives you everything, purpose-built, for $0.
            </p>
          </motion.div>

          <div className="grid gap-5 lg:grid-cols-3">
            {competitors.map((comp, idx) => (
              <motion.div
                key={comp.name}
                className="overflow-hidden rounded-2xl"
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
                style={{
                  background: 'rgba(255,255,255,0.72)',
                  backdropFilter: 'blur(14px)',
                  border: '1px solid rgba(255,255,255,0.65)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                }}
              >
                <div className="border-b p-5" style={{ borderColor: 'rgba(200,180,240,0.20)' }}>
                  <p className="text-sm font-bold text-slate-700">{comp.name}</p>
                  <p className="text-2xl font-black text-slate-900 mt-1">{comp.price}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{comp.priceNote}</p>
                </div>
                <div className="p-5 space-y-2.5">
                  {comp.included.map((item) => (
                    <div key={item.feature} className="flex items-center gap-2.5 text-sm">
                      {item.yes ? (
                        <Check className="size-4 shrink-0 text-emerald-500" />
                      ) : (
                        <X className="size-4 shrink-0 text-slate-300" />
                      )}
                      <span className={item.yes ? 'text-slate-600' : 'text-slate-400'}>{item.feature}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            className="mt-8 overflow-hidden rounded-2xl p-6 text-center"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.3 }}
            style={{
              background: 'linear-gradient(135deg, rgba(192,132,252,0.10), rgba(56,189,248,0.06))',
              border: '1px solid rgba(255,255,255,0.65)',
            }}
          >
            <p className="text-lg font-bold text-slate-900">
              Hasky: <span style={{ background: 'linear-gradient(135deg, #8b5cf6, #38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>$0/month</span> with <span style={{ background: 'linear-gradient(135deg, #8b5cf6, #38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>every feature</span> included.
            </p>
            <p className="mt-1 text-sm text-slate-500">
              All 14 features checked. Purpose-built for Australian machinery hire. No per-user pricing.
            </p>
            <Link to="/signup" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-violet-600 hover:text-violet-700">
              Start free now <ArrowRight className="size-4" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Why free section ──────────────────────────────────────── */}
      <section className="px-6 pb-20 lg:px-12">
        <motion.div
          className="mx-auto max-w-4xl"
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <span
            className="mb-4 inline-block rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-violet-700"
            style={{ background: 'rgba(245,243,255,0.85)', border: '1px solid rgba(139,92,246,0.25)' }}
          >
            Why free?
          </span>
          <h2 className="mb-6 text-4xl font-black tracking-tight text-slate-900">
            Other software charges $200+/month.{' '}
            <span className="text-slate-400">We charge nothing.</span>
          </h2>
          <p className="mb-5 max-w-2xl text-lg text-slate-500">
            Most CRM and hire management software charges between $150 and $400 per month. That's
            $1,800 to $4,800 per year — money straight out of your pocket for software that often wasn't even built with
            Australian machinery hire in mind.
          </p>
          <p className="mb-5 max-w-2xl text-lg text-slate-500">
            Hasky is built specifically for Australian hire operators. It's free because we believe
            every tradie should have access to professional tools — not just the big operators who
            can afford a monthly subscription.
          </p>
          <p className="max-w-2xl text-lg text-slate-500">
            We may introduce optional premium add-ons in the future (like cross-hire marketplace features), but the
            core platform — fleet, jobs, CRM, quotes, invoices, reports, map, maintenance, expenses, and team management —
            will always be free.
          </p>
        </motion.div>
      </section>

      {/* ── Savings calculator ────────────────────────────────────── */}
      <section className="px-6 py-20 lg:px-12">
        <motion.div
          className="mx-auto max-w-4xl text-center"
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="mb-8 text-3xl font-black tracking-tight text-slate-900">
            What you save by switching to Hasky.
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { period: 'Per Month', saved: '$250', desc: 'Average hire software cost', color: '#7c3aed' },
              { period: 'Per Year', saved: '$3,000', desc: 'That\'s a new trailer or tool', color: '#0284c7' },
              { period: 'Over 5 Years', saved: '$15,000', desc: 'Better spent on your business', color: '#0d9488' },
            ].map((s) => (
              <div
                key={s.period}
                className="relative overflow-hidden rounded-2xl p-6"
                style={{
                  background: 'rgba(255,255,255,0.78)',
                  backdropFilter: 'blur(16px)',
                  border: '1px solid rgba(255,255,255,0.70)',
                  boxShadow: '0 4px 20px rgba(100,60,180,0.07)',
                }}
              >
                <div className="absolute inset-x-0 top-0 h-[3px]" style={{ background: `linear-gradient(90deg, ${s.color}66, ${s.color})` }} />
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">{s.period}</p>
                <p className="text-4xl font-black" style={{ color: s.color }}>{s.saved}</p>
                <p className="mt-1 text-sm text-slate-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────── */}
      <section className="px-6 py-20 lg:px-12">
        <div className="mx-auto max-w-3xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
          >
            <motion.div variants={fadeUp}>
              <span
                className="mb-3 inline-block rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-violet-700"
                style={{ background: 'rgba(245,243,255,0.85)', border: '1px solid rgba(139,92,246,0.25)' }}
              >
                FAQ
              </span>
              <h2 className="mb-10 text-4xl font-black tracking-tight text-slate-900">
                Questions answered.
              </h2>
            </motion.div>

            <div className="space-y-4">
              {faqs.map((faq) => (
                <motion.div
                  key={faq.q}
                  variants={fadeUp}
                  className="rounded-2xl p-6"
                  style={{
                    background: 'rgba(255,255,255,0.72)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255,255,255,0.68)',
                    boxShadow: '0 2px 12px rgba(100,60,180,0.06)',
                  }}
                >
                  <p className="mb-3 font-bold text-slate-900">{faq.q}</p>
                  <p className="text-sm leading-relaxed text-slate-500">{faq.a}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────── */}
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
          <h2 className="mb-4 text-4xl font-black tracking-tight text-slate-900">Still unsure?</h2>
          <p className="mb-8 text-lg text-slate-500">
            It's free. There's literally nothing to lose. Sign up in 2 minutes and see for yourself.
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
