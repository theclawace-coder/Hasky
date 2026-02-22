import { useEffect, useMemo, useRef, useState } from 'react';
import { Database, LoaderCircle } from 'lucide-react';
import { useForm, useWatch, type Resolver } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { MACHINE_STATUSES } from '../../lib/constants';
import { useMachineModelCatalog } from '../../hooks/useMachineModelCatalog';
import { useDebounce } from '../../hooks/useDebounce';
import { POPULAR_MACHINE_BRANDS } from '../../lib/machinePresets';
import { Button } from '../ui/Button';
import { AddressAutocomplete } from '../ui/AddressAutocomplete';
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
  status: z.enum(MACHINE_STATUSES).default('available'),
  hourly_rate: z.coerce.number().optional(),
  daily_rate: z.coerce.number().optional(),
  weekend_rate: z.coerce.number().optional(),
  weekly_rate: z.coerce.number().optional(),
  monthly_rate: z.coerce.number().optional(),
  location: z.string().optional(),
  location_lat: z.coerce.number().optional(),
  location_lng: z.coerce.number().optional(),
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
  submitLabel?: string;
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
  submitLabel = 'Save Machine',
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
      weekend_rate: defaultValues?.weekend_rate ?? undefined,
      weekly_rate: defaultValues?.weekly_rate ?? undefined,
      monthly_rate: defaultValues?.monthly_rate ?? undefined,
      location: defaultValues?.location ?? '',
      location_lat: defaultValues?.location_lat ?? undefined,
      location_lng: defaultValues?.location_lng ?? undefined,
      photo_url: defaultValues?.photo_urls?.[0] ?? '',
      notes: defaultValues?.notes ?? '',
      cross_hire_available: defaultValues?.cross_hire_available ?? true,
    }),
    [defaultValues],
  );

  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<MachineFormValues>({
    resolver: zodResolver(schema) as Resolver<MachineFormValues>,
    values,
  });

  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [showImageOverride, setShowImageOverride] = useState(false);
  const [replaceBackupUrl, setReplaceBackupUrl] = useState<string | null>(null);
  const catalogContainerRef = useRef<HTMLDivElement | null>(null);
  const photoUrl = useWatch({ control, name: 'photo_url' });
  const locationValue = useWatch({ control, name: 'location' }) ?? '';

  const debouncedCatalogSearch = useDebounce(catalogSearch, 250);
  const catalogQuery = useMachineModelCatalog(debouncedCatalogSearch, 12);
  const catalogSuggestions = catalogQuery.data ?? [];
  const showCatalogMenu = catalogOpen
    && catalogSearch.trim().length >= 2;

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

  const onCatalogSelect = (entry: MachineModelCatalogEntry) => {
    setCatalogSearch(entry.display_name);
    setCatalogOpen(false);

    setValue('name', entry.display_name, { shouldDirty: true });
    setValue('make', entry.make, { shouldDirty: true });
    setValue('model', entry.model, { shouldDirty: true });
    if (entry.image_url) {
      setValue('photo_url', entry.image_url, { shouldDirty: true });
      setShowImageOverride(false);
      setReplaceBackupUrl(null);
    }

    const matchingCategory = findMatchingCategory(entry.machine_type, categories);
    if (matchingCategory) {
      setValue('category_id', matchingCategory.id, { shouldDirty: true });
    }
  };

  return (
    <form
      className="grid gap-4 md:grid-cols-2"
      onSubmit={handleSubmit((formValues) => onSubmit(formValues))}
    >
      <div
        className="md:col-span-2 rounded-xl border-2 border-emerald-300 bg-gradient-to-r from-emerald-50 via-cyan-50 to-white p-4 shadow-sm"
        ref={catalogContainerRef}
      >
        <div className="mb-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Database className="size-4 text-emerald-700" />
            <label className="block text-sm font-semibold text-emerald-900">Search Our Machine Database</label>
          </div>
          <span className="rounded-full bg-emerald-700 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-white">
            Recommended
          </span>
        </div>
        <p className="mb-2 text-xs text-emerald-800">
          Search by make/model to auto-fill machine details and match the closest category.
        </p>
        <div className="relative">
          <Input
            value={catalogSearch}
            placeholder="Try: CAT 320, JLG 450AJ, or Massey Ferguson 560"
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
                  Searching machine database...
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

      <div className="md:col-span-2 rounded-xl border border-slate-200 bg-white p-3">
        {photoUrl ? (
          <>
            <img
              src={photoUrl}
              alt="Machine preview"
              className="h-44 w-full rounded-lg border border-slate-200 object-cover"
            />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-xs text-slate-500">Machine image preview</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="text-xs font-medium text-blue-700 hover:text-blue-800"
                  onClick={() => {
                    if (showImageOverride) {
                      if (replaceBackupUrl) {
                        setValue('photo_url', replaceBackupUrl, { shouldDirty: true });
                      }
                      setReplaceBackupUrl(null);
                      setShowImageOverride(false);
                      return;
                    }
                    setReplaceBackupUrl(photoUrl ?? '');
                    setValue('photo_url', '', { shouldDirty: true });
                    setShowImageOverride(true);
                  }}
                >
                  {showImageOverride ? 'Cancel replace' : 'Replace image'}
                </button>
                <button
                  type="button"
                  className="text-xs font-medium text-rose-700 hover:text-rose-800"
                  onClick={() => {
                    setReplaceBackupUrl(null);
                    setValue('photo_url', '', { shouldDirty: true });
                    setShowImageOverride(true);
                  }}
                >
                  Remove
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-slate-500">No image selected yet.</p>
            <button
              type="button"
              className="text-xs font-medium text-blue-700 hover:text-blue-800"
              onClick={() => setShowImageOverride(true)}
            >
              Add custom image
            </button>
          </div>
        )}
      </div>

      {(showImageOverride || !photoUrl) && (
        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium text-slate-700">Custom image URL</label>
          <Input
            {...register('photo_url')}
            placeholder="https://example.com/machine.jpg"
          />
        </div>
      )}

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
        <AddressAutocomplete
          value={locationValue}
          onChange={(value) => {
            setValue('location', value, { shouldDirty: true });
            setValue('location_lat', undefined, { shouldDirty: true });
            setValue('location_lng', undefined, { shouldDirty: true });
          }}
          onSelect={(suggestion) => {
            setValue('location', suggestion.fullAddress, { shouldDirty: true });
            setValue('location_lat', suggestion.latitude, { shouldDirty: true });
            setValue('location_lng', suggestion.longitude, { shouldDirty: true });
          }}
          placeholder="Search machine base location or type manually"
        />
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
        <label className="mb-1 block text-sm font-medium text-slate-700">Weekend rate</label>
        <Input type="number" step="0.01" {...register('weekend_rate')} />
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
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
