import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useAuth } from '../../hooks/useAuth';
import { useBookings } from '../../hooks/useBookings';
import { useCustomers } from '../../hooks/useCustomers';
import { useMachines } from '../../hooks/useMachines';
import { getCompanySettings } from '../../services/api';
import type { Booking, BookingChargeItem, Customer, DepositType, PaymentPlan, RateType } from '../../types';
import type { CustomerFormValues } from '../../components/customers/CustomerForm';
import { NewBookingWizard, type WizardValues } from '../../components/bookings/NewBookingWizard';
import { Card } from '../../components/ui/Card';

export default function NewBooking() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { saveBookingMutation, bookingsQuery } = useBookings();
  const { customersQuery, saveCustomerMutation } = useCustomers();
  const { machinesQuery } = useMachines();
  const [recentCustomers, setRecentCustomers] = useState<Customer[]>([]);
  const companySettingsQuery = useQuery({
    queryKey: ['company_settings'],
    queryFn: getCompanySettings,
  });

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
    const hireSubtotal = wizardValues.rateAmount * days;
    const extrasSubtotal = wizardValues.chargeItems.reduce(
      (sum, item) => sum + Number(item.quantity) * Number(item.unit_price),
      0,
    );
    const totalAmount = hireSubtotal + extrasSubtotal;
    const depositAmount = wizardValues.paymentPlan === 'deposit'
      ? wizardValues.depositType === 'percent'
        ? (totalAmount * Math.min(Math.max(wizardValues.depositValue, 0), 100)) / 100
        : Math.max(wizardValues.depositValue, 0)
      : 0;

    try {
      const payload: Partial<Booking> = {
        company_id: profile.company_id,
        machine_id: wizardValues.machine.id,
        customer_id: wizardValues.customer.id,
        start_date: wizardValues.startDate,
        end_date: wizardValues.endDate || wizardValues.startDate,
        rate_type: wizardValues.rateType as RateType,
        rate_amount: wizardValues.rateAmount,
        hire_subtotal: hireSubtotal,
        extras_subtotal: extrasSubtotal,
        total_amount: totalAmount,
        delivery_address: wizardValues.deliveryAddress || undefined,
        delivery_lat: wizardValues.deliveryLat,
        delivery_lng: wizardValues.deliveryLng,
        payment_plan: wizardValues.paymentPlan as PaymentPlan,
        deposit_type: wizardValues.paymentPlan === 'deposit'
          ? (wizardValues.depositType as DepositType)
          : null,
        deposit_value: wizardValues.paymentPlan === 'deposit' ? wizardValues.depositValue : null,
        deposit_amount: wizardValues.paymentPlan === 'deposit' ? depositAmount : 0,
        deposit_paid_amount: 0,
        notes: wizardValues.notes || undefined,
        status: 'quote',
        created_by: profile.id,
      };
      const chargeItems: Array<Pick<BookingChargeItem, 'description' | 'quantity' | 'unit_price'>> =
        wizardValues.chargeItems
          .filter((item) => item.description.trim().length > 0)
          .map((item) => ({
            description: item.description.trim(),
            quantity: Number(item.quantity),
            unit_price: Number(item.unit_price),
          }));

      await saveBookingMutation.mutateAsync({ payload, chargeItems });
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
        existingBookings={bookingsQuery.data ?? []}
        defaultChargeTemplates={companySettingsQuery.data?.default_booking_charges ?? []}
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
