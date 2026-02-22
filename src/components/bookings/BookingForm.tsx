import { useMemo, useState } from 'react';
import { Controller, useForm, useWatch, type Resolver } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { BOOKING_STATUSES, DEPOSIT_TYPES, PAYMENT_PLANS, RATE_TYPES } from '../../lib/constants';
import { AddressAutocomplete } from '../ui/AddressAutocomplete';
import { Button } from '../ui/Button';
import { DatePicker } from '../ui/DatePicker';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Modal } from '../ui/Modal';
import { CustomerForm, type CustomerFormValues } from '../customers/CustomerForm';
import type { Booking, Customer, Machine } from '../../types';

const schema = z.object({
  id: z.string().optional(),
  machine_id: z.string().min(1, 'Machine is required'),
  customer_id: z.string().min(1, 'Customer is required'),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  rate_type: z.enum(RATE_TYPES).optional(),
  rate_amount: z.coerce.number().min(0),
  total_amount: z.coerce.number().optional(),
  delivery_address: z.string().optional(),
  delivery_lat: z.coerce.number().optional(),
  delivery_lng: z.coerce.number().optional(),
  payment_plan: z.enum(PAYMENT_PLANS).default('on_completion'),
  deposit_type: z.enum(DEPOSIT_TYPES).optional(),
  deposit_value: z.coerce.number().optional(),
  deposit_amount: z.coerce.number().optional(),
  notes: z.string().optional(),
  status: z.enum(BOOKING_STATUSES).default('quote'),
});

export type BookingFormValues = z.infer<typeof schema>;

interface BookingFormProps {
  machines: Machine[];
  customers: Customer[];
  defaultValues?: Partial<Booking>;
  onSubmit: (values: BookingFormValues) => void;
  onCreateCustomer?: (values: CustomerFormValues) => Promise<Customer>;
  createCustomerLoading?: boolean;
  loading?: boolean;
}

export function BookingForm({
  machines,
  customers,
  defaultValues,
  onSubmit,
  onCreateCustomer,
  createCustomerLoading,
  loading,
}: BookingFormProps) {
  const [customerModalOpen, setCustomerModalOpen] = useState(false);

  const values = useMemo<BookingFormValues>(
    () => ({
      id: defaultValues?.id,
      machine_id: defaultValues?.machine_id ?? '',
      customer_id: defaultValues?.customer_id ?? '',
      start_date: defaultValues?.start_date ?? '',
      end_date: defaultValues?.end_date ?? '',
      rate_type: defaultValues?.rate_type ?? 'daily',
      rate_amount: defaultValues?.rate_amount ?? 0,
      total_amount: defaultValues?.total_amount ?? undefined,
      delivery_address: defaultValues?.delivery_address ?? '',
      delivery_lat: defaultValues?.delivery_lat ?? undefined,
      delivery_lng: defaultValues?.delivery_lng ?? undefined,
      payment_plan: defaultValues?.payment_plan ?? 'on_completion',
      deposit_type: defaultValues?.deposit_type ?? undefined,
      deposit_value: defaultValues?.deposit_value ?? undefined,
      deposit_amount: defaultValues?.deposit_amount ?? undefined,
      notes: defaultValues?.notes ?? '',
      status: defaultValues?.status ?? 'quote',
    }),
    [defaultValues],
  );

  const {
    control,
    register,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors },
  } = useForm<BookingFormValues>({
    resolver: zodResolver(schema) as Resolver<BookingFormValues>,
    values,
  });

  const machineId = useWatch({ control, name: 'machine_id' }) ?? '';

  const onMachineChange = (value: string) => {
    setValue('machine_id', value, { shouldValidate: true, shouldDirty: true });
    const machine = machines.find((item) => item.id === value);
    const rateType = getValues('rate_type') || 'daily';
    if (!machine) {
      return;
    }

    const rateMap = {
      hourly: machine.hourly_rate,
      daily: machine.daily_rate,
      weekly: machine.weekly_rate,
      monthly: machine.monthly_rate,
    };

    setValue('rate_amount', Number(rateMap[rateType as keyof typeof rateMap] ?? 0), {
      shouldDirty: true,
    });
  };

  const onCreateCustomerSubmit = async (customerValues: CustomerFormValues) => {
    if (!onCreateCustomer) {
      return;
    }
    try {
      const createdCustomer = await onCreateCustomer(customerValues);
      setValue('customer_id', createdCustomer.id, { shouldDirty: true, shouldValidate: true });
      setCustomerModalOpen(false);
      toast.success('Customer added to booking');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add customer');
    }
  };

  return (
    <>
      <form
        className="grid gap-4 md:grid-cols-2"
        onSubmit={handleSubmit((formValues) => onSubmit(formValues))}
      >
        <div>
          <div className="mb-1 flex items-center justify-between gap-2">
            <label className="block text-sm font-medium text-slate-700">Customer *</label>
            {onCreateCustomer ? (
              <button
                type="button"
                className="text-xs font-medium text-blue-700 hover:text-blue-800"
                onClick={() => setCustomerModalOpen(true)}
              >
                + Add customer
              </button>
            ) : null}
          </div>
          <Select {...register('customer_id')} error={errors.customer_id?.message}>
            <option value="">Select customer</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Machine *</label>
          <Select
            value={machineId}
            onChange={(event) => onMachineChange(event.target.value)}
            error={errors.machine_id?.message}
          >
            <option value="">Select available machine</option>
            {machines
              .filter((machine) => machine.status === 'available' || machine.id === machineId)
              .map((machine) => (
                <option key={machine.id} value={machine.id}>
                  {machine.machine_categories?.name} - {machine.name}
                </option>
              ))}
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Start date *</label>
          <DatePicker {...register('start_date')} error={errors.start_date?.message} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">End date <span className="text-red-500">*</span></label>
          <DatePicker {...register('end_date')} error={errors.end_date?.message} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Rate type</label>
          <Select {...register('rate_type')}>
            {RATE_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">Rate amount</label>
          <Input type="number" step="0.01" {...register('rate_amount')} error={errors.rate_amount?.message} />
        </div>
        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium text-slate-700">Delivery address</label>
          <Controller
            control={control}
            name="delivery_address"
            render={({ field }) => (
              <AddressAutocomplete
                value={field.value ?? ''}
                onChange={field.onChange}
                onSelect={(suggestion) => {
                  field.onChange(suggestion.fullAddress);
                  setValue('delivery_lat', suggestion.latitude, { shouldDirty: true });
                  setValue('delivery_lng', suggestion.longitude, { shouldDirty: true });
                }}
                placeholder="Search delivery address or type manually"
              />
            )}
          />
        </div>
        <div className="md:col-span-2">
          <label className="mb-1 block text-sm font-medium text-slate-700">Notes</label>
          <textarea className="h-24 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" {...register('notes')} />
        </div>
        <div className="md:col-span-2 flex justify-end">
          <Button type="submit" loading={loading}>
            Save Booking
          </Button>
        </div>
      </form>

      {onCreateCustomer ? (
        <Modal
          open={customerModalOpen}
          onClose={() => setCustomerModalOpen(false)}
          title="Add Customer"
        >
          <CustomerForm
            onSubmit={(customerValues) => {
              void onCreateCustomerSubmit(customerValues);
            }}
            loading={createCustomerLoading}
          />
        </Modal>
      ) : null}
    </>
  );
}
