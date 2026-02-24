import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Upload, X } from 'lucide-react';
import { notify } from '../../lib/notify';
import { AU_STATES } from '../../lib/constants';
import { uploadDocument } from '../../services/api';
import { AddressAutocomplete } from '../ui/AddressAutocomplete';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import type { Customer } from '../../types';

const schema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Customer name is required'),
  abn: z.string().optional().refine((value) => !value || /^\d{11}$/.test(value), 'ABN must be 11 digits'),
  contact_name: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Valid email required').or(z.literal('')),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  notes: z.string().optional(),
  drivers_licence_number: z.string().optional(),
  drivers_licence_image_url: z.string().optional(),
});

export type CustomerFormValues = z.infer<typeof schema>;

interface CustomerFormProps {
  defaultValues?: Partial<Customer>;
  onSubmit: (values: CustomerFormValues) => void;
  loading?: boolean;
}

export function CustomerForm({ defaultValues, onSubmit, loading }: CustomerFormProps) {
  const [_licenceFile, setLicenceFile] = useState<File | null>(null);
  const [uploadingLicence, setUploadingLicence] = useState(false);

  const values = useMemo<CustomerFormValues>(
    () => ({
      id: defaultValues?.id,
      name: defaultValues?.name ?? '',
      abn: defaultValues?.abn ?? '',
      contact_name: defaultValues?.contact_name ?? '',
      phone: defaultValues?.phone ?? '',
      email: defaultValues?.email ?? '',
      address: defaultValues?.address ?? '',
      city: defaultValues?.city ?? '',
      state: defaultValues?.state ?? 'NSW',
      notes: defaultValues?.notes ?? '',
      drivers_licence_number: defaultValues?.drivers_licence_number ?? '',
      drivers_licence_image_url: defaultValues?.drivers_licence_image_url ?? '',
    }),
    [defaultValues],
  );

  const {
    control,
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(schema),
    values,
  });

  const licenceImageUrl = watch('drivers_licence_image_url');

  const handleLicenceUpload = async (file: File) => {
    setUploadingLicence(true);
    try {
      const folder = `licences/${Date.now()}`;
      const url = await uploadDocument(file, 'customer-docs', folder);
      setValue('drivers_licence_image_url', url, { shouldDirty: true });
      setLicenceFile(null);
    } catch (error) {
      notify.error(error instanceof Error ? error.message : 'Failed to upload licence image');
    } finally {
      setUploadingLicence(false);
    }
  };

  return (
    <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit(onSubmit)}>
      <div className="md:col-span-2">
        <label className="mb-1 block text-sm font-medium text-slate-700">Name *</label>
        <Input {...register('name')} error={errors.name?.message} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">ABN</label>
        <Input {...register('abn')} error={errors.abn?.message} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Contact name</label>
        <Input {...register('contact_name')} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Phone</label>
        <Input {...register('phone')} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Email</label>
        <Input {...register('email')} error={errors.email?.message} />
      </div>
      <div className="md:col-span-2">
        <label className="mb-1 block text-sm font-medium text-slate-700">Address</label>
        <Controller
          control={control}
          name="address"
          render={({ field }) => (
            <AddressAutocomplete
              value={field.value ?? ''}
              onChange={field.onChange}
              onSelect={(suggestion) => {
                if (suggestion.city) {
                  setValue('city', suggestion.city, { shouldDirty: true });
                }
                if (
                  suggestion.stateCode &&
                  AU_STATES.includes(suggestion.stateCode as (typeof AU_STATES)[number])
                ) {
                  setValue('state', suggestion.stateCode, { shouldDirty: true });
                }
              }}
            />
          )}
        />
      </div>
      <input type="hidden" {...register('city')} />
      <input type="hidden" {...register('state')} />
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Drivers Licence Number</label>
        <Input {...register('drivers_licence_number')} placeholder="e.g. 12345678" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">Drivers Licence Image</label>
        {licenceImageUrl ? (
          <div className="flex items-center gap-2">
            <a
              href={licenceImageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="truncate text-sm text-violet-600 underline"
            >
              View licence
            </a>
            <button
              type="button"
              onClick={() => setValue('drivers_licence_image_url', '', { shouldDirty: true })}
              className="text-slate-400 hover:text-red-500"
            >
              <X className="size-4" />
            </button>
          </div>
        ) : (
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-3 py-2.5 text-sm text-slate-500 hover:border-violet-300 hover:bg-violet-50/30">
            <Upload className="size-4" />
            {uploadingLicence ? 'Uploading…' : 'Upload licence image / PDF'}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,application/pdf"
              className="hidden"
              disabled={uploadingLicence}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleLicenceUpload(file);
                e.currentTarget.value = '';
              }}
            />
          </label>
        )}
      </div>
      <div className="md:col-span-2">
        <label className="mb-1 block text-sm font-medium text-slate-700">Notes</label>
        <textarea className="h-24 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" {...register('notes')} />
      </div>
      <div className="md:col-span-2 flex justify-end">
        <Button type="submit" loading={loading}>
          Save Customer
        </Button>
      </div>
    </form>
  );
}
