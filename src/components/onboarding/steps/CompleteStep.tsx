import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ArrowRight, BarChart3, Truck, Users, Settings } from 'lucide-react';

interface Props {
  fleetCount: number;
  inviteCount: number;
}

// ── Confetti ─────────────────────────────────────────────────────────
const CONFETTI_COLORS = [
  '#A855F7', '#06B6D4', '#EC4899', '#F59E0B',
  '#10B981', '#6366F1', '#F97316', '#38BDF8',
];

interface Particle {
  id: number;
  x: number;
  delay: number;
  duration: number;
  color: string;
  size: number;
  isCircle: boolean;
}

function generateParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 2.2,
    duration: 2.4 + Math.random() * 2,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    size: 5 + Math.random() * 9,
    isCircle: Math.random() > 0.6,
  }));
}

const PARTICLES = generateParticles(70);

function Confetti() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {PARTICLES.map((p) => (
        <div
          key={p.id}
          className={`absolute animate-ob-confetti ${p.isCircle ? 'rounded-full' : 'rounded-[2px]'}`}
          style={{
            left: `${p.x}%`,
            top: '-12px',
            width: `${p.size}px`,
            height: `${p.isCircle ? p.size : p.size * 0.55}px`,
            backgroundColor: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
}

// ── Summary items ─────────────────────────────────────────────────────
function SummaryRow({
  icon: Icon,
  iconColor,
  iconBg,
  label,
  sublabel,
  done,
}: {
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  label: string;
  sublabel: string;
  done: boolean;
}) {
  return (
    <div
      className="flex items-center gap-4 rounded-2xl px-5 py-4"
      style={{
        background: 'rgba(255,255,255,0.78)',
        border: '1px solid rgba(255,255,255,0.70)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
      }}
    >
      <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>
        <Icon className={`size-5 ${iconColor}`} />
      </div>
      <div className="flex-1">
        <div className="text-sm font-semibold text-slate-800">{label}</div>
        <div className="text-xs text-slate-400">{sublabel}</div>
      </div>
      <div
        className={[
          'flex size-6 shrink-0 items-center justify-center rounded-full',
          done ? 'bg-emerald-500' : 'bg-slate-200',
        ].join(' ')}
      >
        <CheckCircle2 className={`size-3.5 ${done ? 'text-white' : 'text-slate-400'}`} />
      </div>
    </div>
  );
}

export function CompleteStep({ fleetCount, inviteCount }: Props) {
  const navigate = useNavigate();
  const markedRef = useRef(false);
  useEffect(() => {
    if (!markedRef.current) {
      markedRef.current = true;
      localStorage.setItem('hirehub_onboarding_done', '1');
    }
  }, []);

  const summaryItems = [
    {
      icon: CheckCircle2,
      iconColor: 'text-emerald-500',
      iconBg: 'bg-emerald-50',
      label: 'Account created',
      sublabel: 'Business settings saved',
      done: true,
    },
    {
      icon: Truck,
      iconColor: 'text-cyan-600',
      iconBg: 'bg-cyan-50',
      label: fleetCount > 0 ? `${fleetCount} machine${fleetCount !== 1 ? 's' : ''} added` : 'Fleet setup skipped',
      sublabel: fleetCount > 0 ? 'Your fleet is ready to book' : 'Add machines anytime from Fleet',
      done: fleetCount > 0,
    },
    {
      icon: Users,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-50',
      label: inviteCount > 0 ? `${inviteCount} invite${inviteCount !== 1 ? 's' : ''} sent` : 'Team invites skipped',
      sublabel: inviteCount > 0 ? 'Your team is on the way' : 'Invite team members from Settings',
      done: inviteCount > 0,
    },
    {
      icon: Settings,
      iconColor: 'text-violet-600',
      iconBg: 'bg-violet-50',
      label: 'Payments configured',
      sublabel: 'Add Stripe keys in Settings for online pay',
      done: false,
    },
  ];

  return (
    <div className="relative flex min-h-screen items-center justify-center px-4">
      <Confetti />

      <div className="relative z-10 w-full max-w-lg text-center">
        {/* Big check icon */}
        <div
          className="mb-8 inline-flex size-24 items-center justify-center rounded-3xl animate-ob-pulse-glow"
          style={{
            background: 'rgba(255,255,255,0.90)',
            border: '1px solid rgba(255,255,255,0.70)',
            boxShadow: '0 0 48px rgba(124,58,237,0.20), 0 8px 32px rgba(0,0,0,0.08)',
          }}
        >
          <CheckCircle2 className="size-12 text-emerald-500" strokeWidth={1.5} />
        </div>

        <h2 className="mb-2 text-4xl font-black tracking-tight text-slate-900">
          You're all set! 🚀
        </h2>
        <p className="mb-10 text-lg text-slate-500">
          Your hire business is ready to roll. Let's go.
        </p>

        {/* Summary */}
        <div className="mb-10 space-y-3 text-left">
          {summaryItems.map((item) => (
            <SummaryRow key={item.label} {...item} />
          ))}
        </div>

        {/* CTA */}
        <button
          onClick={() => navigate('/dashboard', { replace: true })}
          className="group mx-auto flex items-center gap-3 rounded-2xl px-9 py-4 text-lg font-semibold text-white transition-all hover:scale-[1.04] active:scale-[0.98]"
          style={{
            background: 'linear-gradient(135deg, #7c3aed, #0ea5e9)',
            boxShadow: '0 0 32px rgba(124,58,237,0.30)',
          }}
        >
          <BarChart3 className="size-5" />
          Go to Dashboard
          <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
        </button>

        <p className="mt-6 text-xs text-slate-400">
          You can re-visit these settings any time from the Settings page
        </p>
      </div>
    </div>
  );
}
