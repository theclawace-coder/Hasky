import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Truck,
  Plus,
  X,
  ArrowRight,
  ChevronLeft,
  CheckCircle2,
  Loader2,
  Search,
} from 'lucide-react';
import { getMachineCategories, upsertMachine } from '../../../services/api';
import { useMachineModelCatalog } from '../../../hooks/useMachineModelCatalog';
import { useDebounce } from '../../../hooks/useDebounce';
import type { MachineModelCatalogEntry } from '../../../types';

interface QuickMachine {
  name: string;
  category_id: string;
  categoryName: string;
  daily_rate: string;
}

interface Props {
  onNext: (machinesAdded: number) => void;
  onBack: () => void;
}

const glassInput =
  'w-full rounded-xl border border-slate-200/80 bg-white/60 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 backdrop-blur-sm transition-all focus:border-violet-400/60 focus:outline-none focus:ring-2 focus:ring-violet-400/20';

const cardStyle = {
  background: 'rgba(255,255,255,0.78)',
  backdropFilter: 'blur(24px)',
  WebkitBackdropFilter: 'blur(24px)',
  border: '1px solid rgba(255,255,255,0.70)',
  boxShadow: '0 8px 40px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.95)',
};

const normalizeLabel = (v: string) => v.toLowerCase().replace(/[^a-z0-9]+/g, '');

