import { useState } from 'react';
import { ArrowRight, ChevronLeft, CreditCard, Lock, CheckCircle2, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Props {
  onNext: () => void;
  onBack: () => void;
}

const cardStyle = {
  background: 'rgba(255,255,255,0.78)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  border: '1px solid rgba(255,255,255,0.70)',
  boxShadow: '0 8px 40px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.95)',
};

export function PaymentsStep({ onNext, onBack }: Props) {
  const [stripeEnabled, setStripeEnabled] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-24">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="mb-8 text-center">
          <div
            className="mb-4 inline-flex size-14 items-center justify-center rounded-2xl"
            style={{ background: 'rgba(16,185,129,0.10)', border: '1px solid rgba(16,185,129,0.20)' }}
          >
            <CreditCard className="size-7 text-emerald-600" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900">Get paid faster</h2>
          <p className="mt-2 text-sm text-slate-500">
            Let customers pay directly from their invoice — online or via bank transfer
          </p>
        </div>

        <div className="rounded-3xl p-8 space-y-4" style={cardStyle}>
          {/* Stripe card */}
          <button
            type="button"
            onClick={() => setStripeEnabled((v) => !v)}
            className={[
              'w-full rounded-2xl border p-5 text-left transition-all duration-200',
              stripeEnabled
                ? 'border-violet-300 bg-violet-50 shadow-[0_0_20px_rgba(124,58,237,0.12)]'
                : 'border-slate-200/80 bg-white/60 hover:border-slate-300 hover:bg-white/90',
            ].join(' ')}
          >
            <div className="flex items-center gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-[#635BFF]/30 bg-[#635BFF]/10">
                <span className="text-base font-black text-[#635BFF]">S</span>
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-800">Stripe Payments</span>
                  <span className="rounded-full border border-blue-200 bg-blue-50 px-1.5 py-0.5 text-[9px] font-semibold text-blue-600">
                    Recommended
                  </span>
                </div>
                <div className="text-xs text-slate-400">
                  Accept cards, bank transfers & Buy Now Pay Later
                </div>
              </div>

              <div
                className={[
                  'flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-all',
                  stripeEnabled
                    ? 'border-violet-500 bg-violet-500'
                    : 'border-slate-300 bg-transparent',
                ].join(' ')}
              >
                {stripeEnabled && <CheckCircle2 className="size-3 text-white" />}
              </div>
            </div>

            {stripeEnabled && (
              <div className="mt-4 rounded-xl border border-violet-200 bg-violet-50 px-4 py-3">
                <div className="flex items-start gap-2">
                  <Lock className="mt-0.5 size-3.5 shrink-0 text-violet-500" />
                  <p className="text-xs text-slate-500">
                    You'll set up your Stripe API keys in{' '}
                    <span className="font-medium text-violet-600">Settings → Payments</span> after
                    completing onboarding. No card data is stored on our servers.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('/settings');
                  }}
                  className="mt-2 flex items-center gap-1 text-xs font-medium text-violet-600 hover:text-violet-800 transition-colors"
                >
                  Configure Stripe keys
                  <ExternalLink className="size-3" />
                </button>
              </div>
            )}
          </button>

          {/* Bank transfer */}
          <div className="rounded-2xl border border-slate-200/80 bg-white/60 p-5">
            <div className="flex items-center gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 text-xl">
                🏦
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-slate-800">Bank Transfer</div>
                <div className="text-xs text-slate-400">
                  BSB &amp; account details shown on every invoice
                </div>
              </div>
              <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-emerald-500">
                <CheckCircle2 className="size-3 text-white" />
              </div>
            </div>
          </div>

          {/* Xero — coming soon */}
          <div className="rounded-2xl border border-slate-200/60 bg-white/40 p-5 opacity-50">
            <div className="flex items-center gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-xl">
                📊
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-slate-700">Xero Integration</span>
                  <span className="rounded-full border border-slate-200 bg-slate-100 px-1.5 py-0.5 text-[9px] text-slate-400">
                    Coming soon
                  </span>
                </div>
                <div className="text-xs text-slate-400">Sync invoices directly to Xero</div>
              </div>
            </div>
          </div>

          {/* Security note */}
          <div className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3">
            <Lock className="size-3.5 shrink-0 text-slate-300" />
            <p className="text-xs text-slate-400">
              All payment data is secured with 256-bit TLS encryption. HireHub never stores card
              numbers or CVVs.
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-1.5 text-sm text-slate-400 transition-colors hover:text-slate-600"
            >
              <ChevronLeft className="size-4" />
              Back
            </button>

            <button
              onClick={onNext}
              className="flex items-center gap-2 rounded-2xl px-7 py-3 text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.97]"
              style={{
                background: 'linear-gradient(135deg, #7c3aed, #0ea5e9)',
                boxShadow: '0 0 16px rgba(124,58,237,0.28)',
              }}
            >
              Continue
              <ArrowRight className="size-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
