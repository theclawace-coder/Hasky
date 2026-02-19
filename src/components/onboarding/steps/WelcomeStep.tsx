import { ArrowRight, Truck, FileText, BarChart3, Calendar } from 'lucide-react';

interface Props {
  onNext: () => void;
  onSkip: () => void;
}

const cardStyle = {
  background: 'rgba(255,255,255,0.78)',
  border: '1px solid rgba(255,255,255,0.70)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
};

function FloatingCard({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={['absolute hidden lg:block rounded-2xl p-4 backdrop-blur-xl', className].join(' ')}
      style={cardStyle}
    >
      {children}
    </div>
  );
}

export function WelcomeStep({ onNext, onSkip }: Props) {
  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      {/* ── Floating decorative UI cards ──────────────────────────── */}

      {/* Machine card — top left */}
      <FloatingCard className="animate-ob-float left-[7%] top-[22%] w-60 -rotate-3">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-amber-50">
            <Truck className="size-4 text-amber-500" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-800">CAT 320 Excavator</div>
            <div className="text-[10px] text-slate-400">2021 · #EXC-04</div>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-600">
            On Hire
          </span>
          <span className="text-[10px] text-slate-400">$450/day</span>
        </div>
        <div className="mt-3 h-1 rounded-full bg-slate-100">
          <div className="h-full w-[68%] rounded-full bg-gradient-to-r from-amber-400 to-orange-400" />
        </div>
        <div className="mt-1 flex justify-between text-[9px] text-slate-400">
          <span>14 Aug</span>
          <span>21 Aug</span>
        </div>
      </FloatingCard>

      {/* Invoice card — top right */}
      <FloatingCard className="animate-ob-float-2 right-[7%] top-[20%] w-52 rotate-2">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <FileText className="size-3.5 text-slate-400" />
            <span className="text-xs font-semibold text-slate-800">INV-0042</span>
          </div>
          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
            Paid ✓
          </span>
        </div>
        <div className="text-2xl font-black text-slate-900">$12,500</div>
        <div className="mt-1 text-[10px] text-slate-400">ABC Construction</div>
        <div className="mt-3 flex items-center gap-1.5">
          <div className="h-1.5 flex-1 rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-emerald-400" style={{ width: '100%' }} />
          </div>
          <span className="text-[9px] text-emerald-500">Due 30 Aug</span>
        </div>
      </FloatingCard>

      {/* Stats card — bottom right */}
      <FloatingCard className="animate-ob-float-3 bottom-[22%] right-[9%] w-52 -rotate-1">
        <div className="mb-2 flex items-center gap-1.5">
          <BarChart3 className="size-3.5 text-violet-500" />
          <span className="text-[10px] font-medium text-slate-500">Revenue this month</span>
        </div>
        <div className="text-2xl font-black text-slate-900">$47,300</div>
        <div className="mt-0.5 text-[10px] text-emerald-500">↑ 18% vs last month</div>
        <div className="mt-3 flex items-end gap-1">
          {[40, 65, 45, 80, 60, 90, 75].map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-sm bg-gradient-to-t from-violet-400 to-cyan-400"
              style={{ height: `${h * 0.3}px` }}
            />
          ))}
        </div>
      </FloatingCard>

      {/* Booking card — bottom left */}
      <FloatingCard className="animate-ob-float-4 bottom-[20%] left-[8%] w-56 rotate-1">
        <div className="mb-2 flex items-center gap-2">
          <Calendar className="size-3.5 text-cyan-500" />
          <span className="text-xs font-semibold text-slate-800">New Booking</span>
        </div>
        <div className="text-[10px] text-slate-400 mb-3">Smith Bros · Scaffold Package</div>
        <div className="space-y-1.5">
          {['CAT 320 Excavator', 'Scaffold Set A'].map((item) => (
            <div key={item} className="flex items-center gap-2">
              <div className="size-1.5 rounded-full bg-cyan-400" />
              <span className="text-[10px] text-slate-600">{item}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 rounded-lg bg-gradient-to-r from-violet-100 to-cyan-50 py-1.5 text-center text-[10px] font-semibold text-violet-700">
          Confirmed ✓
        </div>
      </FloatingCard>

      {/* ── Main hero content ───────────────────────────────────────── */}
      <div className="relative z-10 max-w-2xl text-center">
        {/* Logo chip */}
        <div
          className="mb-10 inline-flex items-center gap-2.5 rounded-2xl px-4 py-2 backdrop-blur-xl"
          style={{
            background: 'rgba(255,255,255,0.78)',
            border: '1px solid rgba(255,255,255,0.70)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
          }}
        >
          <div
            className="flex size-7 items-center justify-center rounded-lg animate-glow-pulse text-white text-xs font-black"
            style={{
              background: 'linear-gradient(135deg, #c084fc 0%, #818cf8 50%, #38bdf8 100%)',
              boxShadow: '0 0 12px rgba(192,132,252,0.45)',
            }}
          >
            H
          </div>
          <span className="text-sm font-bold tracking-tight text-slate-900">Hasky</span>
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-violet-600"
            style={{ background: 'rgba(139,92,246,0.10)', border: '1px solid rgba(139,92,246,0.20)' }}
          >
            Free Beta
          </span>
        </div>

        {/* Tagline */}
        <h1 className="mb-5 text-[clamp(3rem,8vw,5.5rem)] font-black leading-none tracking-tight text-slate-900">
          Hire.{' '}
          <span
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #0ea5e9)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Track.
          </span>{' '}
          Invoice.
        </h1>

        <p className="mx-auto mb-12 max-w-md text-lg leading-relaxed text-slate-500">
          The all-in-one platform for equipment hire businesses. Set up in minutes, look professional from day one.
        </p>

        {/* CTA group */}
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={onNext}
            className="group flex items-center gap-3 rounded-2xl px-9 py-4 text-lg font-semibold text-white transition-all duration-200 hover:scale-[1.03] active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #7c3aed, #0ea5e9)',
              boxShadow: '0 0 32px rgba(124,58,237,0.30)',
            }}
          >
            Let's get you set up
            <ArrowRight className="size-5 transition-transform duration-200 group-hover:translate-x-1" />
          </button>

          <button
            onClick={onSkip}
            className="text-sm text-slate-400 transition-colors hover:text-slate-600"
          >
            Skip — I'll explore on my own
          </button>
        </div>

        {/* Social proof */}
        <div className="mt-12 flex items-center justify-center gap-6 text-xs text-slate-400">
          <span>✦ No credit card required</span>
          <span>✦ 100% free to start</span>
          <span>✦ 2-min setup</span>
        </div>
      </div>
    </div>
  );
}