export function FleetStep({ onNext, onBack }: Props) {
  const [added, setAdded] = useState<QuickMachine[]>([]);
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [dailyRate, setDailyRate] = useState('');
  const [saving, setSaving] = useState(false);

  // Catalog search state
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogOpen, setCatalogOpen] = useState(false);
  const catalogRef = useRef<HTMLDivElement>(null);
  const debouncedSearch = useDebounce(catalogSearch, 250);
  const catalogQuery = useMachineModelCatalog(debouncedSearch, 8);
  const catalogSuggestions = catalogQuery.data ?? [];
  const showDropdown = catalogOpen && catalogSearch.trim().length >= 2;

  const { data: categories = [], isLoading: catsLoading } = useQuery({
    queryKey: ['machine-categories'],
    queryFn: getMachineCategories,
    staleTime: 10 * 60 * 1000,
  });

  const onCatalogSelect = (entry: MachineModelCatalogEntry) => {
    setCatalogSearch(entry.display_name);
    setCatalogOpen(false);
    setName(entry.display_name);
    // Auto-pick the best matching category
    const norm = normalizeLabel(entry.machine_type);
    const match = categories.find((c) => {
      const cn = normalizeLabel(c.name ?? '');
      return cn && (norm.includes(cn) || cn.includes(norm));
    });
    if (match) setCategoryId(match.id);
  };

  const handleAdd = () => {
    if (!name.trim()) {
      toast.error('Enter a machine name');
      return;
    }
    if (!categoryId) {
      toast.error('Select a category');
      return;
    }
    const cat = categories.find((c) => c.id === categoryId);
    setAdded((prev) => [
      ...prev,
      {
        name: name.trim(),
        category_id: categoryId,
        categoryName: cat?.name ?? '',
        daily_rate: dailyRate,
      },
    ]);
    setName('');
    setDailyRate('');
  };

  const handleContinue = async () => {
    if (added.length === 0) {
      onNext(0);
      return;
    }
    setSaving(true);
    let saved = 0;
    for (const m of added) {
      try {
        await upsertMachine({
          name: m.name,
          category_id: m.category_id,
          ...(m.daily_rate ? { daily_rate: parseFloat(m.daily_rate) } : {}),
          status: 'available',
        });
        saved++;
      } catch {
        // continue with remaining
      }
    }
    if (saved > 0) {
      toast.success(`${saved} machine${saved !== 1 ? 's' : ''} added to your fleet`);
    }
    setSaving(false);
    onNext(saved);
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-24">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="mb-8 text-center">
          <div
            className="mb-4 inline-flex size-14 items-center justify-center rounded-2xl"
            style={{ background: 'rgba(6,182,212,0.10)', border: '1px solid rgba(6,182,212,0.20)' }}
          >
            <Truck className="size-7 text-cyan-600" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900">Add your fleet</h2>
          <p className="mt-2 text-sm text-slate-500">
            Quickly add the equipment you hire out — you can always add more later
          </p>
        </div>

        <div className="rounded-3xl p-8" style={cardStyle}>
          {/* Added machines list */}
          {added.length > 0 && (
            <div className="mb-6 space-y-2">
              {added.map((m, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-4 py-3"
                >
                  <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
                  <div className="flex-1 min-w-0">
                    <div className="truncate text-sm font-medium text-slate-800">{m.name}</div>
                    <div className="text-xs text-slate-400">
                      {m.categoryName}
                      {m.daily_rate ? ` · $${m.daily_rate}/day` : ''}
                    </div>
                  </div>
                  <button
                    onClick={() => setAdded((prev) => prev.filter((_, j) => j !== i))}
                    className="ml-auto shrink-0 text-slate-300 transition-colors hover:text-slate-500"
                    aria-label="Remove"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add machine form */}
          <div className="space-y-3">
            {/* Catalog search */}
            <div className="relative" ref={catalogRef}>
              <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
                <Search className="size-4 text-slate-400" />
              </div>
              <input
                value={catalogSearch}
                onChange={(e) => { setCatalogSearch(e.target.value); setName(e.target.value); setCatalogOpen(true); }}
                onFocus={() => setCatalogOpen(true)}
                onBlur={() => setTimeout(() => setCatalogOpen(false), 150)}
                placeholder="Search machine (e.g. CAT 320 Excavator)"
                className={glassInput + ' pl-10'}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (!showDropdown) handleAdd(); } }}
              />
              {showDropdown && (
                <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-xl border border-slate-200/80 bg-white/95 shadow-xl backdrop-blur-sm">
                  {catalogQuery.isLoading ? (
                    <div className="flex items-center gap-2 px-4 py-3 text-sm text-slate-500">
                      <Loader2 className="size-4 animate-spin" />
                      Searching catalog…
                    </div>
                  ) : catalogSuggestions.length > 0 ? (
                    <ul className="max-h-56 overflow-y-auto py-1">
                      {catalogSuggestions.map((entry) => (
                        <li key={entry.id}>
                          <button
                            type="button"
                            onMouseDown={(e) => { e.preventDefault(); onCatalogSelect(entry); }}
                            className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-violet-50"
                          >
                            {entry.image_url ? (
                              <img src={entry.image_url} alt={entry.display_name} className="size-9 shrink-0 rounded-lg border border-slate-200 object-cover" />
                            ) : (
                              <div className="size-9 shrink-0 rounded-lg border border-slate-200 bg-slate-100" />
                            )}
                            <div>
                              <p className="text-sm font-medium text-slate-800">{entry.display_name}</p>
                              <p className="text-xs text-slate-400">{entry.machine_type}</p>
                            </div>
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="px-4 py-3 text-sm text-slate-400">No matches — type the full name below</p>
                  )}
                </div>
              )}
            </div>

            {/* Category select */}
            {catsLoading ? (
              <div className="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white/60 px-4 py-3">
                <Loader2 className="size-4 animate-spin text-slate-400" />
                <span className="text-sm text-slate-400">Loading categories…</span>
              </div>
            ) : (
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className={glassInput + ' appearance-none cursor-pointer'}
              >
                <option value="">Select category…</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.icon ? `${c.icon}  ` : ''}{c.name}
                  </option>
                ))}
              </select>
            )}

            <div className="flex gap-3">
              <div className="relative flex-1">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400">
                  $
                </span>
                <input
                  value={dailyRate}
                  onChange={(e) => setDailyRate(e.target.value)}
                  placeholder="Daily rate (optional)"
                  type="number"
                  min="0"
                  step="0.01"
                  className={glassInput + ' pl-7'}
                />
              </div>

              <button
                type="button"
                onClick={handleAdd}
                className="flex shrink-0 items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-5 py-3 text-sm font-medium text-violet-700 transition-all hover:border-violet-300 hover:bg-violet-100 active:scale-[0.97]"
              >
                <Plus className="size-4" />
                Add
              </button>
            </div>
          </div>

          {added.length === 0 && (
            <p className="mt-4 text-center text-xs text-slate-400">
              Add at least one machine, or skip this step to set up your fleet later
            </p>
          )}

          {/* Actions */}
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
                  onClick={() => onNext(0)}
                  className="text-sm text-slate-400 transition-colors hover:text-slate-600"
                >
                  Skip
                </button>
              )}
              <button
                onClick={handleContinue}
                disabled={saving}
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
