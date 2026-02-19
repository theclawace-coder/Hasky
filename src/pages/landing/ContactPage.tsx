import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Mail, MapPin, Clock } from 'lucide-react';
import { LandingLayout, ctaBtnClass, ctaBtnStyle } from '../../components/landing/LandingLayout';

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const inputClass =
  'w-full rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 outline-none transition-all';
const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.72)',
  border: '1px solid rgba(200,180,240,0.40)',
  backdropFilter: 'blur(8px)',
};

export default function ContactPage() {
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', company: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <LandingLayout>
      {/* ── Hero + form ───────────────────────────────────────────────── */}
      <section className="px-6 pb-16 pt-24 lg:px-12 lg:pt-32">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-16 lg:grid-cols-2 lg:items-start">

            {/* ── Left column ─────────────────────────────────────────── */}
            <motion.div initial="hidden" animate="visible" variants={stagger}>
              <motion.div variants={fadeUp}>
                <span
                  className="mb-4 inline-block rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-violet-700"
                  style={{ background: 'rgba(245,243,255,0.85)', border: '1px solid rgba(139,92,246,0.25)' }}
                >
                  Contact
                </span>
              </motion.div>

              <motion.h1
                variants={fadeUp}
                className="mb-5 text-5xl font-black tracking-tight text-slate-900 sm:text-6xl"
              >
                Get in touch.
              </motion.h1>

              <motion.p variants={fadeUp} className="mb-10 text-lg leading-relaxed text-slate-500">
                Got a question, a feature request, or just want to know more? We'd love to hear from
                you. We're a small Australian team and we read every message.
              </motion.p>

              {/* Contact info cards */}
              <motion.div variants={fadeUp} className="space-y-4">
                {[
                  {
                    icon: Mail,
                    color: '#7c3aed',
                    title: 'Email us',
                    body: (
                      <a href="mailto:hello@hasky.com.au" className="text-sm text-slate-500 transition-colors hover:text-violet-600">
                        hello@hasky.com.au
                      </a>
                    ),
                  },
                  {
                    icon: MapPin,
                    color: '#0284c7',
                    title: 'Based in',
                    body: <p className="text-sm text-slate-500">Australia 🇦🇺</p>,
                  },
                  {
                    icon: Clock,
                    color: '#0d9488',
                    title: 'Response time',
                    body: <p className="text-sm text-slate-500">We aim to reply within 1 business day</p>,
                  },
                ].map(({ icon: Icon, color, title, body }) => (
                  <div
                    key={title}
                    className="flex items-start gap-4 rounded-2xl p-4"
                    style={{
                      background: 'rgba(255,255,255,0.72)',
                      backdropFilter: 'blur(12px)',
                      border: '1px solid rgba(255,255,255,0.68)',
                      boxShadow: '0 2px 8px rgba(100,60,180,0.06)',
                    }}
                  >
                    <div
                      className="flex size-10 shrink-0 items-center justify-center rounded-xl"
                      style={{ background: `${color}15`, border: `1px solid ${color}25` }}
                    >
                      <Icon className="size-5" style={{ color }} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{title}</p>
                      {body}
                    </div>
                  </div>
                ))}
              </motion.div>

              {/* Quick links */}
              <motion.div
                variants={fadeUp}
                className="mt-8 overflow-hidden rounded-2xl"
                style={{
                  background: 'rgba(255,255,255,0.72)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.68)',
                  boxShadow: '0 2px 8px rgba(100,60,180,0.06)',
                }}
              >
                <div
                  className="border-b px-5 py-4"
                  style={{ borderColor: 'rgba(200,180,240,0.20)' }}
                >
                  <p className="text-sm font-bold text-slate-800">Quick links</p>
                </div>
                <div className="p-2">
                  {[
                    { to: '/features', label: 'See all features', sub: 'What Hasky can do for your business' },
                    { to: '/how-it-works', label: 'How it works', sub: 'From signup to first booking in minutes' },
                    { to: '/pricing', label: 'Pricing', sub: "It's $0. Forever." },
                  ].map((l) => (
                    <Link
                      key={l.to}
                      to={l.to}
                      className="flex items-center justify-between rounded-xl p-3 transition-all hover:bg-violet-50"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{l.label}</p>
                        <p className="text-xs text-slate-400">{l.sub}</p>
                      </div>
                      <span className="text-slate-400">→</span>
                    </Link>
                  ))}
                </div>
              </motion.div>
            </motion.div>

            {/* ── Right column — contact form ─────────────────────────── */}
            <motion.div
              className="relative overflow-hidden rounded-3xl"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.15 }}
              style={{
                background: 'rgba(255,255,255,0.80)',
                backdropFilter: 'blur(24px)',
                border: '1px solid rgba(255,255,255,0.72)',
                boxShadow: '0 16px 64px rgba(100,60,180,0.10), 0 4px 16px rgba(0,0,0,0.06)',
              }}
            >
              {/* Accent bar */}
              <div
                className="absolute inset-x-0 top-0 h-[3px]"
                style={{ background: 'linear-gradient(90deg,#c084fc,#818cf8,#38bdf8)' }}
              />

              <div className="p-8 pt-10">
                {sent ? (
                  <motion.div
                    className="flex flex-col items-center py-12 text-center"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.35 }}
                  >
                    <div className="mb-4 text-6xl">✅</div>
                    <h2 className="mb-2 text-2xl font-black text-slate-900">Message sent!</h2>
                    <p className="mb-6 text-slate-500">We'll get back to you within one business day.</p>
                    <button
                      onClick={() => { setSent(false); setForm({ name: '', email: '', company: '', message: '' }); }}
                      className="text-sm font-semibold text-violet-600 hover:text-violet-800"
                    >
                      Send another message
                    </button>
                  </motion.div>
                ) : (
                  <>
                    <h2 className="mb-6 text-xl font-black text-slate-900">Send us a message</h2>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label className="mb-1.5 block text-sm font-medium text-slate-600">Name *</label>
                          <input
                            required
                            value={form.name}
                            onChange={(e) => setForm({ ...form, name: e.target.value })}
                            className={inputClass}
                            style={inputStyle}
                            placeholder="Jake Smith"
                            onFocus={(e) => { e.target.style.border = '1px solid rgba(139,92,246,0.55)'; e.target.style.boxShadow = '0 0 0 3px rgba(139,92,246,0.12)'; }}
                            onBlur={(e) => { e.target.style.border = '1px solid rgba(200,180,240,0.40)'; e.target.style.boxShadow = 'none'; }}
                          />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-sm font-medium text-slate-600">Email *</label>
                          <input
                            required
                            type="email"
                            value={form.email}
                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                            className={inputClass}
                            style={inputStyle}
                            placeholder="jake@company.com.au"
                            onFocus={(e) => { e.target.style.border = '1px solid rgba(139,92,246,0.55)'; e.target.style.boxShadow = '0 0 0 3px rgba(139,92,246,0.12)'; }}
                            onBlur={(e) => { e.target.style.border = '1px solid rgba(200,180,240,0.40)'; e.target.style.boxShadow = 'none'; }}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-600">Company</label>
                        <input
                          value={form.company}
                          onChange={(e) => setForm({ ...form, company: e.target.value })}
                          className={inputClass}
                          style={inputStyle}
                          placeholder="Smith Earthmoving"
                          onFocus={(e) => { e.target.style.border = '1px solid rgba(139,92,246,0.55)'; e.target.style.boxShadow = '0 0 0 3px rgba(139,92,246,0.12)'; }}
                          onBlur={(e) => { e.target.style.border = '1px solid rgba(200,180,240,0.40)'; e.target.style.boxShadow = 'none'; }}
                        />
                      </div>

                      <div>
                        <label className="mb-1.5 block text-sm font-medium text-slate-600">Message *</label>
                        <textarea
                          required
                          rows={5}
                          value={form.message}
                          onChange={(e) => setForm({ ...form, message: e.target.value })}
                          className={`${inputClass} resize-none`}
                          style={inputStyle}
                          placeholder="What can we help you with?"
                          onFocus={(e) => { e.target.style.border = '1px solid rgba(139,92,246,0.55)'; e.target.style.boxShadow = '0 0 0 3px rgba(139,92,246,0.12)'; }}
                          onBlur={(e) => { e.target.style.border = '1px solid rgba(200,180,240,0.40)'; e.target.style.boxShadow = 'none'; }}
                        />
                      </div>

                      <button
                        type="submit"
                        className={`w-full py-3 text-center font-bold ${ctaBtnClass}`}
                        style={{ ...ctaBtnStyle, borderRadius: '0.75rem' }}
                      >
                        Send message →
                      </button>
                    </form>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────── */}
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
              <h2 className="mb-10 text-3xl font-black text-slate-900">Common questions.</h2>
            </motion.div>

            <div className="space-y-4">
              {[
                {
                  q: 'Is Hasky really free?',
                  a: 'Yes. Completely free. No credit card, no trial, no hidden plans. Every feature is available to every user.',
                },
                {
                  q: 'Do I need to install anything?',
                  a: "No. Hasky is a web app — open it in any browser on your phone, tablet, or desktop. Nothing to download or install.",
                },
                {
                  q: 'Can I import my existing data?',
                  a: "Reach out to us and we'll help. We can assist with importing customers, machines, and historical data.",
                },
                {
                  q: 'Can my whole team use it?',
                  a: 'Yes. You can invite team members with different roles — admin, user, or viewer — from the Settings page.',
                },
                {
                  q: 'I found a bug / have a feature request.',
                  a: 'We love hearing from users. Send us a message above or email hello@hasky.com.au. We read everything.',
                },
              ].map((faq) => (
                <motion.div
                  key={faq.q}
                  variants={fadeUp}
                  className="rounded-2xl p-5"
                  style={{
                    background: 'rgba(255,255,255,0.72)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255,255,255,0.68)',
                    boxShadow: '0 2px 12px rgba(100,60,180,0.06)',
                  }}
                >
                  <p className="mb-2 font-bold text-slate-900">{faq.q}</p>
                  <p className="text-sm leading-relaxed text-slate-500">{faq.a}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
    </LandingLayout>
  );
}
