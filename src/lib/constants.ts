export const AU_STATES = ['NSW', 'VIC', 'QLD', 'WA', 'SA', 'TAS', 'ACT', 'NT'] as const;

export const MACHINE_STATUSES = [
  'available',
  'on_hire',
  'under_repair',
  'in_transit',
  'decommissioned',
] as const;

export const BOOKING_STATUSES = ['quote', 'confirmed', 'active', 'completed', 'cancelled'] as const;
export const RATE_TYPES = ['hourly', 'daily', 'weekly', 'monthly'] as const;

export const QUOTE_STATUSES = ['draft', 'sent', 'accepted', 'declined', 'expired', 'paid'] as const;
export const INVOICE_STATUSES = ['draft', 'sent', 'paid', 'overdue', 'cancelled'] as const;

export const DEAL_STATUSES = [
  'lead',
  'searching',
  'quoted',
  'confirmed',
  'active',
  'completed',
  'lost',
] as const;

export const MACHINE_CATEGORIES = [
  'Excavator',
  'Forklift',
  'Compressor',
  'Dozer',
  'Bobcat',
  'Loader',
  'Roller',
  'Crane',
  'Generator',
  'Truck',
  'Tipper',
  'Grader',
  'Telehandler',
  'Scissor Lift',
  'Boom Lift',
  'Light Tower',
  'Other',
] as const;

export const EXPENSE_CATEGORIES = [
  'Fuel',
  'Maintenance & Repairs',
  'Insurance',
  'Wages & Labour',
  'Office & Admin',
  'Equipment Purchase',
  'Transport & Freight',
  'Marketing',
  'Professional Services',
  'Rent & Utilities',
  'GST & Tax',
  'Other',
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const QUERY_STALE_TIME = {
  short: 30_000,
  medium: 2 * 60_000,
  long: 5 * 60_000,
};

export const STATUS_COLORS: Record<string, string> = {
  available: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  on_hire: 'bg-amber-100 text-amber-700 border-amber-200',
  under_repair: 'bg-red-100 text-red-700 border-red-200',
  in_transit: 'bg-blue-100 text-blue-700 border-blue-200',
  decommissioned: 'bg-slate-200 text-slate-700 border-slate-300',
  quote: 'bg-blue-100 text-blue-700 border-blue-200',
  confirmed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  active: 'bg-orange-100 text-orange-700 border-orange-200',
  completed: 'bg-slate-100 text-slate-700 border-slate-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
  draft: 'bg-slate-100 text-slate-700 border-slate-200',
  sent: 'bg-blue-100 text-blue-700 border-blue-200',
  paid: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  overdue: 'bg-red-100 text-red-700 border-red-200',
  accepted: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  declined: 'bg-red-100 text-red-700 border-red-200',
  expired: 'bg-amber-100 text-amber-700 border-amber-200',
  lead: 'bg-slate-100 text-slate-700 border-slate-200',
  searching: 'bg-blue-100 text-blue-700 border-blue-200',
  quoted: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  lost: 'bg-red-100 text-red-700 border-red-200',
};
