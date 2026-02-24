import {
  addDays,
  eachDayOfInterval,
  endOfMonth,
  format,
  isWithinInterval,
  startOfMonth,
  startOfWeek,
} from 'date-fns';
import { StatusBadge } from '../ui/StatusBadge';
import type { Booking, BookingMachine, Machine } from '../../types';

interface BookingCalendarProps {
  mode: 'week' | 'month';
  anchorDate: Date;
  machines: Machine[];
  bookings: Booking[];
  onCellClick: (machine: Machine, date: Date) => void;
  onBookingClick: (booking: Booking) => void;
}

export function BookingCalendar({
  mode,
  anchorDate,
  machines,
  bookings,
  onCellClick,
  onBookingClick,
}: BookingCalendarProps) {
  const start =
    mode === 'month'
      ? startOfMonth(anchorDate)
      : startOfWeek(anchorDate, { weekStartsOn: 1 });
  const end = mode === 'month' ? endOfMonth(anchorDate) : addDays(start, 6);
  const days = eachDayOfInterval({ start, end });
  const machineNameById = new Map(machines.map((machine) => [machine.id, machine.name]));

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="space-y-3 p-3 md:hidden">
        {machines.map((machine) => {
          const machineBookings = bookings
            .filter((item) => {
              const bmIds = ((item as Booking & { booking_machines?: BookingMachine[] }).booking_machines ?? [])
                .map((bm) => bm.machine_id);
              const spansMachine = item.machine_id === machine.id || bmIds.includes(machine.id);
              if (!spansMachine) return false;
              return days.some((day) =>
                isWithinInterval(day, {
                  start: new Date(item.start_date),
                  end: new Date(item.end_date ?? item.start_date),
                }),
              );
            })
            .filter((b, i, arr) => arr.findIndex((x) => x.id === b.id) === i);

          return (
            <div key={machine.id} className="rounded-lg border border-slate-200 bg-white">
              <div
                className="flex items-center justify-between border-b border-slate-100 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{machine.name}</p>
                  {machine.machine_categories?.name && (
                    <p className="text-[11px] text-slate-500">{machine.machine_categories.name}</p>
                  )}
                </div>
                {machineBookings.length > 0 && (
                  <span className="ml-2 shrink-0 rounded-full bg-violet-100 px-2 py-0.5 text-[11px] font-medium text-violet-700">
                    {machineBookings.length}
                  </span>
                )}
              </div>

              {machineBookings.length === 0 ? (
                <button
                  type="button"
                  className="w-full px-3 py-3 text-left"
                  onClick={() => onCellClick(machine, days[0])}
                >
                  <p className="text-xs text-slate-400">No bookings this period</p>
                </button>
              ) : (
                <div className="divide-y divide-slate-100">
                  {machineBookings.map((booking) => (
                    <button
                      key={booking.id}
                      type="button"
                      className="flex w-full items-start gap-2 px-3 py-2.5 text-left transition active:bg-slate-50"
                      onClick={() => onBookingClick(booking)}
                    >
                      <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-blue-400" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-xs font-semibold text-slate-800">
                            {booking.customers?.name ?? '—'}
                          </p>
                          <StatusBadge status={booking.status} />
                        </div>
                        <p className="mt-0.5 text-[11px] text-slate-500">
                          {format(new Date(booking.start_date), 'd MMM')}
                          {booking.end_date && booking.end_date !== booking.start_date
                            ? ` – ${format(new Date(booking.end_date), 'd MMM')}`
                            : ''}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[900px] border-collapse text-sm">
          <thead>
            <tr className="bg-slate-50">
              <th className="p-3 text-left font-semibold text-slate-700">Machine</th>
              {days.map((day) => (
                <th key={day.toISOString()} className="p-3 text-left font-semibold text-slate-700">
                  {format(day, mode === 'month' ? 'dd EEE' : 'EEE dd')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {machines.map((machine) => (
              <tr key={machine.id} className="border-t border-slate-100">
                <td className="p-3 align-top">
                  <p className="font-medium text-slate-900">{machine.name}</p>
                  <p className="text-xs text-slate-500">{machine.machine_categories?.name}</p>
                </td>
                {days.map((day) => {
                  const bookingsOnDay = bookings.filter((item) => {
                    const bmIds = ((item as Booking & { booking_machines?: BookingMachine[] }).booking_machines ?? [])
                      .map((bm) => bm.machine_id);
                    const spansMachine = item.machine_id === machine.id || bmIds.includes(machine.id);
                    return spansMachine && isWithinInterval(day, {
                      start: new Date(item.start_date),
                      end: new Date(item.end_date ?? item.start_date),
                    });
                  });
                  const booking = bookingsOnDay[0];

                  return (
                    <td
                      key={day.toISOString()}
                      className="cursor-pointer border-l border-slate-100 p-2 align-top"
                      onClick={() => (booking ? onBookingClick(booking) : onCellClick(machine, day))}
                    >
                      {booking ? (
                        <div className="rounded-md bg-blue-50 p-2">
                          <p className="text-xs font-semibold text-slate-800">{booking.customers?.name}</p>
                          <StatusBadge status={booking.status} />
                          {bookingsOnDay.length > 1 ? (
                            <p className="mt-1 text-[11px] text-slate-600">
                              +{bookingsOnDay.length - 1} more booking(s)
                            </p>
                          ) : null}
                        </div>
                      ) : (
                        <div
                          className={`rounded-md border border-dashed border-slate-200 bg-slate-50/40 ${
                            mode === 'month' ? 'h-12' : 'h-16'
                          }`}
                        />
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
