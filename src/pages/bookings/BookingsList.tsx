import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  List,
  CalendarRange,
  Plus,
  ChevronLeft,
  ChevronRight,
  Search,
} from 'lucide-react';
import {
  addDays,
  addMonths,
  addWeeks,
  format,
  startOfWeek,
} from 'date-fns';
import { useBookings } from '../../hooks/useBookings';
import { useMachines } from '../../hooks/useMachines';
import { BookingCalendar } from '../../components/bookings/BookingCalendar';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { Table, TableContainer } from '../../components/ui/Table';
import { formatCurrency, formatDate } from '../../lib/utils';
import { BOOKING_STATUS_LABELS } from '../../lib/constants';
import type { BookingMachine, Invoice } from '../../types';

const tabs = ['', 'quote', 'confirmed', 'completed', 'cancelled'];

function getAllMachineNames(b: { machines?: { name?: string } | null; booking_machines?: BookingMachine[] }) {
  const bms = (b.booking_machines ?? []).slice().sort((a, c) => a.machine_order - c.machine_order);
  if (bms.length > 0) return bms.map((bm) => bm.machines?.name ?? '').filter(Boolean);
  return b.machines?.name ? [b.machines.name] : [];
}

export default function BookingsList() {
  const navigate = useNavigate();
  const [calendarView, setCalendarView] = useState(true);
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [calendarMode, setCalendarMode] = useState<'week' | 'month'>('week');
  const [calendarDate, setCalendarDate] = useState(new Date());

  const { bookingsQuery } = useBookings(status ? { status } : undefined);
  const { machinesQuery } = useMachines();

  const bookings = useMemo(() => bookingsQuery.data ?? [], [bookingsQuery.data]);
  const machines = useMemo(
    () => (machinesQuery.data ?? []).sort((a, b) => a.name.localeCompare(b.name)),
    [machinesQuery.data],
  );


  const filteredBookings = useMemo(() => {
    if (!search.trim()) return bookings;
    const q = search.toLowerCase();
    return bookings.filter(
      (b) =>
        b.customers?.name?.toLowerCase().includes(q) ||
        getAllMachineNames(b).some((name) => name.toLowerCase().includes(q)),
    );
  }, [bookings, search]);

  const calendarLabel = useMemo(() => {
    if (calendarMode === 'month') {
      return format(calendarDate, 'MMMM yyyy');
    }
    const weekStart = startOfWeek(calendarDate, { weekStartsOn: 1 });
    const weekEnd = addDays(weekStart, 6);
    return `${format(weekStart, 'd MMM')} - ${format(weekEnd, 'd MMM yyyy')}`;
  }, [calendarDate, calendarMode]);

  const shiftCalendar = (direction: -1 | 1) => {
    setCalendarDate((current) =>
      calendarMode === 'month'
        ? addMonths(current, direction)
        : addWeeks(current, direction),
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-2xl font-semibold text-slate-900">Jobs</h2>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={calendarView ? 'primary' : 'secondary'}
            onClick={() => setCalendarView(true)}
          >
            <CalendarRange className="size-4" />
            Calendar
          </Button>
          <Button
            variant={!calendarView ? 'primary' : 'secondary'}
            onClick={() => setCalendarView(false)}
          >
            <List className="size-4" />
            List
          </Button>
          <Button onClick={() => navigate('/bookings/new')}>
            <Plus className="size-4" />
            New Job
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        {tabs.map((tab) => (
          <Button
            key={tab || 'all'}
            size="sm"
            variant={status === tab ? 'primary' : 'secondary'}
            onClick={() => setStatus(tab)}
          >
            {tab ? (BOOKING_STATUS_LABELS[tab] ?? tab[0].toUpperCase() + tab.slice(1)) : 'All'}
          </Button>
        ))}
      </div>

      {calendarView ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant={calendarMode === 'week' ? 'primary' : 'secondary'}
                onClick={() => setCalendarMode('week')}
              >
                Weekly
              </Button>
              <Button
                size="sm"
                variant={calendarMode === 'month' ? 'primary' : 'secondary'}
                onClick={() => setCalendarMode('month')}
              >
                Monthly
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" variant="secondary" onClick={() => shiftCalendar(-1)}>
                <ChevronLeft className="size-4" />
                Previous
              </Button>
              <p className="w-full text-center text-sm font-medium text-slate-700 sm:min-w-44 sm:w-auto">
                {calendarLabel}
              </p>
              <Button size="sm" variant="secondary" onClick={() => shiftCalendar(1)}>
                Next
                <ChevronRight className="size-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setCalendarDate(new Date())}>
                Today
              </Button>
            </div>
          </div>
          <BookingCalendar
            mode={calendarMode}
            anchorDate={calendarDate}
            machines={machines}
            bookings={bookings}
            onBookingClick={(booking) => navigate(`/bookings/${booking.id}`)}
            onCellClick={(machine, date) =>
              navigate(
                `/bookings/new?machineId=${machine.id}&startDate=${date
                  .toISOString()
                  .split('T')[0]}`,
              )
            }
          />
        </>
      ) : (
        <>
          {/* Search bar — list view only */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="Search by customer or machine..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-sm shadow-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-400/20"
            />
          </div>

          {/* Mobile cards prevent table-driven page overflow on narrow viewports */}
          <div className="space-y-3 md:hidden">
            {filteredBookings.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-400 shadow-sm">
                {search ? `No jobs matching "${search}"` : 'No jobs found'}
              </div>
            ) : (
              filteredBookings.map((booking) => {
                const linkedInvoices = ((booking as typeof booking & { invoices?: Pick<Invoice, 'id' | 'status'>[] }).invoices) ?? [];
                const invoicesPaid = linkedInvoices.length > 0 && linkedInvoices.every((inv) => inv.status === 'paid');
                const isPaid = Boolean(booking.paid_in_full_date) || invoicesPaid;
                return (
                  <button
                    key={booking.id}
                    type="button"
                    onClick={() => navigate(`/bookings/${booking.id}`)}
                    className={`w-full rounded-xl border p-3 text-left shadow-sm transition ${isPaid ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-white'}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-violet-700">
                          {booking.booking_number ?? '—'}
                        </p>
                        <p className="mt-0.5 break-words text-xs text-slate-600">
                          {getAllMachineNames(booking).join(', ') || '—'}
                        </p>
                      </div>
                      <StatusBadge
                        status={isPaid ? 'paid' : booking.status}
                        label={isPaid ? 'Paid' : BOOKING_STATUS_LABELS[booking.status]}
                      />
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-xs text-slate-600">
                      <p>
                        <span className="text-slate-400">Customer:</span>{' '}
                        <span className="break-words">{booking.customers?.name ?? '—'}</span>
                      </p>
                      <p>
                        <span className="text-slate-400">Rate:</span> {formatCurrency(booking.rate_amount)}
                      </p>
                      <p>
                        <span className="text-slate-400">Start:</span> {formatDate(booking.start_date)}
                      </p>
                      <p>
                        <span className="text-slate-400">End:</span> {formatDate(booking.end_date)}
                      </p>
                      <p className="col-span-2 font-medium text-slate-700">
                        <span className="text-slate-400">Total:</span>{' '}
                        {formatCurrency(Number(booking.total_amount ?? booking.rate_amount))}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <TableContainer>
            <Table className="hidden md:table">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-3">Job #</th>
                  <th className="p-3">Machine</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Start</th>
                  <th className="p-3">End</th>
                  <th className="p-3">Rate</th>
                  <th className="p-3">Total</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredBookings.length === 0 ? (
                  <tr className="border-t border-slate-100">
                    <td colSpan={8} className="p-6 text-center text-sm text-slate-400">
                      {search ? `No jobs matching "${search}"` : 'No jobs found'}
                    </td>
                  </tr>
                ) : (
                  filteredBookings.map((booking) => {
                    const linkedInvoices = ((booking as typeof booking & { invoices?: Pick<Invoice, 'id' | 'status'>[] }).invoices) ?? [];
                    const invoicesPaid = linkedInvoices.length > 0 && linkedInvoices.every((inv) => inv.status === 'paid');
                    const isPaid = Boolean(booking.paid_in_full_date) || invoicesPaid;
                    return (
                      <tr
                        key={booking.id}
                        className={`cursor-pointer border-t border-slate-100 ${isPaid ? 'bg-emerald-50 hover:bg-emerald-100' : 'hover:bg-slate-50'}`}
                        onClick={() => navigate(`/bookings/${booking.id}`)}
                      >
                        <td className="p-3 font-medium text-violet-600" onClick={(e) => e.stopPropagation()}>
                          <Link to={`/bookings/${booking.id}`}>{booking.booking_number ?? '—'}</Link>
                        </td>
                        <td className="p-3">{getAllMachineNames(booking).join(', ') || '—'}</td>
                        <td className="p-3">{booking.customers?.name}</td>
                        <td className="p-3">{formatDate(booking.start_date)}</td>
                        <td className="p-3">{formatDate(booking.end_date)}</td>
                        <td className="p-3">{formatCurrency(booking.rate_amount)}</td>
                        <td className="p-3">
                          {formatCurrency(Number(booking.total_amount ?? booking.rate_amount))}
                        </td>
                        <td className="p-3">
                          {isPaid ? (
                            <StatusBadge status="paid" label="Paid" />
                          ) : (
                            <StatusBadge status={booking.status} label={BOOKING_STATUS_LABELS[booking.status]} />
                          )}
                        </td>
                      </tr>
                    );
                  }))
                }
              </tbody>
            </Table>
          </TableContainer>
        </>
      )}
    </div>
  );
}
