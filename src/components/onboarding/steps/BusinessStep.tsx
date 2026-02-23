import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  Building2,
  ChevronLeft,
  CreditCard,
  FileText,
  ImagePlus,
  MapPin,
  Phone,
  Zap,
} from 'lucide-react';
import {
  getCompanySettings,
  removeCompanyLogoObject,
  saveStripeConfig,
  uploadCompanyLogo,
  upsertCompanySettings,
} from '../../../services/api';
import { useAuthContext } from '../../../contexts/auth-context';
import { supabase } from '../../../lib/supabase';
import { AU_STATES } from '../../../lib/constants';

/* ────────────────────────── types ────────────────────────── */

interface Props {
  onNext: () => void;
  onBack: () => void;
}

interface FormData {
  company_name: string;
  abn: string;
  phone: string;
  reply_to_email: string;
  address: string;
  city: string;
  state: string;
  payment_terms_days: number;
  bank_account_name: string;
  bank_bsb: string;
  bank_account_number: string;
  default_invoice_notes: string;
  stripe_publishable_key: string;
  stripe_secret_key: string;
}

/* ────────────────────────── constants ────────────────────── */

const TERM_OPTIONS = [7, 14, 30, 60] as const;

interface StepMeta {
  greeting: string;
  question: string;
  hint: string;
  icon: typeof Building2;
  iconBg: string;
  iconBorder: string;
  iconColor: string;
  skippable: boolean;
  buttonLabel?: string;
}

const STEPS: StepMeta[] = [
  {
    greeting: "Let's get you set up",
    question: "What's your business called?",
    hint: 'This appears on all invoices and quotes.',
    icon: Building2,
    iconBg: 'rgba(139,92,246,0.10)',
    iconBorder: 'rgba(139,92,246,0.20)',
    iconColor: 'text-violet-600',
    skippable: false,
  },
  {
    greeting: 'Nice!',
    question: 'How should customers contact you?',
    hint: 'Replies to invoices and quotes go to this email.',
    icon: Phone,
    iconBg: 'rgba(6,182,212,0.10)',
    iconBorder: 'rgba(6,182,212,0.20)',
    iconColor: 'text-cyan-600',
    skippable: true,
  },
  {
    greeting: 'Great',
    question: 'Where are you based?',
    hint: 'Your business address appears on invoices.',
    icon: MapPin,
    iconBg: 'rgba(245,158,11,0.10)',
    iconBorder: 'rgba(245,158,11,0.20)',
    iconColor: 'text-amber-600',
    skippable: true,
  },
  {
    greeting: 'Looking good',
    question: 'Got a company logo?',
    hint: 'Your logo appears on invoices and quotes sent to customers.',
    icon: ImagePlus,
    iconBg: 'rgba(16,185,129,0.10)',
    iconBorder: 'rgba(16,185,129,0.20)',
    iconColor: 'text-emerald-600',
    skippable: true,
  },
  {
    greeting: 'Now for invoicing',
    question: 'When should invoices be due?',
    hint: 'How long customers have to pay from the invoice date.',
    icon: FileText,
    iconBg: 'rgba(139,92,246,0.10)',
    iconBorder: 'rgba(139,92,246,0.20)',
    iconColor: 'text-violet-600',
    skippable: false,
  },
  {
    greeting: 'Nearly there',
    question: 'Your bank details for invoices',
    hint: 'Shown on invoices so customers can pay via bank transfer.',
    icon: CreditCard,
    iconBg: 'rgba(6,182,212,0.10)',
    iconBorder: 'rgba(6,182,212,0.20)',
    iconColor: 'text-cyan-600',
    skippable: true,
  },
  {
    greeting: 'One last thing',
    question: 'Default note for your invoices?',
    hint: 'This appears at the bottom of every invoice you send.',
    icon: FileText,
    iconBg: 'rgba(139,92,246,0.10)',
    iconBorder: 'rgba(139,92,246,0.20)',
    iconColor: 'text-violet-600',
    skippable: true,
  },
  {
    greeting: 'Online payments',
    question: 'Connect your Stripe account?',
    hint: 'Let customers pay invoices and quotes online with a card. You can set this up later in Settings.',
    icon: Zap,
    iconBg: 'rgba(99,102,241,0.10)',
    iconBorder: 'rgba(99,102,241,0.20)',
    iconColor: 'text-indigo-600',
    skippable: true,
    buttonLabel: 'Finish setup',
  },
];

