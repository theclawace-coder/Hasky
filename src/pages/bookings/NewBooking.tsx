import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../../hooks/useAuth';
import { useBookings } from '../../hooks/useBookings';
import { useCustomers } from '../../hooks/useCustomers';
import { useMachines } from '../../hooks/useMachines';
import type { Customer } from '../../types';
import type { CustomerFormValues } from '../../components/customers/CustomerForm';
import { NewBookingWizard, type WizardValues } from '../../components/bookings/NewBookingWizard';
import { Card } from '../../components/ui/Card';

export default function NewBooking() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { saveBookingMutation } = useBookings();
  const { customersQuery, saveCustomerMutation } = useCustomers();
  const { machinesQuery } = useMachines();
  const [recentCustomers, setRecentCustomers] = useState<Customer[]>([]);

  const machineId = params.get('machineId') ?? undefined;
  const startDate = params.get('startDate') ?? undefined;

  const customers = useMemo(() => {
    const rows = [...(customersQuery.data ?? []), ...recentCustomers];
    const deduped = new Map(rows.map((c) => [c.id, c]));
    return Array.from(deduped.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [customersQuery.data, recentCustomers]);

  const onSubmit = async (wizardValues: WizardValues) => {
    if (!profile?.company_id || !wizardValues.machine || !wizardValues.customer) return;

    const start = new Date(wizardValues.startDate);
    const end = wizardValues.endDate ? new Date(wizardValues.endDate) : start;
    const days = Math.max(
      Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1,
      1,
    );

    try {
      await saveBookingMutation.mutateAsync({
        company_id: profile.company_id,
        machine_id: wizardValues.machine.id,
        customer_id: wizardValues.customer.id,
        start_date: wizardValues.startDate,
        end_date: wizardValues.endDate || wizardValues.startDate,
        rate_type: wizardValues.rateType,
        rate_amount: wizardValues.rateAmount,
        total_amount: wizardValues.rateAmount * days,
        delivery_address: wizardValues.deliveryAddress || undefined,
        notes: wizardValues.notes || undefined,
        status: 'quote',
        created_by: profile.id,
      } as any);
      toast.success('Job created!');
      navigate('/bookings');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create job');
    }
  };

  const onCreateCustomer = async (values: CustomerFormValues) => {
    if (!profile?.company_id) throw new Error('Company not found');
    const customer = await saveCustomerMutation.mutateAsync({
      ...values,
      company_id: profile.company_id,
    });
    setRecentCustomers((state) => [customer, ...state.filter((c) => c.id !== customer.id)]);
    return customer;
  };

  return (
    <Card>
      <NewBookingWizard
        machines={machinesQuery.data ?? []}
        customers={customers}
        defaultMachineId={machineId}
        defaultStartDate={startDate}
        onSubmit={onSubmit}
        onCreateCustomer={onCreateCustomer}
        createCustomerLoading={saveCustomerMutation.isPending}
        loading={saveBookingMutation.isPending}
      />
    </Card>
  );
}
