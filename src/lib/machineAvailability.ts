interface BookingDateRangeLike {
  machine_id: string;
  start_date: string;
  end_date: string | null;
  status: string;
  booking_machines?: Array<{ machine_id: string }>;
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
  const conflicted = new Set<string>();

  for (const booking of bookings) {
    if (!allowedStatuses.has(booking.status)) continue;

    const normalizedBookingRange = normalizeDateRange(booking.start_date, booking.end_date);
    if (!normalizedBookingRange) continue;

    const overlaps = normalizedRange.start <= normalizedBookingRange.end
      && normalizedRange.end >= normalizedBookingRange.start;
    if (!overlaps) continue;

    // Collect all machine IDs: primary + booking_machines junction rows.
    if (booking.machine_id) conflicted.add(booking.machine_id);
    for (const bm of booking.booking_machines ?? []) {
      conflicted.add(bm.machine_id);
    }
  }

  return conflicted;
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
