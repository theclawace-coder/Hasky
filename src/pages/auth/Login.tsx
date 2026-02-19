import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Mail, Lock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

const schema = z.object({
  email:    z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof schema>;

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

const easing = [0.25, 0.46, 0.45, 0.94] as const;

export default function Login() {
  const navigate = useNavigate();
  const [googleLoading, setGoogleLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: LoginFormValues) => {
    const { error } = await supabase.auth.signInWithPassword(values);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Welcome back 👋');
    navigate('/dashboard');
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) {
      if (error.message.toLowerCase().includes('provider') || error.message.includes('not enabled') || error.status === 400) {
        toast.error('Google sign-in is not yet configured. Please enable the Google provider in your Supabase project.', { duration: 6000 });
      } else {
        toast.error(error.message);
      }
      setGoogleLoading(false);
    }
  };

  return (
    <div
      className="flex min-h-screen"
      style={{ background: 'var(--gradient-bg)', backgroundAttachment: 'fixed' }}
    >
      {/* Ambient blobs */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="animate-blob absolute -right-32 -top-32 size-[500px] rounded-full opacity-[0.08]"
          style={{ background: 'radial-gradient(circle, #c084fc 0%, #818cf8 70%, transparent 100%)' }} />
        <div className="animate-blob-2 absolute -bottom-32 -left-32 size-[450px] rounded-full opacity-[0.07]"
          style={{ background: 'radial-gradient(circle, #38bdf8 0%, #818cf8 70%, transparent 100%)' }} />
      </div>

      {/* ── Left brand panel ─────────────────────────────────── */}
      <motion.div
        className="hidden lg:flex lg:w-5/12 xl:w-2/5 flex-col justify-between p-12 relative overflow-hidden"
        initial={{ opacity: 0, x: -24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, ease: easing }}
      >
        {/* Panel glass background */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(160deg, rgba(139,92,246,0.12) 0%, rgba(56,189,248,0.08) 100%)',
            backdropFilter: 'blur(20px)',
            borderRight: '1px solid rgba(255,255,255,0.40)',
          }}
        />

        {/* Content above glass */}
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

        <div className="relative z-10 space-y-6">
          <p className="text-[10px] font-bold uppercase tracking-widest text-violet-500">
            Trusted by tradies across Australia
          </p>

          {/* Testimonial card */}
          <div
            className="rounded-2xl p-6"
            style={{
              background: 'rgba(255,255,255,0.70)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.65)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
            }}
          >
            <p className="text-2xl font-bold leading-snug text-slate-900">
              "Finally something built for us. I was running everything on spreadsheets. Hasky replaced all of it."
            </p>
            <div className="mt-5 flex items-center gap-3">
              <div
                className="flex size-10 items-center justify-center rounded-full text-sm font-bold text-white"
                style={{ background: 'linear-gradient(135deg, #c084fc, #38bdf8)' }}
              >
                MH
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Matt H.</p>
                <p className="text-xs text-slate-500">Earthmoving operator · QLD</p>
              </div>
            </div>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2">
            {['Fleet management', 'Job tracking', 'Invoicing', 'Reports'].map((f) => (
              <span
                key={f}
                className="rounded-full px-3 py-1 text-xs font-semibold text-violet-700"
                style={{
                  background: 'rgba(139,92,246,0.10)',
                  border: '1px solid rgba(139,92,246,0.20)',
                }}
              >
                {f}
              </span>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-xs text-slate-400">© 2025 Hasky · hasky.com.au</p>
      </motion.div>

      {/* ── Right form panel ─────────────────────────────────── */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <motion.div
          className="w-full max-w-sm"
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

            <h1 className="text-2xl font-black tracking-tight text-slate-900">Welcome back</h1>
            <p className="mt-1 text-sm text-slate-500">Sign in to your Hasky account</p>

            {/* Google */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={googleLoading}
              className="mt-6 flex w-full items-center justify-center gap-3 rounded-2xl border border-white/60 bg-white/60 px-4 py-3 text-sm font-semibold text-slate-700 transition-all hover:bg-white/90 hover:shadow-md hover:-translate-y-px disabled:opacity-60 backdrop-blur-md"
            >
              {googleLoading ? (
                <div className="size-4 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
              ) : (
                <GoogleIcon />
              )}
              {googleLoading ? 'Redirecting…' : 'Continue with Google'}
            </button>

            {/* Divider */}
            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200/60" />
              <span className="text-xs font-medium text-slate-400">or sign in with email</span>
              <div className="h-px flex-1 bg-slate-200/60" />
            </div>

            {/* Form */}
            <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <Mail className="size-3.5 text-violet-400" />
                    Email address
                  </span>
                </label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  {...register('email')}
                  error={errors.email?.message}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  <span className="flex items-center gap-1.5">
                    <Lock className="size-3.5 text-violet-400" />
                    Password
                  </span>
                </label>
                <Input
                  type="password"
                  placeholder="••••••••"
                  {...register('password')}
                  error={errors.password?.message}
                />
              </div>

              <Button
                className="w-full"
                size="lg"
                type="submit"
                loading={isSubmitting}
              >
                Sign in to Hasky
              </Button>
            </form>

            {/* Links */}
            <div className="mt-5 flex items-center justify-between text-sm">
              <Link to="/forgot-password" className="text-slate-400 hover:text-slate-600 transition-colors">
                Forgot password?
              </Link>
              <Link
                to="/signup"
                className="font-semibold transition-colors hover:opacity-80"
                style={{
                  background: 'linear-gradient(135deg, #8b5cf6, #38bdf8)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                Create account →
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
