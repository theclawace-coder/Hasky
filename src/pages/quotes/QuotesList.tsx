import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, Briefcase, CheckCircle2, Link2, Mail, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useQuotes } from '../../hooks/useQuotes';
import { createDocumentShareLink, sendDocumentEmail, updateBookingAndMachineStatus } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Table, TableContainer } from '../../components/ui/Table';
import { formatCurrency, formatDate } from '../../lib/utils';
import type { Quote } from '../../types';

type QuoteWithBooking = Quote & {
  bookings?: { id: string; status: string; booking_number: string | null }[];
};

const statuses = ['', 'draft', 'sent', 'accepted', 'declined', 'expired', 'paid'];

export default function QuotesList() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [status, setStatus] = useState('');
  const [sendingQuoteId, setSendingQuoteId] = useState<string | null>(null);
  const [copyingQuoteId, setCopyingQuoteId] = useState<string | null>(null);

  const { quotesQuery, convertMutation } = useQuotes(status || undefined);

  // Redirect to wizard when ?new=true (e.g. from Dashboard CTA)
  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      setSearchParams({}, { replace: true });
      navigate('/bookings/new');
    }
  }, [searchParams, setSearchParams, navigate]);

  const convertQuote = async (quoteId: string) => {
    try {
      const bookingId = await convertMutation.mutateAsync(quoteId);
      try {
        await updateBookingAndMachineStatus(bookingId, 'confirmed', 'on_hire');
        toast.success('Quote converted and job confirmed');
      } catch {
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

  const quotes = (quotesQuery.data ?? []) as QuoteWithBooking[];

  // Only show "convert" banner for manually-created accepted quotes
  // not already linked to a confirmed/completed booking
  const acceptedQuotes = quotes.filter((q) => {
    if (q.status !== 'accepted') return false;
    const linked = q.bookings?.[0];
    return !linked || (linked.status !== 'confirmed' && linked.status !== 'completed');
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-2xl font-semibold text-slate-900">Quotes</h2>
        <Link
          to="/bookings/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white hover:bg-violet-700"
        >
          <Plus className="size-4" />
          New Job
        </Link>
      </div>

      {/* ── Accepted quotes action banner (manually-created quotes without a confirmed job) ── */}
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
          <Button
            key={tab || 'all'}
            size="sm"
            variant={status === tab ? 'primary' : 'secondary'}
            onClick={() => setStatus(tab)}
          >
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
                <td colSpan={8} className="p-6 text-sm text-slate-500">
                  No quotes yet. Create a new job via the wizard and it will appear here automatically.
                </td>
              </tr>
            ) : (
              quotes.map((quote) => {
                const linkedBooking = quote.bookings?.[0];
                const isJobConfirmed =
                  linkedBooking &&
                  (linkedBooking.status === 'confirmed' || linkedBooking.status === 'completed');

                return (
                  <tr
                    key={quote.id}
                    className={`border-t border-slate-100 transition-opacity ${isJobConfirmed ? 'opacity-50' : ''}`}
                  >
                    <td className="p-3 font-medium text-slate-900">{quote.quote_number}</td>
                    <td className="p-3">{quote.customers?.name ?? '-'}</td>
                    <td className="p-3">{quote.machines?.name ?? '-'}</td>
                    <td className="p-3">{formatCurrency(quote.total)}</td>
                    <td className="p-3">
                      {isJobConfirmed ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
                          <CheckCircle2 className="size-3" />
                          Job Confirmed
                        </span>
                      ) : (
                        <StatusBadge status={quote.status} />
                      )}
                    </td>
                    <td className="p-3">{formatDate(quote.issue_date)}</td>
                    <td className="p-3">{formatDate(quote.expiry_date)}</td>
                    <td className="p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        {linkedBooking ? (
                          <>
                            {/* Wizard-generated quote: can still send/share, plus link to job */}
                            {!isJobConfirmed && (
                              <>
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
                              </>
                            )}
                            <Link
                              to={`/bookings/${linkedBooking.id}`}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                            >
                              <Briefcase className="size-3.5" />
                              View Job
                            </Link>
                          </>
                        ) : (
                          <>
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
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </Table>
      </TableContainer>
    </div>
  );
}
