interface BookingDateRangeLike {
  machine_id: string;
  start_date: string;
  end_date: string | null;
  status: string;
}

interface MachineAvailabilityLike {
  id: string;
  status: string;
}

const NON_BOOKABLE_MACHINE_STATUSES = new Set([
  'under_repair',
  'in_transit',
  'decommissioned',
]);

const normalizeDateRange = (
  startDate: string | null | undefined,
  endDate: string | null | undefined,
) => {
  const start = String(startDate ?? '').trim();
  if (!start) {
    return null;
  }
  const end = String(endDate ?? start).trim() || start;
  return {
    start,
    end: end < start ? start : end,
  };
};

export const isMachineBookable = (machine: MachineAvailabilityLike) =>
  !NON_BOOKABLE_MACHINE_STATUSES.has(machine.status);

export const getConflictedMachineIds = (
  bookings: BookingDateRangeLike[],
  rangeStart: string | null | undefined,
  rangeEnd: string | null | undefined,
  statuses: string[] = ['confirmed'],
) => {
  const normalizedRange = normalizeDateRange(rangeStart, rangeEnd);
  if (!normalizedRange) {
    return new Set<string>();
  }

  const allowedStatuses = new Set(statuses);
  return new Set(
    bookings
      .filter((booking) => allowedStatuses.has(booking.status))
      .filter((booking) => {
        const normalizedBookingRange = normalizeDateRange(booking.start_date, booking.end_date);
        if (!normalizedBookingRange) {
          return false;
        }

        // Date ranges overlap when each starts before the other ends.
        return normalizedRange.start <= normalizedBookingRange.end
          && normalizedRange.end >= normalizedBookingRange.start;
      })
      .map((booking) => booking.machine_id),
  );
};

export const getEffectiveMachineStatus = (
  machine: MachineAvailabilityLike,
  conflictedMachineIds: Set<string>,
) => {
  if (!isMachineBookable(machine)) {
    return machine.status;
  }
  return conflictedMachineIds.has(machine.id) ? 'on_hire' : 'available';
};
