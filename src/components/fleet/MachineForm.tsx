import { useEffect, useMemo, useRef, useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { MACHINE_STATUSES } from '../../lib/constants';
import { useMachineModelCatalog } from '../../hooks/useMachineModelCatalog';
import { useDebounce } from '../../hooks/useDebounce';
import {
  COMMON_MACHINE_TYPES,
  MACHINE_PRESETS,
  POPULAR_MACHINE_BRANDS,
} from '../../lib/machinePresets';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import type { Machine, MachineCategory, MachineModelCatalogEntry } from '../../types';

const schema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Machine name is required'),
  category_id: z.string().min(1, 'Category is required'),
  make: z.string().optional(),
  model: z.string().optional(),
  year: z.coerce.number().optional(),
  serial_number: z.string().optional(),
  registration: z.string().optional(),
  status: z.string().default('available'),
  hourly_rate: z.coerce.number().optional(),
  daily_rate: z.coerce.number().optional(),
  weekly_rate: z.coerce.number().optional(),
  monthly_rate: z.coerce.number().optional(),
  location: z.string().optional(),
  photo_url: z.string().optional(),
  notes: z.string().optional(),
  cross_hire_available: z.boolean().default(true),
});

export type MachineFormValues = z.infer<typeof schema>;

interface MachineFormProps {
  categories: MachineCategory[];
  defaultValues?: Partial<Machine>;
  onSubmit: (values: MachineFormValues) => void;
  loading?: boolean;
}

const normalizeLabel = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, '');

const findMatchingCategory = (
  machineType: string,
  categories: MachineCategory[],
) => {
  const normalizedMachineType = normalizeLabel(machineType);
  return categories.find((category) => {
    const normalizedCategory = normalizeLabel(category.name ?? '');
    if (!normalizedCategory) {
      return false;
    }
    return normalizedMachineType.includes(normalizedCategory)
      || normalizedCategory.includes(normalizedMachineType);
  });
};

