const MACHINE_STATUS_ALIASES: Record<string, string> = {
  available: 'available',
  on_hire: 'on_hire',
  onhire: 'on_hire',
  under_repair: 'under_repair',
  underrepair: 'under_repair',
  in_transit: 'in_transit',
  intransit: 'in_transit',
  decommissioned: 'decommissioned',
  retired: 'decommissioned',
};

const normalizeStatusKey = (value: unknown) =>
  String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

export const normalizeMachineStatus = (status: unknown): string => {
  const key = normalizeStatusKey(status);
  if (!key) {
    return '';
  }
  return MACHINE_STATUS_ALIASES[key] ?? key;
};

export const getMachineStatusFilterValues = (status: string): string[] => {
  const normalized = normalizeMachineStatus(status);
  if (!normalized) {
    return [];
  }

  const values = new Set<string>([status, normalized]);
  switch (normalized) {
    case 'on_hire':
      values.add('on hire');
      values.add('on-hire');
      values.add('On Hire');
      break;
    case 'under_repair':
      values.add('under repair');
      values.add('under-repair');
      values.add('Under Repair');
      break;
    case 'in_transit':
      values.add('in transit');
      values.add('in-transit');
      values.add('In Transit');
      break;
    case 'decommissioned':
      values.add('retired');
      values.add('Retired');
      break;
    default:
      break;
  }
  return [...values];
};
