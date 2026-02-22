import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { AU_STATES } from '../../lib/constants';
import { createSignup } from '../../services/api';
import { AddressAutocomplete } from '../../components/ui/AddressAutocomplete';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';

const companySchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  abn: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Valid email required').or(z.literal('')),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().min(1),
});

const userSchema = z.object({
  full_name: z.string().min(1, 'Full name is required'),
  email: z.string().email('Valid email required'),
  password: z.string().min(6, 'Minimum 6 characters'),
  phone: z.string().optional(),
});

type CompanyValues = z.infer<typeof companySchema>;
type UserValues = z.infer<typeof userSchema>;

const easing = [0.25, 0.46, 0.45, 0.94] as const;

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
      <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332Z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
    </svg>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="mb-1.5 block text-sm font-semibold text-slate-700">{children}</label>;
}

export default function Signup() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [companyValues, setCompanyValues] = useState<CompanyValues | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  const companyForm = useForm<CompanyValues>({
    resolver: zodResolver(companySchema),
    defaultValues: { state: 'NSW', email: '', address: '', city: '' },
  });

  const userForm = useForm<UserValues>({
    resolver: zodResolver(userSchema),
    defaultValues: { full_name: '', email: '', password: '', phone: '' },
  });

  const handleCompanyStep = (values: CompanyValues) => {
    setCompanyValues(values);
    setStep(2);
  };

  const handleSignup = async (values: UserValues) => {
    if (!companyValues) return;
    try {
      const signupData = await createSignup({ company: companyValues, user: values });
      if (signupData.session) {
        toast.success("Account created — let's get you set up!");
        navigate('/onboarding', { replace: true });
        return;
      }
      toast.success('Account created. Please log in.');
      navigate('/login', { replace: true });
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Signup failed';
      if (msg.toLowerCase().includes('rate limit')) {
        toast.error('Too many sign-up attempts. Please wait a few minutes and try again.', { duration: 8000 });
      } else {
        toast.error(msg);
      }
    }
  };

  const handleGoogleSignup = async () => {
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/onboarding` },
    });
    if (error) {
      if (error.message.toLowerCase().includes('provider') || error.message.includes('not enabled') || error.status === 400) {
        toast.error('Google sign-in is not yet configured. Enable the Google provider in Supabase → Authentication → Providers.', { duration: 6000 });
      } else {
        toast.error(error.message);
      }
      setGoogleLoading(false);
    }
  };

  const companyAddress = useWatch({ control: companyForm.control, name: 'address' }) ?? '';

  return (
    <div
      className="flex min-h-screen"
      style={{ background: 'var(--gradient-bg)', backgroundAttachment: 'fixed' }}
    >
      {/* ── Ambient blobs ─────────────────────────────────────────── */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div
          className="animate-blob absolute -right-32 -top-32 size-[500px] rounded-full opacity-[0.08]"
          style={{ background: 'radial-gradient(circle, #c084fc 0%, #818cf8 70%, transparent 100%)' }}
        />
        <div
          className="animate-blob-2 absolute -bottom-32 -left-32 size-[450px] rounded-full opacity-[0.07]"
          style={{ background: 'radial-gradient(circle, #38bdf8 0%, #818cf8 70%, transparent 100%)' }}
        />
      </div>

      {/* ── Left brand panel ──────────────────────────────────────── */}
      <motion.div
        className="relative hidden flex-col justify-between overflow-hidden p-12 lg:flex lg:w-5/12 xl:w-2/5"
        initial={{ opacity: 0, x: -24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: easing }}
      >
        {/* Glass background */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(160deg, rgba(139,92,246,0.12) 0%, rgba(56,189,248,0.08) 100%)',
            backdropFilter: 'blur(20px)',
            borderRight: '1px solid rgba(255,255,255,0.40)',
          }}
        />

        {/* Logo */}
        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-3">
            <div
              className="flex size-10 items-center justify-center rounded-xl font-black text-white text-sm shadow-lg animate-glow-pulse"
              style={{
                background: 'linear-gradient(135deg, #c084fc 0%, #818cf8 50%, #38bdf8 100%)',
                boxShadow: '0 0 24px rgba(192,132,252,0.45)',
              }}
            >
              H
            </div>
            <span className="text-xl font-black tracking-tight text-slate-900">Hasky</span>
          </Link>
        </div>

        {/* Value prop */}
        <div className="relative z-10 space-y-6">
          <div>
            <span
              className="mb-4 inline-block rounded-full px-3 py-1 text-xs font-bold uppercase tracking-widest text-violet-700"
              style={{ background: 'rgba(139,92,246,0.10)', border: '1px solid rgba(139,92,246,0.20)' }}
            >
              100% free · No credit card
            </span>
            <h2 className="mt-4 text-3xl font-black leading-tight text-slate-900">
              Everything your hire business needs.{' '}
              <span
                style={{
                  background: 'linear-gradient(135deg,#7c3aed,#0ea5e9)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Nothing it doesn't.
              </span>
            </h2>
          </div>

          {/* Feature list */}
          <ul className="space-y-3">
            {['Fleet management', 'Job scheduling', 'Customer CRM', 'Quotes & invoicing', 'Reports & GST summary'].map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm text-slate-600">
                <span
                  className="flex size-5 shrink-0 items-center justify-center rounded-full text-white text-[10px]"
                  style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}
                >
                  ✓
                </span>
                {item}
              </li>
            ))}
          </ul>

          {/* Testimonial */}
          <div
            className="rounded-2xl p-5"
            style={{
              background: 'rgba(255,255,255,0.70)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.65)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
            }}
          >
            <p className="text-sm leading-relaxed text-slate-700">
              "Finally something built for us. I was running everything on spreadsheets. Hasky replaced all of it."
            </p>
            <div className="mt-4 flex items-center gap-3">
              <div
                className="flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #c084fc, #38bdf8)' }}
              >
                MH
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">Matt H.</p>
                <p className="text-xs text-slate-500">Earthmoving operator · QLD</p>
              </div>
            </div>
          </div>
        </div>

        <p className="relative z-10 text-xs text-slate-400">© 2025 Hasky · hasky.com.au</p>
      </motion.div>

      {/* ── Right form panel ──────────────────────────────────────── */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: easing, delay: 0.1 }}
        >
          {/* Mobile logo */}
          <Link to="/" className="mb-8 flex items-center gap-2.5 lg:hidden">
            <div
              className="flex size-9 items-center justify-center rounded-xl font-black text-white text-sm"
              style={{ background: 'linear-gradient(135deg, #c084fc, #818cf8, #38bdf8)' }}
            >
              H
            </div>
            <span className="text-lg font-black tracking-tight text-slate-900">Hasky</span>
          </Link>

          {/* Glass card */}
          <div
            className="rounded-3xl p-7"
            style={{
              background: 'rgba(255,255,255,0.78)',
              backdropFilter: 'blur(24px)',
              WebkitBackdropFilter: 'blur(24px)',
              border: '1px solid rgba(255,255,255,0.70)',
              boxShadow: '0 8px 40px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.95)',
            }}
          >
            {/* Gradient accent line */}
            <div
              className="mb-6 h-[3px] w-12 rounded-full"
              style={{ background: 'linear-gradient(90deg, #c084fc, #38bdf8)' }}
            />

            <h1 className="text-2xl font-black tracking-tight text-slate-900">Create your free account</h1>
            <p className="mt-1 mb-5 text-sm text-slate-500">
              Step {step} of 2 — {step === 1 ? 'Your company details' : 'Your personal details'}
            </p>

            {/* Step indicator */}
            <div className="mb-6 flex gap-2">
              <div
                className="h-1.5 flex-1 rounded-full transition-all duration-300"
                style={{
                  background: step >= 1
                    ? 'linear-gradient(90deg,#7c3aed,#4f46e5)'
                    : 'rgba(200,180,240,0.30)',
                }}
              />
              <div
                className="h-1.5 flex-1 rounded-full transition-all duration-300"
                style={{
                  background: step >= 2
                    ? 'linear-gradient(90deg,#4f46e5,#0ea5e9)'
                    : 'rgba(200,180,240,0.30)',
                }}
              />
            </div>

            {/* Google button — step 1 only */}
            {step === 1 && (
              <>
                <button
                  type="button"
                  onClick={handleGoogleSignup}
                  disabled={googleLoading}
                  className="mb-5 flex w-full items-center justify-center gap-3 rounded-2xl border border-white/60 bg-white/60 px-4 py-3 text-sm font-semibold text-slate-700 transition-all backdrop-blur-md hover:bg-white/90 hover:shadow-md hover:-translate-y-px disabled:opacity-60"
                >
                  {googleLoading ? (
                    <div className="size-4 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
                  ) : (
                    <GoogleIcon />
                  )}
                  {googleLoading ? 'Redirecting…' : 'Sign up with Google'}
                </button>

                <div className="mb-5 flex items-center gap-3">
                  <div className="h-px flex-1 bg-slate-200/60" />
                  <span className="text-xs font-medium text-slate-400">or fill in your details</span>
                  <div className="h-px flex-1 bg-slate-200/60" />
                </div>
              </>
            )}

            {/* ── Step 1: Company ─────────────────────────────────── */}
            {step === 1 ? (
              <form className="grid gap-4 sm:grid-cols-2" onSubmit={companyForm.handleSubmit(handleCompanyStep)}>
                <div className="sm:col-span-2">
                  <FieldLabel>Company name *</FieldLabel>
                  <Input
                    {...companyForm.register('name')}
                    error={companyForm.formState.errors.name?.message}
                    placeholder="Smith Earthmoving"
                  />
                </div>
                <div>
                  <FieldLabel>ABN</FieldLabel>
                  <Input {...companyForm.register('abn')} placeholder="12 345 678 901" />
                </div>
                <div>
                  <FieldLabel>Phone</FieldLabel>
                  <Input {...companyForm.register('phone')} placeholder="0412 345 678" />
                </div>
                <div>
                  <FieldLabel>Company email</FieldLabel>
                  <Input
                    {...companyForm.register('email')}
                    error={companyForm.formState.errors.email?.message}
                    placeholder="hello@company.com.au"
                  />
                </div>
                <div>
                  <FieldLabel>City</FieldLabel>
                  <Input {...companyForm.register('city')} placeholder="Sydney" />
                </div>
                <div className="sm:col-span-2">
                  <FieldLabel>Address</FieldLabel>
                  <AddressAutocomplete
                    value={companyAddress}
                    onChange={(value) => companyForm.setValue('address', value, { shouldDirty: true })}
                    onSelect={(suggestion) => {
                      if (suggestion.city) companyForm.setValue('city', suggestion.city, { shouldDirty: true });
                      if (suggestion.stateCode && AU_STATES.includes(suggestion.stateCode as (typeof AU_STATES)[number])) {
                        companyForm.setValue('state', suggestion.stateCode, { shouldDirty: true });
                      }
                    }}
                  />
                </div>
                <div>
                  <FieldLabel>State</FieldLabel>
                  <Select {...companyForm.register('state')}>
                    {AU_STATES.map((state) => (
                      <option key={state} value={state}>{state}</option>
                    ))}
                  </Select>
                </div>
                <div className="flex items-end sm:col-span-2">
                  <Button type="submit" className="ml-auto">
                    Continue →
                  </Button>
                </div>
              </form>
            ) : (
              /* ── Step 2: User ─────────────────────────────────────── */
              <form className="grid gap-4 sm:grid-cols-2" onSubmit={userForm.handleSubmit(handleSignup)}>
                <div className="sm:col-span-2">
                  <FieldLabel>Full name *</FieldLabel>
                  <Input
                    {...userForm.register('full_name')}
                    error={userForm.formState.errors.full_name?.message}
                    placeholder="Jake Smith"
                  />
                </div>
                <div className="sm:col-span-2">
                  <FieldLabel>Email *</FieldLabel>
                  <Input
                    {...userForm.register('email')}
                    error={userForm.formState.errors.email?.message}
                    placeholder="jake@company.com.au"
                  />
                </div>
                <div>
                  <FieldLabel>Password *</FieldLabel>
                  <Input
                    type="password"
                    {...userForm.register('password')}
                    error={userForm.formState.errors.password?.message}
                    placeholder="Min. 6 characters"
                  />
                </div>
                <div>
                  <FieldLabel>Phone</FieldLabel>
                  <Input {...userForm.register('phone')} placeholder="0412 345 678" />
                </div>
                <div className="flex justify-between sm:col-span-2">
                  <Button type="button" variant="secondary" onClick={() => setStep(1)}>
                    ← Back
                  </Button>
                  <Button
                    type="submit"
                    loading={userForm.formState.isSubmitting}
                  >
                    Create account
                  </Button>
                </div>
              </form>
            )}

            {/* Sign in link */}
            <p className="mt-6 text-sm text-slate-500">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-semibold transition-colors hover:opacity-80"
                style={{
                  background: 'linear-gradient(135deg, #8b5cf6, #38bdf8)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Sign in →
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
