import { describe, expect, it } from 'vitest';
import { getConflictedMachineIds, getEffectiveMachineStatus, isMachineBookable } from './machineAvailability';

describe('machineAvailability', () => {
  it('detects overlap against confirmed bookings only', () => {
    const bookings = [
      { machine_id: 'm-1', status: 'confirmed', start_date: '2026-03-10', end_date: '2026-03-15' },
      { machine_id: 'm-2', status: 'quote', start_date: '2026-03-10', end_date: '2026-03-15' },
    ];

    const conflicts = getConflictedMachineIds(bookings, '2026-03-12', '2026-03-12', ['confirmed']);

    expect(conflicts.has('m-1')).toBe(true);
    expect(conflicts.has('m-2')).toBe(false);
  });

  it('treats non-overlapping ranges as available', () => {
    const bookings = [
      { machine_id: 'm-1', status: 'confirmed', start_date: '2026-03-10', end_date: '2026-03-12' },
    ];

    const conflicts = getConflictedMachineIds(bookings, '2026-03-13', '2026-03-14', ['confirmed']);
    expect(conflicts.size).toBe(0);
  });

  it('keeps hard blocked statuses as non-bookable', () => {
    expect(isMachineBookable({ id: 'm-1', status: 'available' })).toBe(true);
    expect(isMachineBookable({ id: 'm-2', status: 'under_repair' })).toBe(false);
  });

  it('maps bookable machine to on_hire only when conflicted', () => {
    const conflicts = new Set<string>(['m-1']);

    expect(getEffectiveMachineStatus({ id: 'm-1', status: 'on_hire' }, conflicts)).toBe('on_hire');
    expect(getEffectiveMachineStatus({ id: 'm-2', status: 'on_hire' }, conflicts)).toBe('available');
    expect(getEffectiveMachineStatus({ id: 'm-3', status: 'under_repair' }, conflicts)).toBe('under_repair');
  });
});
