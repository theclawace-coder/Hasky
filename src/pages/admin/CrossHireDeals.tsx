import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { notify } from '../../lib/notify';
import { DEAL_STATUSES } from '../../lib/constants';
import { useCrossHireDeals } from '../../hooks/useCrossHireDeals';
import { KanbanBoard } from '../../components/ui/KanbanBoard';
import { DealForm, type DealFormValues } from '../../components/admin/DealForm';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { formatCurrency, formatDate } from '../../lib/utils';
import type { CrossHireDeal } from '../../types';

export default function CrossHireDeals() {
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { dealsQuery, saveDealMutation } = useCrossHireDeals();
  const deals = useMemo(() => dealsQuery.data ?? [], [dealsQuery.data]);

  const selectedDeal = useMemo(() => deals.find((deal) => deal.id === selectedId), [deals, selectedId]);

  const moveDeal = async (id: string, status: string) => {
    try {
      await saveDealMutation.mutateAsync({ id, status: status as CrossHireDeal['status'] });
      notify.success('Deal status updated');
    } catch (error) {
      notify.error(error instanceof Error ? error.message : 'Failed to update deal');
    }
  };

  const saveDeal = async (values: DealFormValues) => {
    try {
      await saveDealMutation.mutateAsync(values);
      notify.success('Deal saved');
      setOpen(false);
      setSelectedId(null);
    } catch (error) {
      notify.error(error instanceof Error ? error.message : 'Failed to save deal');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-2xl font-semibold text-slate-900">Cross-Hire Deals</h2>
        <Button onClick={() => { setSelectedId(null); setOpen(true); }}>
          <Plus className="size-4" />
          New Lead
        </Button>
      </div>

      <KanbanBoard
        columns={[...DEAL_STATUSES]}
        items={deals.map((deal) => ({
          id: deal.id,
          title: deal.lead_client_name,
          subtitle: `${deal.machine_category_needed ?? 'Machine'} • ${deal.location_needed ?? 'Unknown location'} • ${formatDate(deal.start_date_needed)} to ${formatDate(deal.end_date_needed)}`,
          status: deal.status,
          amount: formatCurrency(Number(deal.margin ?? 0)),
        }))}
        onMove={moveDeal}
      />

      {selectedDeal ? (
        <Card>
          <h3 className="text-lg font-semibold text-slate-900">Deal Detail</h3>
          <div className="mt-3 grid gap-2 text-sm text-slate-700 md:grid-cols-2">
            <p><span className="font-medium">Client:</span> {selectedDeal.lead_client_name}</p>
            <p><span className="font-medium">Company:</span> {selectedDeal.lead_company_name ?? '-'}</p>
            <p><span className="font-medium">Phone:</span> {selectedDeal.lead_contact_phone ?? '-'}</p>
            <p><span className="font-medium">Email:</span> {selectedDeal.lead_contact_email ?? '-'}</p>
            <p><span className="font-medium">Machine:</span> {selectedDeal.machine_category_needed ?? '-'} {selectedDeal.machine_size_needed ?? ''}</p>
            <p><span className="font-medium">Location:</span> {selectedDeal.location_needed ?? '-'}</p>
            <p><span className="font-medium">Supplier rate:</span> {formatCurrency(Number(selectedDeal.supplier_rate ?? 0))}</p>
            <p><span className="font-medium">Client rate:</span> {formatCurrency(Number(selectedDeal.client_rate ?? 0))}</p>
            <p><span className="font-medium">Margin:</span> {formatCurrency(Number(selectedDeal.margin ?? 0))}</p>
          </div>
        </Card>
      ) : null}

      <Modal open={open} onClose={() => setOpen(false)} title={selectedId ? 'Edit Deal' : 'New Lead'}>
        <DealForm defaultValues={selectedDeal ?? undefined} onSubmit={saveDeal} loading={saveDealMutation.isPending} />
      </Modal>

      <Card>
        <h3 className="text-lg font-semibold text-slate-900">Deals List</h3>
        <div className="mt-3 space-y-2">
          {deals.map((deal) => (
            <button
              type="button"
              key={deal.id}
              className="w-full rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-left"
              onClick={() => {
                setSelectedId(deal.id);
                setOpen(true);
              }}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium text-slate-900">{deal.lead_client_name}</p>
                <p className="text-sm text-emerald-700">{formatCurrency(Number(deal.margin ?? 0))}</p>
              </div>
              <p className="text-xs text-slate-600">{deal.machine_category_needed} • {deal.location_needed}</p>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}
