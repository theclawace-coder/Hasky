import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowRight, Building2, ChevronLeft, CreditCard, FileText } from 'lucide-react';
import { getCompanySettings, upsertCompanySettings } from '../../../services/api';
import { useAuthContext } from '../../../contexts/AuthContext';

const schema = z.object({
  payment_terms_days: z.number().int().min(1).max(120),
  bank_account_name: z.string().optional(),
  bank_bsb: z.string().optional(),
  bank_account_number: z.string().optional(),
  default_invoice_notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  onNext: () => void;
  onBack: () => void;
}

const TERM_OPTIONS = [7, 14, 30, 60] as const;

const glassInput =
  'w-full rounded-xl border border-slate-200/80 bg-white/60 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 backdrop-blur-sm transition-all focus:border-violet-400/60 focus:outline-none focus:ring-2 focus:ring-violet-400/20';

const cardStyle = {
  background: 'rgba(255,255,255,0.78)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  border: '1px solid rgba(255,255,255,0.70)',
  boxShadow: '0 8px 40px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.95)',
};

export function BusinessStep({ onNext, onBack }: Props) {
  const { company } = useAuthContext();

  const { data: existingSettings } = useQuery({
    queryKey: ['company-settings'],
    queryFn: getCompanySettings,
    staleTime: 0,
  });

  const { register, handleSubmit, watch, setValue } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      payment_terms_days: 14,
      bank_account_name: '',
      bank_bsb: '',
      bank_account_number: '',
      default_invoice_notes: 'Thank you for your business.',
    },
  });

  const terms = watch('payment_terms_days');

  const mutation = useMutation({
    mutationFn: (values: FormValues) =>
      upsertCompanySettings({
        ...(existingSettings?.id ? { id: existingSettings.id } : {}),
        payment_terms_days: values.payment_terms_days,
        bank_account_name: values.bank_account_name ?? null,
        bank_bsb: values.bank_bsb ?? null,
        bank_account_number: values.bank_account_number ?? null,
        default_invoice_notes: values.default_invoice_notes ?? null,
        allow_cross_hire: existingSettings?.allow_cross_hire ?? false,
      }),
    onSuccess: () => onNext(),
    onError: () => {
      toast.error('Could not save settings — you can update them later in Settings');
      onNext();
    },
  });

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-24">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="mb-8 text-center">
          <div
            className="mb-4 inline-flex size-14 items-center justify-center rounded-2xl"
            style={{ background: 'rgba(139,92,246,0.10)', border: '1px solid rgba(139,92,246,0.20)' }}
          >
            <Building2 className="size-7 text-violet-600" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900">Business settings</h2>
          <p className="mt-2 text-sm text-slate-500">
            Configure how you invoice customers and receive payments
          </p>
        </div>

        <div className="rounded-3xl p-8" style={cardStyle}>
          <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-7">
            {/* Business info pill */}
            {company && (
              <div className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 px-4 py-3">
                <div
                  className="flex size-9 shrink-0 items-center justify-center rounded-xl text-sm font-black text-white"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #0ea5e9)' }}
                >
                  {company.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-800">{company.name}</div>
                  {company.abn && (
                    <div className="text-xs text-slate-400">ABN {company.abn}</div>
                  )}
                </div>
                <span className="ml-auto rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-semibold text-emerald-600">
                  Active
                </span>
              </div>
            )}

            {/* Payment terms */}
            <div>
              <label className="mb-3 block text-sm font-medium text-slate-600">
                Payment Terms
              </label>
              <div className="grid grid-cols-4 gap-2">
                {TERM_OPTIONS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setValue('payment_terms_days', d)}
                    className={[
                      'rounded-xl py-3 text-sm font-semibold transition-all duration-150',
                      terms === d
                        ? 'text-white shadow-[0_0_14px_rgba(124,58,237,0.30)]'
                        : 'border border-slate-200/80 bg-white/60 text-slate-500 hover:bg-white/90 hover:text-slate-700',
                    ].join(' ')}
                    style={terms === d ? { background: 'linear-gradient(135deg, #7c3aed, #0ea5e9)' } : undefined}
                  >
                    {d}d
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-slate-400">
                Invoices will be due {terms} days after issue date
              </p>
            </div>

            {/* Bank details */}
            <div>
              <label className="mb-3 flex items-center gap-1.5 text-sm font-medium text-slate-600">
                <CreditCard className="size-4 text-cyan-500" />
                Bank Transfer Details
              </label>
              <div className="space-y-3">
                <input
                  {...register('bank_account_name')}
                  placeholder="Account name (e.g. Smith Equipment Pty Ltd)"
                  className={glassInput}
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    {...register('bank_bsb')}
                    placeholder="BSB (000-000)"
                    className={glassInput}
                  />
                  <input
                    {...register('bank_account_number')}
                    placeholder="Account number"
                    className={glassInput}
                  />
                </div>
              </div>
            </div>

            {/* Invoice notes */}
            <div>
              <label className="mb-3 flex items-center gap-1.5 text-sm font-medium text-slate-600">
                <FileText className="size-4 text-violet-500" />
                Default Invoice Notes
              </label>
              <textarea
                {...register('default_invoice_notes')}
                rows={2}
                placeholder="Thank you for your business."
                className={glassInput + ' resize-none'}
              />
              <p className="mt-1.5 text-xs text-slate-400">
                Appears at the bottom of every invoice
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
                type="submit"
                disabled={mutation.isPending}
                className="flex items-center gap-2 rounded-2xl px-7 py-3 text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.97] disabled:opacity-70"
                style={{
                  background: 'linear-gradient(135deg, #7c3aed, #0ea5e9)',
                  boxShadow: '0 0 16px rgba(124,58,237,0.28)',
                }}
              >
                {mutation.isPending && (
                  <div className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                )}
                Save & Continue
                <ArrowRight className="size-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
