import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { OnboardingBackground } from '../../components/onboarding/OnboardingBackground';
import { StepIndicator } from '../../components/onboarding/StepIndicator';
import { WelcomeStep } from '../../components/onboarding/steps/WelcomeStep';
import { BusinessStep } from '../../components/onboarding/steps/BusinessStep';
import { FleetStep } from '../../components/onboarding/steps/FleetStep';
import { PaymentsStep } from '../../components/onboarding/steps/PaymentsStep';
import { TeamStep } from '../../components/onboarding/steps/TeamStep';
import { CompleteStep } from '../../components/onboarding/steps/CompleteStep';
import { useAuthContext } from '../../contexts/auth-context';
import { createOAuthUserSetup } from '../../services/api';

// Steps: 0=Welcome, 1=Business, 2=Fleet, 3=Payments, 4=Team, 5=Complete
const INDICATOR_STEPS = 4;

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<'fwd' | 'back'>('fwd');
  const [fleetCount, setFleetCount] = useState(0);
  const [inviteCount, setInviteCount] = useState(0);
  const navigate = useNavigate();
  const { user, profile, isLoading, refreshProfile } = useAuthContext();

  const shouldSetupOAuth = Boolean(!isLoading && user && !profile);
  const oauthSetupQuery = useQuery({
    queryKey: ['oauth_setup', user?.id],
    enabled: shouldSetupOAuth,
    retry: false,
    staleTime: 0,
    queryFn: async () => {
      if (!user) {
        return;
      }
      const fullName: string = user.user_metadata?.full_name ?? user.user_metadata?.name ?? '';
      await createOAuthUserSetup(user.id, fullName);
      await refreshProfile();
    },
  });
  const settingUp = oauthSetupQuery.isLoading;

  const go = (next: number) => {
    setDirection(next > step ? 'fwd' : 'back');
    setStep(next);
  };

  const skip = () => {
    localStorage.setItem('hirehub_onboarding_done', '1');
    navigate('/dashboard', { replace: true });
  };

  const enterClass = direction === 'fwd' ? 'animate-ob-enter' : 'animate-ob-enter-back';

  if (settingUp || (isLoading && !profile)) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: 'var(--gradient-bg)' }}>
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: 'var(--gradient-bg)', backgroundAttachment: 'fixed' }}>
      <OnboardingBackground />

      {step > 0 && step < 5 && (
        <div className="absolute left-1/2 top-8 z-20 -translate-x-1/2">
          <StepIndicator current={step - 1} total={INDICATOR_STEPS} />
        </div>
      )}

      {step > 0 && step < 5 && (
        <button
          onClick={skip}
          className="absolute right-6 top-7 z-20 rounded-xl px-3 py-1.5 text-sm text-slate-400 transition-colors hover:bg-black/5 hover:text-slate-600"
        >
          Skip setup
        </button>
      )}

      <div key={step} className={enterClass}>
        {step === 0 && (
          <WelcomeStep onNext={() => go(1)} onSkip={skip} />
        )}

        {step === 1 && (
          <BusinessStep onNext={() => go(2)} onBack={() => go(0)} />
        )}

        {step === 2 && (
          <FleetStep
            companyId={profile?.company_id ?? null}
            onNext={(count) => {
              setFleetCount(count);
              go(3);
            }}
            onBack={() => go(1)}
          />
        )}

        {step === 3 && (
          <PaymentsStep onNext={() => go(4)} onBack={() => go(2)} />
        )}

        {step === 4 && (
          <TeamStep
            onNext={(count) => {
              setInviteCount(count);
              go(5);
            }}
            onBack={() => go(3)}
          />
        )}

        {step === 5 && (
          <CompleteStep fleetCount={fleetCount} inviteCount={inviteCount} />
        )}
      </div>
    </div>
  );
}