const TOTAL_STEPS = STEPS.length;

/* ────────────────────────── styles ───────────────────────── */

const glassInput =
  'w-full rounded-xl border border-slate-200/80 bg-white/60 px-4 py-3.5 text-sm text-slate-900 placeholder:text-slate-400 backdrop-blur-sm transition-all focus:border-violet-400/60 focus:outline-none focus:ring-2 focus:ring-violet-400/20';

const glassSelect =
  'w-full rounded-xl border border-slate-200/80 bg-white/60 px-4 py-3.5 text-sm text-slate-900 backdrop-blur-sm transition-all focus:border-violet-400/60 focus:outline-none focus:ring-2 focus:ring-violet-400/20 appearance-none';

const cardStyle = {
  background: 'rgba(255,255,255,0.78)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  border: '1px solid rgba(255,255,255,0.70)',
  boxShadow: '0 8px 40px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.95)',
};

const anim = (delay: number, slide = true) => ({
  animation: `${slide ? 'convSlideUp' : 'convFade'} 0.45s ease-out ${delay}ms both`,
});

/* ────────────────────────── component ────────────────────── */

export function BusinessStep({ onNext, onBack }: Props) {
  const { company, refreshProfile } = useAuthContext();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const firstInputRef = useRef<HTMLInputElement>(null);

  const companyLoaded = useRef(false);
  const settingsLoaded = useRef(false);

  const { data: existingSettings } = useQuery({
    queryKey: ['company-settings'],
    queryFn: getCompanySettings,
    staleTime: 0,
  });

  const [form, setForm] = useState<FormData>({
    company_name: '',
    abn: '',
    phone: '',
    reply_to_email: '',
    address: '',
    city: '',
    state: 'NSW',
    payment_terms_days: 14,
    bank_account_name: '',
    bank_bsb: '',
    bank_account_number: '',
    default_invoice_notes: 'Thank you for your business.',
    stripe_publishable_key: '',
    stripe_secret_key: '',
  });

  useEffect(() => {
    if (!company || companyLoaded.current) return;
    companyLoaded.current = true;
    setForm((prev) => ({
      ...prev,
      company_name: company.name ?? '',
      abn: company.abn ?? '',
      phone: company.phone ?? '',
      reply_to_email: company.email ?? '',
      address: company.address ?? '',
      city: company.city ?? '',
      state: company.state ?? 'NSW',
    }));
  }, [company]);

  useEffect(() => {
    if (!existingSettings || settingsLoaded.current) return;
    settingsLoaded.current = true;
    setForm((prev) => ({
      ...prev,
      payment_terms_days: existingSettings.payment_terms_days ?? 14,
      bank_account_name: existingSettings.bank_account_name ?? '',
      bank_bsb: existingSettings.bank_bsb ?? '',
      bank_account_number: existingSettings.bank_account_number ?? '',
      default_invoice_notes: existingSettings.default_invoice_notes ?? 'Thank you for your business.',
    }));
  }, [existingSettings]);

  useEffect(() => {
    const t = setTimeout(() => firstInputRef.current?.focus(), 380);
    return () => clearTimeout(t);
  }, [step]);

  /* ── helpers ── */

  const update = <K extends keyof FormData>(field: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const saveCompanyFields = async (fields: Record<string, unknown>) => {
    if (!company?.id) return;
    const { error } = await supabase.from('companies').update(fields).eq('id', company.id);
    if (error) throw new Error(error.message);
  };

  const saveInvoiceSettings = async (fields: Record<string, unknown>) => {
    await upsertCompanySettings({
      ...(existingSettings?.id ? { id: existingSettings.id } : {}),
      ...(company?.id ? { company_id: company.id } : {}),
      ...fields,
      allow_cross_hire: true,
    });
  };

  const advance = () => {
    if (step < TOTAL_STEPS - 1) {
      setStep((s) => s + 1);
    } else {
      void refreshProfile().then(() => onNext());
    }
  };

  const handleContinue = async () => {
    setSaving(true);
    try {
      switch (step) {
        case 0:
          if (!form.company_name.trim()) {
            toast.error('Company name is required');
            setSaving(false);
            return;
          }
          await saveCompanyFields({
            name: form.company_name.trim(),
            abn: form.abn.trim() || null,
          });
          break;
        case 1:
          await saveCompanyFields({
            phone: form.phone.trim() || null,
            email: form.reply_to_email.trim() || null,
          });
          break;
        case 2:
          await saveCompanyFields({
            address: form.address.trim() || null,
            city: form.city.trim() || null,
            state: form.state || 'NSW',
          });
          break;
        case 3:
          break;
        case 4:
          await saveInvoiceSettings({ payment_terms_days: form.payment_terms_days });
          break;
        case 5:
          await saveInvoiceSettings({
            bank_account_name: form.bank_account_name.trim() || null,
            bank_bsb: form.bank_bsb.trim() || null,
            bank_account_number: form.bank_account_number.trim() || null,
          });
          break;
        case 6:
          await saveInvoiceSettings({
            default_invoice_notes: form.default_invoice_notes?.trim() || null,
          });
          break;
        case 7:
          if (form.stripe_publishable_key.trim() && form.stripe_secret_key.trim()) {
            await saveStripeConfig({
              publishable_key: form.stripe_publishable_key.trim(),
              secret_key: form.stripe_secret_key.trim(),
            });
          }
          await refreshProfile();
          break;
      }
      advance();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not save');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (step === 0) onBack();
    else setStep((s) => s - 1);
  };

  const handleSkip = () => advance();

  /* ── logo handlers ── */

  const handleLogoUpload = async (file: File | null) => {
    if (!file || !company?.id) return;
    setUploadingLogo(true);
    try {
      const nextLogoUrl = await uploadCompanyLogo(file, company.id);
      const { error } = await supabase.from('companies').update({ logo_url: nextLogoUrl }).eq('id', company.id);
      if (error) throw new Error(error.message);
      await refreshProfile();
      toast.success('Logo uploaded');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not upload logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleRemoveLogo = async () => {
    if (!company?.id) return;
    setUploadingLogo(true);
    try {
      await removeCompanyLogoObject(company.logo_url);
      const { error } = await supabase.from('companies').update({ logo_url: null }).eq('id', company.id);
      if (error) throw new Error(error.message);
      await refreshProfile();
      toast.success('Logo removed');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not remove logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  /* ── submit wrapper for Enter-key support ── */

  const onFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!saving && !uploadingLogo) void handleContinue();
  };

  /* ── derived ── */

  const currentStep = STEPS[step];
  const Icon = currentStep.icon;
  const progress = ((step + 1) / TOTAL_STEPS) * 100;

  /* ── field renderers ── */

  const renderFields = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-3">
            <input
              ref={firstInputRef}
              value={form.company_name}
              onChange={(e) => update('company_name', e.target.value)}
              placeholder="Company name *"
              className={glassInput}
            />
            <input
              value={form.abn}
              onChange={(e) => update('abn', e.target.value)}
              placeholder="ABN (optional)"
              className={glassInput}
            />
          </div>
        );

      case 1:
        return (
          <div className="space-y-3">
            <input
              ref={firstInputRef}
              value={form.phone}
              onChange={(e) => update('phone', e.target.value)}
              placeholder="Phone number"
              className={glassInput}
            />
            <input
              value={form.reply_to_email}
              onChange={(e) => update('reply_to_email', e.target.value)}
              type="email"
              placeholder="Reply-to email"
              className={glassInput}
            />
          </div>
        );

      case 2:
        return (
          <div className="space-y-3">
            <input
              ref={firstInputRef}
              value={form.address}
              onChange={(e) => update('address', e.target.value)}
              placeholder="Street address"
              className={glassInput}
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                value={form.city}
                onChange={(e) => update('city', e.target.value)}
                placeholder="City / Suburb"
                className={glassInput}
              />
              <select
                value={form.state}
                onChange={(e) => update('state', e.target.value)}
                className={glassSelect}
              >
                {AU_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>
        );

      case 3:
        return company?.logo_url ? (
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border-2 border-slate-200 bg-white shadow-sm">
              <img
                src={company.logo_url}
                alt="Company logo"
                className="h-full w-full object-contain"
              />
            </div>
            <div className="flex gap-2">
              <label className="cursor-pointer rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50">
                {uploadingLogo ? 'Uploading\u2026' : 'Change'}
                <input
                  type="file"
                  accept="image/png,image/jpeg"
                  className="hidden"
                  disabled={uploadingLogo}
                  onChange={(e) => {
                    void handleLogoUpload(e.target.files?.[0] ?? null);
                    e.currentTarget.value = '';
                  }}
                />
              </label>
              <button
                type="button"
                disabled={uploadingLogo}
                onClick={() => void handleRemoveLogo()}
                className="rounded-xl px-4 py-2.5 text-sm font-medium text-red-500 transition-colors hover:bg-red-50"
              >
                Remove
              </button>
            </div>
          </div>
        ) : (
          <label className="group flex cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-slate-300 bg-white/40 px-6 py-10 transition-all hover:border-violet-400 hover:bg-violet-50/30">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-slate-100 transition-colors group-hover:bg-violet-100">
              <ImagePlus className="size-6 text-slate-400 transition-colors group-hover:text-violet-500" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-slate-600">
                {uploadingLogo ? 'Uploading\u2026' : 'Click to upload your logo'}
              </p>
              <p className="mt-0.5 text-xs text-slate-400">PNG or JPEG</p>
            </div>
            <input
              type="file"
              accept="image/png,image/jpeg"
              className="hidden"
              disabled={uploadingLogo}
              onChange={(e) => {
                void handleLogoUpload(e.target.files?.[0] ?? null);
                e.currentTarget.value = '';
              }}
            />
          </label>
        );

      case 4:
        return (
          <div className="grid grid-cols-2 gap-3">
            {TERM_OPTIONS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => update('payment_terms_days', d)}
                className={[
                  'rounded-xl py-4 text-sm font-semibold transition-all duration-150',
                  form.payment_terms_days === d
                    ? 'text-white shadow-[0_0_14px_rgba(124,58,237,0.30)]'
                    : 'border border-slate-200/80 bg-white/60 text-slate-500 hover:bg-white/90 hover:text-slate-700',
                ].join(' ')}
                style={
                  form.payment_terms_days === d
                    ? { background: 'linear-gradient(135deg, #7c3aed, #0ea5e9)' }
                    : undefined
                }
              >
                {d} days
              </button>
            ))}
          </div>
        );

      case 5:
        return (
          <div className="space-y-3">
            <input
              ref={firstInputRef}
              value={form.bank_account_name}
              onChange={(e) => update('bank_account_name', e.target.value)}
              placeholder="Account name (e.g. Smith Equipment Pty Ltd)"
              className={glassInput}
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                value={form.bank_bsb}
                onChange={(e) => update('bank_bsb', e.target.value)}
                placeholder="BSB (000-000)"
                className={glassInput}
              />
              <input
                value={form.bank_account_number}
                onChange={(e) => update('bank_account_number', e.target.value)}
                placeholder="Account number"
                className={glassInput}
              />
            </div>
          </div>
        );

      case 6:
        return (
          <textarea
            value={form.default_invoice_notes}
            onChange={(e) => update('default_invoice_notes', e.target.value)}
            rows={3}
            placeholder="Thank you for your business."
            className={`${glassInput} resize-none`}
          />
        );

      case 7:
        return (
          <div className="space-y-3">
            <input
              ref={firstInputRef}
              value={form.stripe_publishable_key}
              onChange={(e) => update('stripe_publishable_key', e.target.value)}
              placeholder="Publishable key (pk_live_... or pk_test_...)"
              className={glassInput}
            />
            <input
              type="password"
              value={form.stripe_secret_key}
              onChange={(e) => update('stripe_secret_key', e.target.value)}
              placeholder="Secret key (sk_live_... or sk_test_...)"
              className={glassInput}
            />
            <p className="text-xs text-slate-400">
              Find these in your{' '}
              <a
                href="https://dashboard.stripe.com/apikeys"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-slate-600"
              >
                Stripe Dashboard → API keys
              </a>
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  /* ────────────────────────── render ─────────────────────── */

  return (
    <>
      <style>{`
        @keyframes convSlideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes convFade {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>

      <div className="flex min-h-screen items-center justify-center px-4 py-24">
        <div className="w-full max-w-lg">
          {/* ── Progress bar ── */}
          <div
            className="mb-6 overflow-hidden rounded-full bg-white/40 backdrop-blur-sm"
            style={{ height: 3 }}
          >
            <div
              className="h-full rounded-full transition-all duration-700 ease-out"
              style={{
                width: `${progress}%`,
                background: 'linear-gradient(135deg, #7c3aed, #0ea5e9)',
              }}
            />
          </div>

          {/* ── Card ── */}
          <form onSubmit={onFormSubmit} className="rounded-3xl p-8 md:p-10" style={cardStyle}>
            {/* keyed wrapper — remount triggers entrance animation */}
            <div key={step}>
              {/* Icon */}
              <div style={anim(0, false)}>
                <div
                  className="mb-5 inline-flex size-12 items-center justify-center rounded-2xl"
                  style={{
                    background: currentStep.iconBg,
                    border: `1px solid ${currentStep.iconBorder}`,
                  }}
                >
                  <Icon className={`size-6 ${currentStep.iconColor}`} />
                </div>
              </div>

              {/* Greeting */}
              <p className="text-sm font-semibold text-violet-500" style={anim(0, false)}>
                {currentStep.greeting}
              </p>

              {/* Question */}
              <h2 className="mt-1 text-2xl font-bold text-slate-900" style={anim(60)}>
                {currentStep.question}
              </h2>

              {/* Hint */}
              <p className="mt-2 text-sm text-slate-400" style={anim(100, false)}>
                {currentStep.hint}
              </p>

              {/* Fields */}
              <div className="mt-6" style={anim(160)}>
                {renderFields()}
              </div>
            </div>

            {/* ── Actions ── */}
            <div className="mt-8 flex items-center justify-between">
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center gap-1 text-sm text-slate-400 transition-colors hover:text-slate-600"
              >
                <ChevronLeft className="size-4" />
                Back
              </button>

              <div className="flex items-center gap-3">
                {currentStep.skippable && (
                  <button
                    type="button"
                    onClick={handleSkip}
                    className="text-sm text-slate-400 transition-colors hover:text-slate-600"
                  >
                    Skip
                  </button>
                )}

                <button
                  type="submit"
                  disabled={saving || uploadingLogo}
                  className="flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.97] disabled:opacity-70"
                  style={{
                    background: 'linear-gradient(135deg, #7c3aed, #0ea5e9)',
                    boxShadow: '0 0 16px rgba(124,58,237,0.28)',
                  }}
                >
                  {saving ? (
                    <div className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  ) : null}
                  {currentStep.buttonLabel ?? 'Continue'}
                  <ArrowRight className="size-4" />
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
