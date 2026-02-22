import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Link2, Mail, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../hooks/useAuth';
import { useCustomers } from '../../hooks/useCustomers';
import { useMachines } from '../../hooks/useMachines';
import { useQuotes } from '../../hooks/useQuotes';
import { createDocumentShareLink, generateDocumentNumber, sendDocumentEmail, updateBookingAndMachineStatus } from '../../services/api';
import { LineItemsTable, type LineItemValue } from '../../components/invoices/LineItemsTable';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Select';
import { Skeleton } from '../../components/ui/Skeleton';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Table, TableContainer } from '../../components/ui/Table';
import { formatCurrency, formatDate } from '../../lib/utils';
import type { Quote, QuoteStatus } from '../../types';

const statuses = ['', 'draft', 'sent', 'accepted', 'declined', 'expired', 'paid'];

export default function QuotesList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { profile } = useAuth();
  const [status, setStatus] = useState('');
  const [open, setOpen] = useState(false);
  const [quoteNumber, setQuoteNumber] = useState('');
  const [isGeneratingNumber, setIsGeneratingNumber] = useState(false);

  const [customerId, setCustomerId] = useState('');
  const [machineId, setMachineId] = useState('');
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  );
  const [hireStartDate, setHireStartDate] = useState('');
  const [hireEndDate, setHireEndDate] = useState('');
  const [notes, setNotes] = useState('');
  const [quoteStatus, setQuoteStatus] = useState('draft');
  const [items, setItems] = useState<LineItemValue[]>([{ description: '', quantity: 1, unit_price: 0 }]);

  const [sendingQuoteId, setSendingQuoteId] = useState<string | null>(null);
  const [copyingQuoteId, setCopyingQuoteId] = useState<string | null>(null);

  const { quotesQuery, saveQuoteMutation, convertMutation } = useQuotes(status || undefined);
  const { customersQuery } = useCustomers();
  const { machinesQuery } = useMachines();

  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
    const gst = subtotal * 0.1;
    return { subtotal, gst, total: subtotal + gst };
  }, [items]);

  // Auto-open create modal when ?new=true (e.g. from Dashboard CTA)
  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      void handleCreateOpen();
      setSearchParams({}, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-fill daily rate line item when machine is selected
  const handleMachineChange = (id: string) => {
    setMachineId(id);
    const machine = (machinesQuery.data ?? []).find((m) => m.id === id);
    if (machine && Number(machine.daily_rate ?? 0) > 0) {
      setItems([{
        description: `${machine.name} — daily hire`,
        quantity: 1,
        unit_price: Number(machine.daily_rate ?? 0),
      }]);
    }
  };

  const resetForm = () => {
    setQuoteNumber('');
    setCustomerId('');
    setMachineId('');
    setIssueDate(new Date().toISOString().split('T')[0]);
    setExpiryDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    setHireStartDate('');
    setHireEndDate('');
    setNotes('');
    setQuoteStatus('draft');
    setItems([{ description: '', quantity: 1, unit_price: 0 }]);
  };

  const closeModal = () => {
    setOpen(false);
    resetForm();
  };

  const handleCreateOpen = async () => {
    resetForm();
    setOpen(true);
    setIsGeneratingNumber(true);
    try {
      const number = await generateDocumentNumber('QUO');
      setQuoteNumber(number);
    } catch {
      setQuoteNumber('QUO-HB-0001');
    } finally {
      setIsGeneratingNumber(false);
    }
  };

  const saveQuote = async () => {
    if (!profile?.company_id || !customerId || !quoteNumber) {
      toast.error('Quote number and customer are required');
      return;
    }

    try {
      const quotePayload: Partial<Quote> = {
        company_id: profile.company_id,
        customer_id: customerId,
        machine_id: machineId || null,
        quote_number: quoteNumber,
        status: quoteStatus as QuoteStatus,
        issue_date: issueDate,
        expiry_date: expiryDate || null,
        hire_start_date: hireStartDate || null,
        hire_end_date: hireEndDate || null,
        subtotal: totals.subtotal,
        gst: totals.gst,
        total: totals.total,
        notes,
      };
      await saveQuoteMutation.mutateAsync({
        payload: quotePayload,
        items,
      });
      toast.success('Quote saved');
      closeModal();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save quote');
    }
  };

  const convertQuote = async (quoteId: string) => {
    try {
      const bookingId = await convertMutation.mutateAsync(quoteId);
      // Try to auto-confirm: accepted quote = customer said yes, skip Pending state
      try {
        await updateBookingAndMachineStatus(bookingId, 'confirmed', 'on_hire');
        toast.success('Quote converted and job confirmed');
      } catch {
        // Payment required or other constraint — let the booking detail page handle it
        toast.success('Quote converted to job — record payment to confirm');
      }
      navigate(`/bookings/${bookingId}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to convert quote');
    }
  };

  const handleSendQuote = async (quoteId: string, email?: string | null) => {
    setSendingQuoteId(quoteId);
    try {
      const response = await sendDocumentEmail('quote', quoteId, email ?? undefined);
      if (response.email_sent) {
        toast.success(response.to_email ? `Quote emailed to ${response.to_email}` : 'Quote email sent');
      } else {
        toast.info('Email service unavailable right now. A private quote link was generated instead.');
      }
      void quotesQuery.refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send quote email');
    } finally {
      setSendingQuoteId(null);
    }
  };

  const handleCopyQuoteLink = async (quoteId: string) => {
    setCopyingQuoteId(quoteId);
    try {
      const response = await createDocumentShareLink('quote', quoteId);
      if (!navigator?.clipboard) {
        throw new Error('Clipboard is not available in this browser');
      }
      await navigator.clipboard.writeText(response.share_url);
      toast.success('Private quote link copied');
      void quotesQuery.refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to copy quote link');
    } finally {
      setCopyingQuoteId(null);
    }
  };

  const quotes = quotesQuery.data ?? [];
  const acceptedQuotes = quotes.filter((q) => q.status === 'accepted');

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-2xl font-semibold text-slate-900">Quotes</h2>
        <Button onClick={() => void handleCreateOpen()}>
          <Plus className="size-4" />
          New Quote
        </Button>
      </div>

      {/* ── Accepted quotes action banner ── */}
      {acceptedQuotes.length > 0 && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-emerald-800">
                {acceptedQuotes.length === 1
                  ? '1 accepted quote ready to convert to a job'
                  : `${acceptedQuotes.length} accepted quotes ready to convert to jobs`}
              </p>
              <p className="mt-0.5 text-xs text-emerald-600">
                The customer has accepted — convert now to put the machine on hire and generate an invoice.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {acceptedQuotes.map((quote) => (
                  <Button
                    key={quote.id}
                    size="sm"
                    onClick={() => void convertQuote(quote.id)}
                    loading={convertMutation.isPending}
                  >
                    <ArrowRight className="size-3.5" />
                    Convert {quote.quote_number}
                    {quote.customers?.name ? ` — ${quote.customers.name}` : ''}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        {statuses.map((tab) => (
          <Button key={tab || 'all'} size="sm" variant={status === tab ? 'primary' : 'secondary'} onClick={() => setStatus(tab)}>
            {tab ? tab[0].toUpperCase() + tab.slice(1) : 'All'}
          </Button>
        ))}
      </div>

      <TableContainer>
        <Table>
          <thead className="bg-slate-50">
            <tr>
              <th className="p-3">Quote #</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Machine</th>
              <th className="p-3">Total</th>
              <th className="p-3">Status</th>
              <th className="p-3">Issue</th>
              <th className="p-3">Expiry</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {quotesQuery.isLoading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <tr key={index} className="border-t border-slate-100">
                  <td className="p-3" colSpan={8}>
                    <Skeleton className="h-8 w-full rounded-lg" />
                  </td>
                </tr>
              ))
            ) : quotesQuery.isError ? (
              <tr className="border-t border-slate-100">
                <td colSpan={8} className="p-6 text-sm text-red-600">
                  {quotesQuery.error instanceof Error
                    ? quotesQuery.error.message
                    : 'Quotes failed to load. Confirm the quotes table and RLS policies are applied.'}
                </td>
              </tr>
            ) : quotes.length === 0 ? (
              <tr className="border-t border-slate-100">
                <td colSpan={8} className="p-6 text-sm text-slate-500">No quotes found for this filter.</td>
              </tr>
            ) : (
              quotes.map((quote) => (
                <tr key={quote.id} className="border-t border-slate-100">
                  <td className="p-3 font-medium text-slate-900">{quote.quote_number}</td>
                  <td className="p-3">{quote.customers?.name ?? '-'}</td>
                  <td className="p-3">{quote.machines?.name ?? '-'}</td>
                  <td className="p-3">{formatCurrency(quote.total)}</td>
                  <td className="p-3"><StatusBadge status={quote.status} /></td>
                  <td className="p-3">{formatDate(quote.issue_date)}</td>
                  <td className="p-3">{formatDate(quote.expiry_date)}</td>
                  <td className="p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => void handleSendQuote(quote.id, quote.customers?.email)}
                        loading={sendingQuoteId === quote.id}
                      >
                        <Mail className="size-3.5" />
                        Send
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => void handleCopyQuoteLink(quote.id)}
                        loading={copyingQuoteId === quote.id}
                      >
                        <Link2 className="size-3.5" />
                        Link
                      </Button>
                      {quote.status === 'accepted' || quote.status === 'paid' ? (
                        <Button
                          size="sm"
                          onClick={() => void convertQuote(quote.id)}
                          loading={convertMutation.isPending}
                        >
                          Convert
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </TableContainer>

      <Modal
        open={open}
        onClose={closeModal}
        title="Create Quote"
        description="Create, email, and collect payment using a private customer link"
        size="xl"
      >
        <div className="space-y-4">
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Quote number</label>
              <Input
                value={quoteNumber}
                onChange={(event) => setQuoteNumber(event.target.value)}
                placeholder={isGeneratingNumber ? 'Generating...' : 'Quote number'}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Status</label>
              <Select value={quoteStatus} onChange={(event) => setQuoteStatus(event.target.value)}>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="accepted">Accepted</option>
                <option value="declined">Declined</option>
                <option value="expired">Expired</option>
                <option value="paid">Paid</option>
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Customer</label>
              <Select value={customerId} onChange={(event) => setCustomerId(event.target.value)}>
                <option value="">Select customer</option>
                {(customersQuery.data ?? []).map((customer) => (
                  <option key={customer.id} value={customer.id}>{customer.name}</option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Machine</label>
              <Select value={machineId} onChange={(event) => handleMachineChange(event.target.value)}>
                <option value="">Select machine</option>
                {(machinesQuery.data ?? []).map((machine) => (
                  <option key={machine.id} value={machine.id}>{machine.name}</option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Issue date</label>
              <Input type="date" value={issueDate} onChange={(event) => setIssueDate(event.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Expiry date</label>
              <Input type="date" value={expiryDate} onChange={(event) => setExpiryDate(event.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Hire start date</label>
              <Input type="date" value={hireStartDate} onChange={(event) => setHireStartDate(event.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Hire end date</label>
              <Input type="date" value={hireEndDate} onChange={(event) => setHireEndDate(event.target.value)} />
            </div>
          </div>

          <LineItemsTable items={items} onChange={setItems} />

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Notes</label>
            <textarea
              className="h-24 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </div>

          <div className="rounded-xl bg-slate-50 p-3 text-sm">
            <p>Subtotal: {formatCurrency(totals.subtotal)}</p>
            <p>GST: {formatCurrency(totals.gst)}</p>
            <p className="font-semibold">Total: {formatCurrency(totals.total)}</p>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={closeModal}>Cancel</Button>
            <Button onClick={saveQuote} loading={saveQuoteMutation.isPending || isGeneratingNumber}>Save Quote</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