export function MachineForm({
  categories,
  defaultValues,
  onSubmit,
  loading,
}: MachineFormProps) {
  const values = useMemo<MachineFormValues>(
    () => ({
      id: defaultValues?.id,
      name: defaultValues?.name ?? '',
      category_id: defaultValues?.category_id ?? '',
      make: defaultValues?.make ?? '',
      model: defaultValues?.model ?? '',
      year: defaultValues?.year ?? undefined,
      serial_number: defaultValues?.serial_number ?? '',
      registration: defaultValues?.registration ?? '',
      status: defaultValues?.status ?? 'available',
      hourly_rate: defaultValues?.hourly_rate ?? undefined,
      daily_rate: defaultValues?.daily_rate ?? undefined,
      weekly_rate: defaultValues?.weekly_rate ?? undefined,
      monthly_rate: defaultValues?.monthly_rate ?? undefined,
      location: defaultValues?.location ?? '',
      photo_url: defaultValues?.photo_urls?.[0] ?? '',
      notes: defaultValues?.notes ?? '',
      cross_hire_available: defaultValues?.cross_hire_available ?? true,
    }),
    [defaultValues],
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(schema) as any,
    values,
  });

  const [presetId, setPresetId] = useState('manual');
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [selectedCatalogEntry, setSelectedCatalogEntry] = useState<MachineModelCatalogEntry | null>(null);
  const catalogContainerRef = useRef<HTMLDivElement | null>(null);

  const debouncedCatalogSearch = useDebounce(catalogSearch, 250);
  const catalogQuery = useMachineModelCatalog(debouncedCatalogSearch, 12);
  const catalogSuggestions = catalogQuery.data ?? [];
  const showCatalogMenu = catalogOpen
    && catalogSearch.trim().length >= 2;

  const selectedPreset = MACHINE_PRESETS.find((preset) => preset.id === presetId);
  const photoUrl = watch('photo_url');

  useEffect(() => {
    const onClickOutside = (event: MouseEvent) => {
      if (!catalogContainerRef.current) {
        return;
      }
      if (!catalogContainerRef.current.contains(event.target as Node)) {
        setCatalogOpen(false);
      }
    };

    window.addEventListener('mousedown', onClickOutside);
    return () => window.removeEventListener('mousedown', onClickOutside);
  }, []);

  const onPresetChange = (nextPresetId: string) => {
    setPresetId(nextPresetId);
    setSelectedCatalogEntry(null);
    if (nextPresetId === 'manual') {
      return;
    }

    const preset = MACHINE_PRESETS.find((item) => item.id === nextPresetId);
    if (!preset) {
      return;
    }

    const matchingCategory = categories.find((category) =>
      preset.categoryHints.some(
        (hint) => hint.toLowerCase() === (category.name ?? '').toLowerCase(),
      ),
    );

    setValue('name', preset.displayName, { shouldDirty: true });
    setValue('make', preset.brand, { shouldDirty: true });
    setValue('model', preset.model, { shouldDirty: true });
    setValue('photo_url', preset.imageUrl, { shouldDirty: true });
    if (matchingCategory) {
      setValue('category_id', matchingCategory.id, { shouldDirty: true });
    }
  };

  const onCatalogSelect = (entry: MachineModelCatalogEntry) => {
    setCatalogSearch(entry.display_name);
    setCatalogOpen(false);
    setPresetId('manual');
    setSelectedCatalogEntry(entry);

    setValue('name', entry.display_name, { shouldDirty: true });
    setValue('make', entry.make, { shouldDirty: true });
    setValue('model', entry.model, { shouldDirty: true });
    if (entry.image_url) {
      setValue('photo_url', entry.image_url, { shouldDirty: true });
    }

    const matchingCategory = findMatchingCategory(entry.machine_type, categories);
    if (matchingCategory) {
      setValue('category_id', matchingCategory.id, { shouldDirty: true });
    }
  };

  return (
    <form
      className="grid gap-4 md:grid-cols-2"
      onSubmit={handleSubmit((formValues) => onSubmit(formValues as MachineFormValues))}
    >
      <div className="md:col-span-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
        <label className="mb-1 block text-sm font-medium text-slate-700">Quick template</label>
        <Select value={presetId} onChange={(event) => onPresetChange(event.target.value)}>
          <option value="manual">Manual entry</option>
          {MACHINE_PRESETS.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.displayName}
            </option>
          ))}
        </Select>
        <p className="mt-1 text-xs text-slate-600">
          Common machine types: {COMMON_MACHINE_TYPES.join(', ')}.
        </p>
      </div>

      <div className="md:col-span-2 rounded-lg border border-slate-200 bg-white p-3" ref={catalogContainerRef}>
        <label className="mb-1 block text-sm font-medium text-slate-700">TVH machine catalog</label>
        <p className="mb-2 text-xs text-slate-600">
          Search TVH make/model data and auto-fill machine details.
        </p>
        <div className="relative">
          <Input
            value={catalogSearch}
            placeholder="Search exact machine (e.g. Massey Ferguson 560)"
            onFocus={() => setCatalogOpen(true)}
            onChange={(event) => {
              setCatalogSearch(event.target.value);
              setCatalogOpen(true);
            }}
          />
          {showCatalogMenu ? (
            <div className="absolute z-30 mt-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
              {catalogQuery.isLoading ? (
                <div className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600">
                  <LoaderCircle className="size-4 animate-spin" />
                  Searching TVH models...
                </div>
              ) : catalogSuggestions.length ? (
                <ul className="max-h-72 overflow-y-auto py-1">
                  {catalogSuggestions.map((entry) => (
                    <li key={entry.id}>
                      <button
                        type="button"
                        className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-slate-100"
                        onMouseDown={(event) => {
                          event.preventDefault();
                          onCatalogSelect(entry);
                        }}
                      >
                        {entry.image_url ? (
                          <img
                            src={entry.image_url}
                            alt={entry.display_name}
                            className="size-10 shrink-0 rounded border border-slate-200 object-cover"
                          />
                        ) : (
                          <div className="size-10 shrink-0 rounded border border-slate-200 bg-slate-100" />
                        )}
                        <div>
                          <p className="text-sm font-medium text-slate-800">{entry.display_name}</p>
                          <p className="text-xs text-slate-500">{entry.machine_type}</p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="px-3 py-2 text-sm text-slate-600">No matching models found.</p>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {photoUrl ? (
        <div className="md:col-span-2 overflow-hidden rounded-lg border border-slate-200 bg-white">
          <img src={photoUrl} alt="Machine preview" className="h-44 w-full object-cover" />
          {selectedPreset ? (
            <p className="px-3 py-2 text-xs text-slate-600">
              Preset image source:{' '}
              <a
                className="text-blue-700 hover:text-blue-800"
                href={selectedPreset.imageSourceUrl}
                target="_blank"
                rel="noreferrer"
              >
                {selectedPreset.imageSourceUrl}
              </a>
            </p>
          ) : selectedCatalogEntry ? (
            <p className="px-3 py-2 text-xs text-slate-600">
              TVH source:{' '}
              <a
                className="text-blue-700 hover:text-blue-800"
                href={selectedCatalogEntry.source_url}
                target="_blank"
                rel="noreferrer"
              >
                {selectedCatalogEntry.source_url}
              </a>
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="md:col-span-2">
        <label className="mb-1 block text-sm font-medium text-slate-700">Name *</label>
        <Input {...register('name')} error={errors.name?.message} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Category *</label>
        <Select {...register('category_id')} error={errors.category_id?.message}>
          <option value="">Select category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
        <Select {...register('status')}>
          {MACHINE_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status.replace('_', ' ')}
            </option>
          ))}
        </Select>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Make</label>
        <Input list="popular-machine-brands" {...register('make')} />
        <datalist id="popular-machine-brands">
          {POPULAR_MACHINE_BRANDS.map((brand) => (
            <option key={brand} value={brand} />
          ))}
        </datalist>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Model</label>
        <Input {...register('model')} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Year</label>
        <Input type="number" {...register('year')} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Location</label>
        <Input {...register('location')} />
      </div>
      <div className="md:col-span-2">
        <label className="mb-1 block text-sm font-medium text-slate-700">Machine image URL</label>
        <Input {...register('photo_url')} placeholder="https://..." />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Hourly rate</label>
        <Input type="number" step="0.01" {...register('hourly_rate')} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Daily rate</label>
        <Input type="number" step="0.01" {...register('daily_rate')} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Weekly rate</label>
        <Input type="number" step="0.01" {...register('weekly_rate')} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Monthly rate</label>
        <Input type="number" step="0.01" {...register('monthly_rate')} />
      </div>
      <div className="md:col-span-2">
        <label className="mb-1 block text-sm font-medium text-slate-700">Notes</label>
        <textarea
          className="h-24 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          {...register('notes')}
        />
      </div>
      <label className="md:col-span-2 flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" {...register('cross_hire_available')} />
        Available for cross-hire
      </label>
      <div className="md:col-span-2 flex justify-end">
        <Button type="submit" loading={loading}>
          Save Machine
        </Button>
      </div>
    </form>
  );
}
