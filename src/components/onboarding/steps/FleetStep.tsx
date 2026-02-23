import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { notify } from '../../../lib/notify';
import {
  Truck,
  X,
  ArrowRight,
  ChevronLeft,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { MachineForm, type MachineFormValues } from '../../fleet/MachineForm';
import { getMachineCategories, upsertMachine } from '../../../services/api';
import type { Machine } from '../../../types';

interface Props {
  onNext: (machinesAdded: number) => void;
  onBack: () => void;
  companyId: string | null;
}

const cardStyle = {
  background: 'rgba(255,255,255,0.78)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  border: '1px solid rgba(255,255,255,0.70)',
  boxShadow: '0 8px 40px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.95)',
};

export function FleetStep({ onNext, onBack, companyId }: Props) {
  const [added, setAdded] = useState<MachineFormValues[]>([]);
  const [formKey, setFormKey] = useState(0);
  const [saving, setSaving] = useState(false);

  const { data: categories = [], isLoading: catsLoading } = useQuery({
    queryKey: ['machine-categories'],
    queryFn: getMachineCategories,
    staleTime: 10 * 60 * 1000,
  });

  const categoryNameById = useMemo(
    () => new Map(categories.map((category) => [category.id, category.name ?? ''])),
    [categories],
  );

  const handleAdd = (values: MachineFormValues) => {
    setAdded((prev) => [...prev, values]);
    setFormKey((prev) => prev + 1);
    notify.success('Machine added to onboarding list');
  };

  const handleContinue = async () => {
    if (added.length === 0) {
      onNext(0);
      return;
    }
    if (!companyId) {
      notify.error('Could not determine your company. Please complete business setup first.');
      return;
    }

    setSaving(true);
    let saved = 0;
    let failed = 0;

    for (const machineValues of added) {
      const { photo_url, ...payload } = machineValues;
      const machinePayload: Partial<Machine> = {
        ...payload,
        company_id: companyId,
        photo_urls: photo_url ? [photo_url] : null,
      };

      try {
        await upsertMachine(machinePayload);
        saved++;
      } catch {
        failed++;
      }
    }

    if (saved > 0) {
      notify.success(`${saved} machine${saved !== 1 ? 's' : ''} added to your fleet`);
    }
    if (failed > 0) {
      notify.error(`${failed} machine${failed !== 1 ? 's' : ''} could not be saved`);
    }

    setSaving(false);
    if (saved === 0) {
      return;
    }
    onNext(saved);
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-24">
      <div className="w-full max-w-4xl">
        <div className="mb-8 text-center">
          <div
            className="mb-4 inline-flex size-14 items-center justify-center rounded-2xl"
            style={{ background: 'rgba(6,182,212,0.10)', border: '1px solid rgba(6,182,212,0.20)' }}
          >
            <Truck className="size-7 text-cyan-600" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900">Add your fleet</h2>
          <p className="mt-2 text-sm text-slate-500">
            Add the same machine details used in Fleet so your setup starts complete
          </p>
        </div>

        <div className="rounded-3xl p-8" style={cardStyle}>
          {added.length > 0 && (
            <div className="mb-6 space-y-2">
              {added.map((machine, index) => (
                <div
                  key={`${machine.name}-${index}`}
                  className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3"
                >
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-slate-800">{machine.name}</div>
                    <div className="text-xs text-slate-400">
                      {categoryNameById.get(machine.category_id) ?? 'Uncategorized'}
                      {typeof machine.daily_rate === 'number' ? ` - $${machine.daily_rate}/day` : ''}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAdded((prev) => prev.filter((_, i) => i !== index))}
                    className="ml-auto shrink-0 text-slate-300 transition-colors hover:text-slate-500"
                    aria-label="Remove"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {catsLoading ? (
            <div className="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white/60 px-4 py-3">
              <Loader2 className="size-4 animate-spin text-slate-400" />
              <span className="text-sm text-slate-400">Loading categories...</span>
            </div>
          ) : (
            <MachineForm
              key={formKey}
              categories={categories}
              onSubmit={handleAdd}
              submitLabel="Add machine to list"
            />
          )}

          {added.length === 0 && (
            <p className="mt-4 text-center text-xs text-slate-400">
              Add at least one machine, or skip this step to set up your fleet later
            </p>
          )}

          <div className="mt-8 flex items-center justify-between">
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-1.5 text-sm text-slate-400 transition-colors hover:text-slate-600"
            >
              <ChevronLeft className="size-4" />
              Back
            </button>

            <div className="flex items-center gap-3">
              {added.length === 0 && (
                <button
                  type="button"
                  onClick={() => onNext(0)}
                  className="text-sm text-slate-400 transition-colors hover:text-slate-600"
                >
                  Skip
                </button>
              )}

              <button
                type="button"
                onClick={handleContinue}
                disabled={saving || (added.length > 0 && !companyId)}
                className="flex items-center gap-2 rounded-2xl px-7 py-3 text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.97] disabled:opacity-70"
                style={{
                  background: 'linear-gradient(135deg, #7c3aed, #0ea5e9)',
                  boxShadow: '0 0 16px rgba(124,58,237,0.28)',
                }}
              >
                {saving && <Loader2 className="size-4 animate-spin" />}
                {added.length > 0
                  ? `Save ${added.length} machine${added.length !== 1 ? 's' : ''}`
                  : 'Continue'}
                {!saving && <ArrowRight className="size-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
