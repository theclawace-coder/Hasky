import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { DEAL_STATUSES } from '../../lib/constants';
import { Button } from '../ui/Button';
import { DatePicker } from '../ui/DatePicker';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import type { CrossHireDeal } from '../../types';

const schema = z.object({
  id: z.string().optional(),
  lead_client_name: z.string().min(1, 'Client name is required'),
  lead_company_name: z.string().optional(),
  lead_contact_phone: z.string().optional(),
  lead_contact_email: z.string().optional(),
  machine_category_needed: z.string().optional(),
  machine_size_needed: z.string().optional(),
  location_needed: z.string().optional(),
  start_date_needed: z.string().optional(),
  end_date_needed: z.string().optional(),
  client_rate: z.coerce.number().optional(),
  supplier_rate: z.coerce.number().optional(),
  status: z.string().default('lead'),
  notes: z.string().optional(),
});

export type DealFormValues = z.infer<typeof schema>;

interface DealFormProps {
  defaultValues?: Partial<CrossHireDeal>;
  onSubmit: (values: DealFormValues) => void;
  loading?: boolean;
}

export function DealForm({ defaultValues, onSubmit, loading }: DealFormProps) {
  const values = useMemo<DealFormValues>(
    () => ({
      id: defaultValues?.id,
      lead_client_name: defaultValues?.lead_client_name ?? '',
      lead_company_name: defaultValues?.lead_company_name ?? '',
      lead_contact_phone: defaultValues?.lead_contact_phone ?? '',
      lead_contact_email: defaultValues?.lead_contact_email ?? '',
      machine_category_needed: defaultValues?.machine_category_needed ?? '',
      machine_size_needed: defaultValues?.machine_size_needed ?? '',
      location_needed: defaultValues?.location_needed ?? '',
      start_date_needed: defaultValues?.start_date_needed ?? '',
      end_date_needed: defaultValues?.end_date_needed ?? '',
      client_rate: defaultValues?.client_rate ?? undefined,
      supplier_rate: defaultValues?.supplier_rate ?? undefined,
      status: defaultValues?.status ?? 'lead',
      notes: defaultValues?.notes ?? '',
    }),
    [defaultValues],
  );

  const { register, handleSubmit, formState: { errors } } = useForm<any>({
    resolver: zodResolver(schema) as any,
    values,
  });

  return (
    <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit((formValues) => onSubmit(formValues as DealFormValues))}>
      <div className="md:col-span-2"><label className="mb-1 block text-sm font-medium text-slate-700">Client name *</label><Input {...register('lead_client_name')} error={errors.lead_client_name?.message} /></div>
      <div><label className="mb-1 block text-sm font-medium text-slate-700">Client company</label><Input {...register('lead_company_name')} /></div>
      <div><label className="mb-1 block text-sm font-medium text-slate-700">Contact phone</label><Input {...register('lead_contact_phone')} /></div>
      <div><label className="mb-1 block text-sm font-medium text-slate-700">Contact email</label><Input {...register('lead_contact_email')} /></div>
      <div><label className="mb-1 block text-sm font-medium text-slate-700">Machine category</label><Input {...register('machine_category_needed')} /></div>
      <div><label className="mb-1 block text-sm font-medium text-slate-700">Machine size</label><Input {...register('machine_size_needed')} /></div>
      <div><label className="mb-1 block text-sm font-medium text-slate-700">Location</label><Input {...register('location_needed')} /></div>
      <div><label className="mb-1 block text-sm font-medium text-slate-700">Status</label><Select {...register('status')}>{DEAL_STATUSES.map((status) => <option key={status} value={status}>{status}</option>)}</Select></div>
      <div><label className="mb-1 block text-sm font-medium text-slate-700">Start date</label><DatePicker {...register('start_date_needed')} /></div>
      <div><label className="mb-1 block text-sm font-medium text-slate-700">End date</label><DatePicker {...register('end_date_needed')} /></div>
      <div><label className="mb-1 block text-sm font-medium text-slate-700">Client rate</label><Input type="number" step="0.01" {...register('client_rate')} /></div>
      <div><label className="mb-1 block text-sm font-medium text-slate-700">Supplier rate</label><Input type="number" step="0.01" {...register('supplier_rate')} /></div>
      <div className="md:col-span-2"><label className="mb-1 block text-sm font-medium text-slate-700">Notes</label><textarea className="h-24 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" {...register('notes')} /></div>
      <div className="md:col-span-2 flex justify-end"><Button type="submit" loading={loading}>Save Deal</Button></div>
    </form>
  );
}
