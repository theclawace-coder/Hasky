import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../../hooks/useAuth';
import { ctaBtnClass, ctaBtnStyle } from './ctaStyles';

const navLinks = [
  { to: '/features',     label: 'Features'     },
  { to: '/how-it-works', label: 'How it works' },
  { to: '/pricing',      label: 'Pricing'       },
  { to: '/contact',      label: 'Contact'       },
];

export function LandingLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div
      className="min-h-screen text-slate-900"
      style={{ background: 'var(--gradient-bg)', backgroundAttachment: 'fixed' }}
    >
      {/* ── Ambient background blobs ─────────────────────────────── */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div
          className="animate-blob absolute -right-48 -top-48 size-[700px] rounded-full opacity-[0.055]"
          style={{ background: 'radial-gradient(circle, #c084fc 0%, #818cf8 65%, transparent 100%)' }}
        />
        <div
          className="animate-blob-2 absolute -bottom-48 -left-48 size-[600px] rounded-full opacity-[0.055]"
          style={{ background: 'radial-gradient(circle, #38bdf8 0%, #818cf8 65%, transparent 100%)' }}
        />
      </div>

      {/* ── Sticky Nav ──────────────────────────────────────────── */}
      <header
        className="fixed inset-x-0 top-0 z-50"
        style={{
          background: 'rgba(255,255,255,0.82)',
          backdropFilter: 'blur(22px)',
          WebkitBackdropFilter: 'blur(22px)',
          borderBottom: '1px solid rgba(255,255,255,0.58)',
          boxShadow: '0 1px 0 rgba(0,0,0,0.04), 0 4px 20px rgba(0,0,0,0.04)',
        }}
      >
        <div className="flex h-16 items-center justify-between px-6 lg:px-12">
          <Link to="/" className="flex shrink-0 items-center gap-2.5">
            <div
              className="flex size-9 items-center justify-center rounded-xl font-black text-white text-sm animate-glow-pulse"
              style={{
                background: 'linear-gradient(135deg, #c084fc 0%, #818cf8 50%, #38bdf8 100%)',
                boxShadow: '0 0 18px rgba(192,132,252,0.40)',
              }}
            >
              H
            </div>
            <span className="text-lg font-black tracking-tight text-slate-900">Hasky</span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  isActive
                    ? 'text-sm font-bold text-violet-700'
                    : 'text-sm font-medium text-slate-500 transition-colors hover:text-slate-900'
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link to="/dashboard" className={ctaBtnClass} style={ctaBtnStyle}>
                Go to app →
              </Link>
            ) : (
              <>
                <Link to="/login" className="hidden text-sm font-medium text-slate-500 transition-colors hover:text-slate-900 sm:block">
                  Sign in
                </Link>
                <Link to="/signup" className={ctaBtnClass} style={ctaBtnStyle}>
                  Get started free
                </Link>
              </>
            )}
            <button
              className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-white/80 hover:text-slate-900 md:hidden"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* ── Mobile menu ──────────────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 z-40 pt-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{
              background: 'rgba(253,244,255,0.97)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
            }}
          >
            <nav className="flex flex-col gap-1 p-6">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-2xl px-5 py-3.5 text-lg font-semibold text-slate-700 transition-colors hover:bg-white/80"
                >
                  {link.label}
                </Link>
              ))}
              <div className="my-4 h-px bg-slate-200/60" />
              <Link to="/login" onClick={() => setMobileOpen(false)} className="rounded-2xl px-5 py-3.5 text-lg font-semibold text-slate-500 hover:bg-white/80">
                Sign in
              </Link>
              <Link to="/signup" onClick={() => setMobileOpen(false)} className="mt-2 rounded-2xl px-5 py-3.5 text-center text-lg font-bold text-white" style={ctaBtnStyle}>
                Get started free
              </Link>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="pt-16">{children}</main>

      {/* ── Footer ──────────────────────────────────────────────── */}
      <footer
        className="border-t px-6 py-14 lg:px-12"
        style={{
          background: 'rgba(255,255,255,0.62)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderColor: 'rgba(255,255,255,0.55)',
        }}
      >
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-2.5">
                <div className="flex size-9 items-center justify-center rounded-xl font-black text-white text-sm" style={{ background: 'linear-gradient(135deg, #c084fc, #818cf8, #38bdf8)' }}>H</div>
                <span className="text-lg font-black tracking-tight text-slate-900">Hasky</span>
              </div>
              <p className="text-sm text-slate-500">Australia's only completely free machinery CRM.</p>
              <p className="mt-1 text-xs text-slate-400">hasky.com.au · Made in Australia 🇦🇺</p>
            </div>
            <div className="flex gap-12 sm:gap-16">
              <div>
                <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">Product</p>
                <div className="space-y-2">
                  {[{ to: '/features', l: 'Features' }, { to: '/how-it-works', l: 'How it works' }, { to: '/pricing', l: 'Pricing' }].map(({ to, l }) => (
                    <Link key={to} to={to} className="block text-sm text-slate-500 hover:text-slate-900">{l}</Link>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">Account</p>
                <div className="space-y-2">
                  <Link to="/signup" className="block text-sm text-slate-500 hover:text-slate-900">Sign up free</Link>
                  <Link to="/login" className="block text-sm text-slate-500 hover:text-slate-900">Log in</Link>
                </div>
              </div>
              <div>
                <p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">Company</p>
                <div className="space-y-2">
                  <Link to="/contact" className="block text-sm text-slate-500 hover:text-slate-900">Contact</Link>
                  <a href="mailto:hello@hasky.com.au" className="block text-sm text-slate-500 hover:text-slate-900">hello@hasky.com.au</a>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-10 border-t pt-8 text-center text-xs text-slate-400" style={{ borderColor: 'rgba(200,180,230,0.30)' }}>
            © 2025 Hasky Pty Ltd. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
