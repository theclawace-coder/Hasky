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
        {days.map((day) => {
          const dayBookings = bookings.filter((item) =>
            isWithinInterval(day, {
              start: new Date(item.start_date),
              end: new Date(item.end_date ?? item.start_date),
            }),
          );
          return (
            <div key={day.toISOString()} className="rounded-lg border border-slate-200 bg-white p-3">
              <p className="text-sm font-semibold text-slate-900">{format(day, 'EEE dd MMM')}</p>
              {dayBookings.length === 0 ? (
                <p className="mt-1 text-xs text-slate-500">No bookings</p>
              ) : (
                <div className="mt-2 space-y-2">
                  {dayBookings.map((booking) => {
                    const bookingMachines = ((booking as Booking & { booking_machines?: BookingMachine[] }).booking_machines ?? [])
                      .map((bm) => machineNameById.get(bm.machine_id))
                      .filter((name): name is string => Boolean(name));
                    const machineNames = bookingMachines.length
                      ? bookingMachines.join(', ')
                      : booking.machines?.name ?? '—';
                    return (
                      <button
                        key={booking.id}
                        type="button"
                        className="w-full rounded-md border border-blue-100 bg-blue-50 p-2 text-left"
                        onClick={() => onBookingClick(booking)}
                      >
                        <p className="text-xs font-semibold text-slate-800">{booking.customers?.name ?? '—'}</p>
                        <p className="mt-0.5 break-words text-[11px] text-slate-600">{machineNames}</p>
                        <div className="mt-1">
                          <StatusBadge status={booking.status} />
                        </div>
                      </button>
                    );
                  })}
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
