import { useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { AU_STATES } from '../../lib/constants';
import { AddressAutocomplete } from '../ui/AddressAutocomplete';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
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
});

export type CustomerFormValues = z.infer<typeof schema>;

interface CustomerFormProps {
  defaultValues?: Partial<Customer>;
  onSubmit: (values: CustomerFormValues) => void;
  loading?: boolean;
}

export function CustomerForm({ defaultValues, onSubmit, loading }: CustomerFormProps) {
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
    }),
    [defaultValues],
  );

  const {
    control,
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CustomerFormValues>({
    resolver: zodResolver(schema),
    values,
  });

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
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">City</label>
        <Input {...register('city')} />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">State</label>
        <Select {...register('state')}>
          {AU_STATES.map((state) => (
            <option key={state} value={state}>
              {state}
            </option>
          ))}
        </Select>
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
