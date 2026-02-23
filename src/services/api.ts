import { endOfMonth, startOfMonth } from 'date-fns';
import { supabase } from '../lib/supabase';
import type {
  AccountingSummary,
  Booking,
  BookingChargeItem,
  BookingChargeTemplate,
  BookingMachine,
  Company,
  CompanySettings,
  CrossHireDeal,
  Customer,
  DashboardStats,
  DocumentShareResponse,
  DocumentType,
  Expense,
  Invoice,
  InvoiceItem,
  Machine,
  MachineCategory,
  MaintenanceLog,
  Profile,
  PublicDocumentPayload,
  Quote,
  QuoteItem,
  QuoteStatus,
  StripeConfigStatus,
  MachineModelCatalogEntry,
  TeamInvite,
} from '../types';

const throwIfError = (error: { message: string } | null) => {
  if (error) {
    throw new Error(error.message);
  }
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const isProfilesIdForeignKeyError = (error: { message: string; code?: string } | null) =>
  Boolean(error?.code === '23503' && error.message.includes('profiles_id_fkey'));

const isUniqueViolation = (error: { message: string; code?: string } | null) =>
  error?.code === '23505';

const isMissingSchemaCacheColumn = (
  error: { message: string; code?: string } | null,
  table: string,
  column: string,
) =>
  Boolean(error?.message.includes(`Could not find the '${column}' column of '${table}' in the schema cache`));

const extractMissingSchemaCacheColumn = (error: { message: string; code?: string } | null) => {
  const message = String(error?.message ?? '');
  const match = message.match(/Could not find the '([^']+)' column of '([^']+)' in the schema cache/);
  if (!match) {
    return null;
  }
  return {
    column: match[1],
    table: match[2],
  };
};

const isMissingRelation = (error: { message: string; code?: string } | null, relation: string) => {
  const message = String(error?.message ?? '').toLowerCase();
  return message.includes(`relation "${relation.toLowerCase()}" does not exist`)
    || message.includes(`table "${relation.toLowerCase()}" does not exist`);
};

const isMissingSchemaCacheFunction = (error: { message: string; code?: string } | null, functionName: string) =>
  Boolean(error?.message.includes(`Could not find the function public.${functionName}`));

const isEdgeFunctionUnreachable = (error: { message: string; code?: string } | null) => {
  const message = String(error?.message ?? '').toLowerCase();
  return message.includes('failed to send a request to the edge function')
    || message.includes('failed to fetch')
    || message.includes('fetch failed')
    || message.includes('function not found');
};

const isEdgeFunctionNon2xx = (error: { message: string; code?: string } | null) =>
  String(error?.message ?? '').toLowerCase().includes('non-2xx status code');

const resolveEdgeFunctionError = async (error: unknown): Promise<string> => {
  const ctx = (error as { context?: Response })?.context;
  if (ctx && typeof ctx.json === 'function') {
    try {
      const body = await ctx.json();
      if (typeof body?.error === 'string') return body.error;
      if (typeof body?.message === 'string') return body.message;
    } catch { /* response already consumed or not JSON */ }
  }
  if (ctx && typeof ctx.text === 'function') {
    try {
      const text = await ctx.text();
      if (text) return text;
    } catch { /* ignore */ }
  }
  return (error as { message?: string })?.message ?? 'Edge function error';
};

const createShareToken = () =>
  `${crypto.randomUUID().replaceAll('-', '')}${crypto.randomUUID().replaceAll('-', '')}`;

const getAppBaseUrl = () => {
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin.replace(/\/$/, '');
  }
  return 'http://localhost:5173';
};

const normalizeRelation = <T>(value: T | T[] | null | undefined): T | null => {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
};

const normalizeBookingChargeTemplates = (value: unknown): BookingChargeTemplate[] => {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => ({
      description: String((item as { description?: unknown }).description ?? '').trim(),
      quantity: Number((item as { quantity?: unknown }).quantity ?? 1),
      unit_price: Number((item as { unit_price?: unknown }).unit_price ?? 0),
    }))
    .filter((item) => item.description.length > 0 && Number.isFinite(item.quantity) && Number.isFinite(item.unit_price));
};

const extractReceiptStoragePath = (value: string | null | undefined) => {
  const raw = String(value ?? '').trim();
  if (!raw) {
    return null;
  }

  if (!raw.startsWith('http://') && !raw.startsWith('https://')) {
    return raw;
  }

  const marker = '/receipts/';
  const markerIndex = raw.indexOf(marker);
  if (markerIndex < 0) {
    return null;
  }

  const pathWithQuery = raw.slice(markerIndex + marker.length);
  const path = pathWithQuery.split('?')[0];
  return decodeURIComponent(path);
};

const extractStoragePathFromPublicUrl = (value: string | null | undefined, bucket: string) => {
  const raw = String(value ?? '').trim();
  if (!raw) {
    return null;
  }

  if (!raw.startsWith('http://') && !raw.startsWith('https://')) {
    return raw;
  }

  const marker = `/storage/v1/object/public/${bucket}/`;
  const markerIndex = raw.indexOf(marker);
  if (markerIndex < 0) {
    return null;
  }

  const pathWithQuery = raw.slice(markerIndex + marker.length);
  const path = pathWithQuery.split('?')[0];
  return decodeURIComponent(path);
};

export async function uploadCompanyLogo(file: File, companyId: string) {
  if (!companyId) {
    throw new Error('Company not found');
  }
  const allowedMimeTypes = new Set(['image/png', 'image/jpeg', 'image/jpg']);
  if (!allowedMimeTypes.has(file.type)) {
    throw new Error('Logo must be a PNG or JPG image');
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Logo must be 5MB or smaller');
  }

  const extFromName = file.name.includes('.') ? file.name.split('.').pop() : null;
  const ext = String(extFromName ?? file.type.split('/')[1] ?? 'png')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase() || 'png';
  const path = `${companyId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('company-logos')
    .upload(path, file, { upsert: false, cacheControl: '3600' });
  throwIfError(uploadError);

  const { data } = supabase.storage.from('company-logos').getPublicUrl(path);
  return data.publicUrl;
}

export async function removeCompanyLogoObject(logoUrl: string | null | undefined) {
  const path = extractStoragePathFromPublicUrl(logoUrl, 'company-logos');
  if (!path) {
    return;
  }
  await supabase.storage.from('company-logos').remove([path]);
}

const DOCUMENT_ALLOWED_TYPES = new Set([
  'image/png', 'image/jpeg', 'image/jpg', 'image/webp',
  'application/pdf',
]);
const DOCUMENT_MAX_SIZE = 10 * 1024 * 1024;

export async function uploadDocument(file: File, bucket: string, folder: string) {
  if (!DOCUMENT_ALLOWED_TYPES.has(file.type)) {
    throw new Error('File must be an image (PNG/JPG/WebP) or PDF');
  }
  if (file.size > DOCUMENT_MAX_SIZE) {
    throw new Error('File must be 10 MB or smaller');
  }
  const extFromName = file.name.includes('.') ? file.name.split('.').pop() : null;
  const ext = String(extFromName ?? file.type.split('/')[1] ?? 'bin')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase() || 'bin';
  const path = `${folder}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, file, { upsert: false, cacheControl: '3600' });
  throwIfError(uploadError);

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function getMachineCategories() {
  const { data, error } = await supabase.from('machine_categories').select('*').order('name');
  throwIfError(error);
  return (data ?? []) as MachineCategory[];
}

export async function searchMachineModelCatalog(search: string, limit = 12) {
  const queryText = search.trim();
  if (queryText.length < 2) {
    return [] as MachineModelCatalogEntry[];
  }
  const safeQueryText = queryText.replace(/[%_,()]/g, ' ').trim();
  if (safeQueryText.length < 2) {
    return [] as MachineModelCatalogEntry[];
  }

  const query = supabase
    .from('machine_model_catalog')
    .select('*')
    .or(`display_name.ilike.%${safeQueryText}%,make.ilike.%${safeQueryText}%,model.ilike.%${safeQueryText}%`)
    .order('display_name')
    .limit(limit);

  const { data, error } = await query;
  throwIfError(error);
  return (data ?? []) as MachineModelCatalogEntry[];
}

export async function getMachines(filters?: {
  search?: string;
  categoryId?: string;
  status?: string;
}) {
  let query = supabase
    .from('machines')
    .select('*, machine_categories(*), companies(*)')
    .order('created_at', { ascending: false });

  if (filters?.search) {
    query = query.or(
      `name.ilike.%${filters.search}%,make.ilike.%${filters.search}%,model.ilike.%${filters.search}%`,
    );
  }
  if (filters?.categoryId) {
    query = query.eq('category_id', filters.categoryId);
  }
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  const { data, error } = await query;
  throwIfError(error);
  return (data ?? []) as Machine[];
}

export async function getMachineById(id: string) {
  const { data, error } = await supabase
    .from('machines')
    .select('*, machine_categories(*), companies(*)')
    .eq('id', id)
    .maybeSingle();
  throwIfError(error);
  return data as Machine | null;
}

export async function upsertMachine(payload: Partial<Machine>) {
  const machinePayload: Partial<Machine> & Record<string, unknown> = { ...payload };

  let data: unknown = null;
  let error: { message: string; code?: string } | null = null;
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const response = await supabase
      .from('machines')
      .upsert(machinePayload)
      .select('*')
      .single();
    data = response.data;
    error = response.error;
    if (!error) {
      break;
    }

    const missing = extractMissingSchemaCacheColumn(error);
    if (!missing || missing.table !== 'machines' || !Object.prototype.hasOwnProperty.call(machinePayload, missing.column)) {
      break;
    }
    delete machinePayload[missing.column];
  }

  throwIfError(error);
  return data as Machine;
}

export async function updateMachineStatus(id: string, status: string) {
  const { data, error } = await supabase
    .from('machines')
    .update({ status })
    .eq('id', id)
    .select('*')
    .single();
  throwIfError(error);
  return data as Machine;
}

export async function getMaintenanceByMachine(machineId: string) {
  const { data, error } = await supabase
    .from('maintenance_log')
    .select('*')
    .eq('machine_id', machineId)
    .order('date_performed', { ascending: false });
  throwIfError(error);
  return (data ?? []) as MaintenanceLog[];
}

export async function createMaintenance(payload: Partial<MaintenanceLog>) {
  const { data, error } = await supabase
    .from('maintenance_log')
    .insert(payload)
    .select('*')
    .single();
  throwIfError(error);
  return data as MaintenanceLog;
}

export async function getCustomers(search?: string) {
  let query = supabase.from('customers').select('*').order('name');
  if (search) {
    query = query.or(`name.ilike.%${search}%,contact_name.ilike.%${search}%,email.ilike.%${search}%`);
  }
  const { data, error } = await query;
  throwIfError(error);
  return (data ?? []) as Customer[];
}

export async function getCustomerById(id: string) {
  const { data, error } = await supabase.from('customers').select('*').eq('id', id).maybeSingle();
  throwIfError(error);
  return data as Customer | null;
}

export async function upsertCustomer(payload: Partial<Customer>) {
  const { data, error } = await supabase
    .from('customers')
    .upsert(payload)
    .select('*')
    .single();
  throwIfError(error);
  return data as Customer;
}

export async function getBookings(filters?: {
  status?: string;
  machineId?: string;
  dateFrom?: string;
  dateTo?: string;
  dateOn?: string;
  includeChargeItems?: boolean;
}) {
  const includeChargeItems = Boolean(filters?.includeChargeItems);
  let query = supabase
    .from('bookings')
    .select(
      includeChargeItems
        ? '*,machines(*,machine_categories(*)),customers(*),booking_charge_items(*),booking_machines(*,machines(*)),invoices(id,status)'
        : '*,machines(*,machine_categories(*)),customers(*),booking_machines(*,machines(*)),invoices(id,status)',
    )
    .order('start_date', { ascending: true }) as ReturnType<typeof supabase.from>;

  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.machineId) {
    query = query.eq('machine_id', filters.machineId);
  }
  if (filters?.dateFrom) {
    query = query.gte('start_date', filters.dateFrom);
  }
  if (filters?.dateTo) {
    query = query.lte('start_date', filters.dateTo);
  }
  if (filters?.dateOn) {
    query = query
      .lte('start_date', filters.dateOn)
      .or(`end_date.gte.${filters.dateOn},end_date.is.null`);
  }

  const { data, error } = await query;
  throwIfError(error);
  return (data ?? []) as unknown as Booking[];
}

export async function getBookingById(id: string) {
  const { data, error } = await supabase
    .from('bookings')
    .select('*, machines(*, machine_categories(*)), customers(*), booking_charge_items(*), booking_machines(*, machines(*))')
    .eq('id', id)
    .maybeSingle();
  throwIfError(error);
  return data as (Booking & { booking_charge_items?: BookingChargeItem[]; booking_machines?: BookingMachine[] }) | null;
}

export async function upsertBooking(
  payload: Partial<Booking>,
  chargeItems: Array<Pick<BookingChargeItem, 'description' | 'quantity' | 'unit_price'>> = [],
  bookingMachines: Array<Pick<BookingMachine, 'machine_id' | 'machine_order' | 'rate_type' | 'rate_amount'>> = [],
) {
  const bookingPayload: Partial<Booking> & Record<string, unknown> = { ...payload };

  let data: unknown = null;
  let error: { message: string; code?: string } | null = null;
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const response = await supabase
      .from('bookings')
      .upsert(bookingPayload)
      .select('*')
      .single();

    data = response.data;
    error = response.error;
    if (!error) {
      break;
    }

    const missing = extractMissingSchemaCacheColumn(error);
    if (!missing || missing.table !== 'bookings' || !Object.prototype.hasOwnProperty.call(bookingPayload, missing.column)) {
      break;
    }

    delete bookingPayload[missing.column];
  }
  throwIfError(error);

  const { error: deleteError } = await supabase
    .from('booking_charge_items')
    .delete()
    .eq('booking_id', (data as Booking).id);
  if (deleteError && !isMissingRelation(deleteError, 'booking_charge_items')) {
    throwIfError(deleteError);
  }

  if (chargeItems.length) {
    const { error: insertItemsError } = await supabase
      .from('booking_charge_items')
      .insert(
        chargeItems.map((item) => ({
          booking_id: (data as Booking).id,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
        })),
      );
    if (insertItemsError && !isMissingRelation(insertItemsError, 'booking_charge_items')) {
      throwIfError(insertItemsError);
    }
  }

  if (bookingMachines.length) {
    const { error: deleteMachinesError } = await supabase
      .from('booking_machines')
      .delete()
      .eq('booking_id', (data as Booking).id);
    if (deleteMachinesError && !isMissingRelation(deleteMachinesError, 'booking_machines')) {
      throwIfError(deleteMachinesError);
    }

    const { error: insertMachinesError } = await supabase
      .from('booking_machines')
      .insert(
        bookingMachines.map((bm) => ({
          booking_id: (data as Booking).id,
          machine_id: bm.machine_id,
          machine_order: bm.machine_order,
          rate_type: bm.rate_type,
          rate_amount: bm.rate_amount,
        })),
      );
    if (insertMachinesError && !isMissingRelation(insertMachinesError, 'booking_machines')) {
      throwIfError(insertMachinesError);
    }
  }

  return data as Booking;
}

export async function updateBookingAndMachineStatus(bookingId: string, bookingStatus: string, machineStatus: string) {
  const { error } = await supabase.rpc('set_booking_and_machine_status', {
    p_booking_id: bookingId,
    p_booking_status: bookingStatus,
    p_machine_status: machineStatus,
  });
  if (!error) {
    return;
  }

  if (!isMissingSchemaCacheFunction(error, 'set_booking_and_machine_status')) {
    throwIfError(error);
    return;
  }

  const { data: bookingRow, error: bookingError } = await supabase
    .from('bookings')
    .update({ status: bookingStatus })
    .eq('id', bookingId)
    .select('id, machine_id')
    .maybeSingle();
  throwIfError(bookingError);

  if (!bookingRow) {
    throw new Error('Booking not found');
  }

  // Update all machines from booking_machines (multi-machine support).
  const { data: bmRows } = await supabase
    .from('booking_machines')
    .select('machine_id')
    .eq('booking_id', bookingId);

  const machineIdsToUpdate = new Set<string>();
  (bmRows ?? []).forEach((bm: { machine_id: string }) => machineIdsToUpdate.add(bm.machine_id));

  // Also include primary machine_id for backward compat.
  const primaryMachineId = (bookingRow as { machine_id: string | null }).machine_id;
  if (primaryMachineId) machineIdsToUpdate.add(primaryMachineId);

  if (machineIdsToUpdate.size === 0) {
    throw new Error('Booking has no machines');
  }

  const { error: machineError } = await supabase
    .from('machines')
    .update({ status: machineStatus })
    .in('id', Array.from(machineIdsToUpdate));
  throwIfError(machineError);
}

export async function createInvoiceFromBooking(bookingId: string) {
  const { data, error } = await supabase.rpc('create_invoice_from_booking', { p_booking_id: bookingId });
  throwIfError(error);
  const invoiceId = data as string;

  // Safety net for environments where an older DB function definition is still active:
  // ensure any booking-stage payment (deposit/upfront) is reflected on the invoice.
  try {
    const [{ data: booking }, { data: invoice }] = await Promise.all([
      supabase
        .from('bookings')
        .select('payment_plan, deposit_paid_amount, paid_in_full_date')
        .eq('id', bookingId)
        .maybeSingle(),
      supabase
        .from('invoices')
        .select('paid_amount, total')
        .eq('id', invoiceId)
        .maybeSingle(),
    ]);

    if (booking && invoice) {
      const invoiceTotal = Number((invoice as { total?: number }).total ?? 0);
      const invoicePaid = Number((invoice as { paid_amount?: number }).paid_amount ?? 0);
      const bookingRow = booking as {
        payment_plan?: string | null;
        deposit_paid_amount?: number | null;
        paid_in_full_date?: string | null;
      };

      const expectedPriorPaid =
        bookingRow.payment_plan === 'upfront' && bookingRow.paid_in_full_date
          ? invoiceTotal
          : bookingRow.payment_plan === 'deposit'
            ? Math.min(Number(bookingRow.deposit_paid_amount ?? 0), invoiceTotal)
            : 0;

      const missingCredit = Number((expectedPriorPaid - invoicePaid).toFixed(2));
      if (missingCredit > 0.009) {
        await recordInvoicePayment(
          invoiceId,
          missingCredit,
          'cash',
          bookingRow.payment_plan === 'upfront'
            ? 'Paid in full at booking (upfront)'
            : 'Deposit received at booking',
        );
      }
    }
  } catch {
    // Non-blocking: invoice creation already succeeded.
  }

  return invoiceId;
}

export async function markBookingDepositPaid(bookingId: string, amount?: number) {
  const { data, error } = await supabase.rpc('mark_booking_deposit_paid', {
    p_booking_id: bookingId,
    p_amount: typeof amount === 'number' ? amount : null,
  });
  if (!error) {
    return data as Booking;
  }

  if (!isMissingSchemaCacheFunction(error, 'mark_booking_deposit_paid')) {
    throwIfError(error);
  }

  const { data: current, error: currentError } = await supabase
    .from('bookings')
    .select('id, deposit_amount, deposit_paid_amount, deposit_paid_date')
    .eq('id', bookingId)
    .maybeSingle();
  throwIfError(currentError);
  if (!current) {
    throw new Error('Booking not found');
  }

  const nextAmount = Math.max(
    Number(amount ?? current.deposit_amount ?? 0),
    Number(current.deposit_paid_amount ?? 0),
  );

  const { data: updated, error: updateError } = await supabase
    .from('bookings')
    .update({
      deposit_paid_amount: nextAmount,
      deposit_paid_date: nextAmount > 0 ? new Date().toISOString().split('T')[0] : current.deposit_paid_date,
    })
    .eq('id', bookingId)
    .select('*')
    .single();
  throwIfError(updateError);
  return updated as Booking;
}

export async function markBookingPaidInFull(bookingId: string) {
  const { data, error } = await supabase.rpc('mark_booking_paid_in_full', {
    p_booking_id: bookingId,
  });
  if (!error) {
    return data as Booking;
  }

  if (!isMissingSchemaCacheFunction(error, 'mark_booking_paid_in_full')) {
    throwIfError(error);
  }

  const { data: updated, error: updateError } = await supabase
    .from('bookings')
    .update({
      paid_in_full_date: new Date().toISOString().split('T')[0],
    })
    .eq('id', bookingId)
    .select('*')
    .single();
  throwIfError(updateError);
  return updated as Booking;
}

export interface MachineLocationPoint {
  machine_id: string;
  machine_name: string;
  machine_status: string;
  machine_base_location: string | null;
  latitude: number | null;
  longitude: number | null;
  source: 'job' | 'base' | 'unknown';
  booking_id: string | null;
  booking_status: string | null;
  customer_name: string | null;
  delivery_address: string | null;
}

export async function getMachineLocationsByDate(dateOn: string) {
  const [machines, bookings] = await Promise.all([
    getMachines(),
    getBookings({ dateOn }),
  ]);

  // Fetch booking_machines for bookings that are active on this date.
  const bookingIds = bookings.map((b) => b.id);
  const bmByBookingId = new Map<string, string[]>();
  if (bookingIds.length > 0) {
    const { data: bmRows } = await supabase
      .from('booking_machines')
      .select('booking_id, machine_id')
      .in('booking_id', bookingIds);
    (bmRows ?? []).forEach((bm: { booking_id: string; machine_id: string }) => {
      const existing = bmByBookingId.get(bm.booking_id) ?? [];
      existing.push(bm.machine_id);
      bmByBookingId.set(bm.booking_id, existing);
    });
  }

  const bookingByMachine = new Map<string, Booking>();
  bookings
    .filter((booking) => booking.status === 'confirmed' || booking.status === 'completed')
    .sort((a, b) => b.start_date.localeCompare(a.start_date))
    .forEach((booking) => {
      // Register all machines from booking_machines.
      const machineIds = bmByBookingId.get(booking.id) ?? [];
      machineIds.forEach((mid) => {
        if (!bookingByMachine.has(mid)) bookingByMachine.set(mid, booking);
      });
      // Also register primary machine_id for backward compat.
      if (booking.machine_id && !bookingByMachine.has(booking.machine_id)) {
        bookingByMachine.set(booking.machine_id, booking);
      }
    });

  return machines.map((machine) => {
    const booking = bookingByMachine.get(machine.id) ?? null;
    const hasJobCoords = booking?.delivery_lat != null && booking?.delivery_lng != null;
    const hasBaseCoords = machine.location_lat != null && machine.location_lng != null;

    return {
      machine_id: machine.id,
      machine_name: machine.name,
      machine_status: machine.status,
      machine_base_location: machine.location ?? null,
      latitude: hasJobCoords
        ? Number(booking?.delivery_lat ?? null)
        : hasBaseCoords
          ? Number(machine.location_lat ?? null)
          : null,
      longitude: hasJobCoords
        ? Number(booking?.delivery_lng ?? null)
        : hasBaseCoords
          ? Number(machine.location_lng ?? null)
          : null,
      source: hasJobCoords ? 'job' : hasBaseCoords ? 'base' : 'unknown',
      booking_id: booking?.id ?? null,
      booking_status: booking?.status ?? null,
      customer_name: booking?.customers?.name ?? null,
      delivery_address: booking?.delivery_address ?? null,
    } satisfies MachineLocationPoint;
  });
}

export async function getInvoices(status?: string) {
  let query = supabase
    .from('invoices')
    .select('*, customers(*), bookings(*)')
    .order('issue_date', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  throwIfError(error);
  return (data ?? []) as Invoice[];
}

export async function getInvoicesByBookingId(bookingId: string) {
  const { data, error } = await supabase
    .from('invoices')
    .select('*')
    .eq('booking_id', bookingId)
    .order('issue_date', { ascending: false });
  throwIfError(error);
  return (data ?? []) as Invoice[];
}

export async function getInvoiceById(id: string) {
  const { data, error } = await supabase
    .from('invoices')
    .select('*, customers(*), bookings(*), invoice_items(*)')
    .eq('id', id)
    .maybeSingle();
  throwIfError(error);
  return data as (Invoice & { invoice_items: InvoiceItem[] }) | null;
}

export async function getQuoteById(id: string) {
  const { data, error } = await supabase
    .from('quotes')
    .select('*, customers(*), machines(*), quote_items(*)')
    .eq('id', id)
    .maybeSingle();
  throwIfError(error);
  return data as (Quote & { quote_items: QuoteItem[] }) | null;
}

export async function upsertInvoice(
  payload: Partial<Invoice>,
  items: Array<Pick<InvoiceItem, 'description' | 'quantity' | 'unit_price'>>,
) {
  const { data, error } = await supabase.from('invoices').upsert(payload).select('*').single();
  throwIfError(error);

  const { error: deleteError } = await supabase.from('invoice_items').delete().eq('invoice_id', data.id);
  throwIfError(deleteError);

  if (items.length) {
    const { error: itemError } = await supabase
      .from('invoice_items')
      .insert(items.map((item) => ({ ...item, invoice_id: data.id })));
    throwIfError(itemError);
  }

  return data as Invoice;
}

export async function updateInvoiceStatus(id: string, status: string) {
  const payload: Record<string, unknown> = { status };
  if (status === 'paid') {
    payload.paid_date = new Date().toISOString().split('T')[0];
    // When marking fully paid, also set paid_amount = total so outstanding shows $0
    const { data: current } = await supabase.from('invoices').select('total').eq('id', id).maybeSingle();
    if (current) {
      payload.paid_amount = Number(current.total);
    }
  }
  const { data, error } = await supabase.from('invoices').update(payload).eq('id', id).select('*').single();
  throwIfError(error);
  return data as Invoice;
}

export async function recordInvoicePayment(
  invoiceId: string,
  amount: number,
  method?: string,
  notes?: string,
) {
  const { data, error } = await supabase.rpc('record_invoice_payment', {
    p_invoice_id: invoiceId,
    p_amount: amount,
    p_method: method ?? 'cash',
    p_notes: notes ?? null,
  });
  if (!error) {
    return data as Invoice;
  }

  if (!isMissingSchemaCacheFunction(error, 'record_invoice_payment')) {
    throwIfError(error);
  }

  // Fallback: direct table update when RPC function is not yet in schema cache.
  const { data: current, error: currentError } = await supabase
    .from('invoices')
    .select('*')
    .eq('id', invoiceId)
    .maybeSingle();
  throwIfError(currentError);
  if (!current) throw new Error('Invoice not found');

  const newPaid = Math.min((Number(current.paid_amount) || 0) + amount, Number(current.total));
  const isNowPaid = newPaid >= Number(current.total);
  const isPartial = newPaid > 0 && !isNowPaid;
  let nextStatus = current.status;
  if (isNowPaid) {
    nextStatus = 'paid';
  } else if (isPartial) {
    nextStatus = 'partially_paid';
  } else if (current.status === 'draft') {
    nextStatus = 'sent';
  }
  const { data: updated, error: updateError } = await supabase
    .from('invoices')
    .update({
      paid_amount: newPaid,
      status: nextStatus,
      paid_date: isNowPaid ? (current.paid_date ?? new Date().toISOString().split('T')[0]) : current.paid_date,
    })
    .eq('id', invoiceId)
    .select('*')
    .single();
  throwIfError(updateError);

  // Also insert into invoice_payments so history is tracked even in fallback mode.
  await supabase
    .from('invoice_payments')
    .insert({
      invoice_id: invoiceId,
      company_id: (current as { company_id: string }).company_id,
      amount,
      payment_method: method ?? 'cash',
      notes: notes ?? null,
    });
  // Intentionally ignore insert error — invoice update already succeeded.

  return updated as Invoice;
}

export async function getQuotes(status?: string) {
  let query = supabase
    .from('quotes')
    .select('*, customers(*), machines(*), bookings(id, status, booking_number)')
    .order('created_at', { ascending: false });
  if (status) {
    query = query.eq('status', status);
  }
  const { data, error } = await query;
  throwIfError(error);
  return (data ?? []) as (Quote & { bookings?: { id: string; status: string; booking_number: string | null }[] })[];
}

export async function upsertQuote(
  payload: Partial<Quote>,
  items: Array<Pick<QuoteItem, 'description' | 'quantity' | 'unit_price'>>,
) {
  const { data, error } = await supabase.from('quotes').upsert(payload).select('*').single();
  throwIfError(error);

  const { error: deleteError } = await supabase.from('quote_items').delete().eq('quote_id', data.id);
  throwIfError(deleteError);

  if (items.length) {
    const { error: itemError } = await supabase
      .from('quote_items')
      .insert(items.map((item) => ({ ...item, quote_id: data.id })));
    throwIfError(itemError);
  }

  return data as Quote;
}

export async function updateQuoteStatus(quoteId: string, status: QuoteStatus): Promise<void> {
  const { error } = await supabase.from('quotes').update({ status }).eq('id', quoteId);
  throwIfError(error);
}

export async function convertQuoteToBooking(quoteId: string) {
  const { data, error } = await supabase.rpc('convert_quote_to_booking', { p_quote_id: quoteId });
  throwIfError(error);
  return data as string;
}

async function buildDocumentShareResponseFallback(
  documentType: DocumentType,
  documentId: string,
  recipientEmail: string | null,
  sendEmail: boolean,
) {
  const table = documentType === 'invoice' ? 'invoices' : 'quotes';

  const { data, error } = await supabase
    .from(table)
    .select('id, status, total, paid_amount, share_token, sent_to, customers(email)')
    .eq('id', documentId)
    .maybeSingle();
  throwIfError(error);

  const documentRow = data as {
    id: string;
    status: string | null;
    total: number | null;
    paid_amount: number | null;
    share_token: string | null;
    sent_to: string | null;
    customers: { email?: string } | { email?: string }[] | null;
  } | null;

  if (!documentRow) {
    throw new Error('Document not found or access denied');
  }

  const customer = normalizeRelation<{ email?: string }>(documentRow.customers);
  const toEmail = String(recipientEmail ?? customer?.email ?? '').trim().toLowerCase() || null;
  if (sendEmail && !toEmail) {
    throw new Error('No recipient email found for this customer');
  }

  const shareToken = documentRow.share_token ?? createShareToken();
  let nextStatus = documentRow.status === 'draft' ? 'sent' : documentRow.status;
  if (
    documentType === 'invoice' &&
    nextStatus === 'sent' &&
    Number(documentRow.paid_amount ?? 0) > 0 &&
    Number(documentRow.paid_amount ?? 0) < Number(documentRow.total ?? 0)
  ) {
    nextStatus = 'partially_paid';
  }
  const { error: updateError } = await supabase
    .from(table)
    .update({
      share_token: shareToken,
      sent_to: toEmail ?? documentRow.sent_to ?? null,
      sent_at: new Date().toISOString(),
      status: nextStatus,
    })
    .eq('id', documentId);
  throwIfError(updateError);

  const shareUrl = `${getAppBaseUrl()}/public/${documentType}/${shareToken}`;
  const hasPositiveBalance = Number(documentRow.total ?? 0) > 0;
  const payableStatuses = documentType === 'quote'
    ? ['draft', 'sent', 'accepted']
    : ['draft', 'sent', 'overdue', 'partially_paid'];
  const paymentUrl = hasPositiveBalance && payableStatuses.includes(String(documentRow.status ?? ''))
    ? `${shareUrl}?pay=1`
    : null;

  return {
    document_type: documentType,
    document_id: documentId,
    share_url: shareUrl,
    payment_url: paymentUrl,
    to_email: toEmail,
    email_sent: false,
  } as DocumentShareResponse;
}

export async function createDocumentShareLink(
  documentType: DocumentType,
  documentId: string,
) {
  const { data, error } = await supabase.functions.invoke('send-document-email', {
    body: {
      document_type: documentType,
      document_id: documentId,
      send_email: false,
    },
  });
  if (error) {
    if (isEdgeFunctionUnreachable(error) || isEdgeFunctionNon2xx(error)) {
      return buildDocumentShareResponseFallback(documentType, documentId, null, false);
    }
    throwIfError(error);
  }
  return data as DocumentShareResponse;
}

export async function sendDocumentEmail(
  documentType: DocumentType,
  documentId: string,
  recipientEmail?: string,
) {
  const { data, error } = await supabase.functions.invoke('send-document-email', {
    body: {
      document_type: documentType,
      document_id: documentId,
      recipient_email: recipientEmail ?? null,
      send_email: true,
    },
  });
  if (error) {
    if (isEdgeFunctionUnreachable(error)) {
      return buildDocumentShareResponseFallback(documentType, documentId, recipientEmail ?? null, true);
    }
    if (isEdgeFunctionNon2xx(error)) {
      const msg = await resolveEdgeFunctionError(error);
      throw new Error(msg);
    }
    throwIfError(error);
  }
  return data as DocumentShareResponse;
}

export async function sendPaymentReminder(invoiceId: string): Promise<{ invoice_id: string; to_email: string; email_sent: boolean }> {
  const { data, error } = await supabase.functions.invoke('send-payment-reminder', {
    body: { invoice_id: invoiceId },
  });
  if (error) {
    if (isEdgeFunctionNon2xx(error)) {
      const msg = await resolveEdgeFunctionError(error);
      throw new Error(msg);
    }
    throwIfError(error);
  }
  return data as { invoice_id: string; to_email: string; email_sent: boolean };
}

export async function getInvoicePayments(invoiceId: string) {
  const { data, error } = await supabase
    .from('invoice_payments')
    .select('*')
    .eq('invoice_id', invoiceId)
    .order('created_at', { ascending: true });
  throwIfError(error);
  return (data ?? []) as import('../types').InvoicePayment[];
}

export async function sendPaymentReceipt(paymentId: string): Promise<{ payment_id: string; to_email: string; email_sent: boolean }> {
  const { data, error } = await supabase.functions.invoke('send-payment-receipt', {
    body: { payment_id: paymentId },
  });
  if (error) {
    if (isEdgeFunctionNon2xx(error)) {
      const msg = await resolveEdgeFunctionError(error);
      throw new Error(msg);
    }
    throwIfError(error);
  }
  return data as { payment_id: string; to_email: string; email_sent: boolean };
}

export async function getPublicDocument(documentType: DocumentType, token: string) {
  const { data, error } = await supabase.functions.invoke('get-public-document', {
    body: {
      document_type: documentType,
      token,
    },
  });
  if (error) {
    if (isEdgeFunctionUnreachable(error) || isEdgeFunctionNon2xx(error)) {
      return getPublicDocumentFallback(documentType, token);
    }
    throwIfError(error);
  }
  return data as PublicDocumentPayload;
}

async function getPublicDocumentFallback(documentType: DocumentType, token: string): Promise<PublicDocumentPayload> {
  const table = documentType === 'invoice' ? 'invoices' : 'quotes';
  const itemsTable = documentType === 'invoice' ? 'invoice_items' : 'quote_items';
  const itemFK = documentType === 'invoice' ? 'invoice_id' : 'quote_id';

  const { data: doc, error: docErr } = await supabase
    .from(table)
    .select('*')
    .eq('share_token', token)
    .maybeSingle();

  if (docErr || !doc) {
    throw new Error('Document not found');
  }

  const [companyRes, customerRes, itemsRes, settingsRes] = await Promise.all([
    supabase.from('companies').select('*').eq('id', doc.company_id).maybeSingle(),
    supabase.from('customers').select('*').eq('id', doc.customer_id).maybeSingle(),
    supabase.from(itemsTable).select('*').eq(itemFK, doc.id).order('created_at', { ascending: true }),
    supabase.from('company_settings').select('bank_name, bank_bsb, bank_account_number, bank_account_name').eq('company_id', doc.company_id).maybeSingle(),
  ]);

  const shareUrl = `${getAppBaseUrl()}/public/${documentType}/${token}`;

  return {
    document_type: documentType,
    share_url: shareUrl,
    payment_url: null,
    can_pay_online: false,
    stripe_publishable_key: null,
    company: (companyRes.data as Company) ?? null,
    customer: (customerRes.data as Customer) ?? null,
    document: doc as Invoice | Quote,
    items: (itemsRes.data ?? []) as InvoiceItem[] | QuoteItem[],
    bank_details: settingsRes?.data ?? null,
  };
}

export async function getStripeConfigStatus() {
  const { data, error } = await supabase.functions.invoke('get-stripe-config');
  if (error) {
    if (isEdgeFunctionNon2xx(error)) {
      const msg = await resolveEdgeFunctionError(error);
      throw new Error(msg);
    }
    throwIfError(error);
  }
  return data as StripeConfigStatus;
}

export async function saveStripeConfig(payload: {
  publishable_key: string;
  secret_key?: string;
  webhook_secret?: string;
}) {
  const { data, error } = await supabase.functions.invoke('set-stripe-config', {
    body: payload,
  });
  if (error) {
    if (isEdgeFunctionNon2xx(error)) {
      const msg = await resolveEdgeFunctionError(error);
      throw new Error(msg);
    }
    throwIfError(error);
  }
  return data as StripeConfigStatus;
}

export async function getCompanySettings() {
  const companyId = await getCurrentCompanyId();
  if (!companyId) {
    return null;
  }
  const { data, error } = await supabase
    .from('company_settings')
    .select('*')
    .eq('company_id', companyId)
    .maybeSingle();
  throwIfError(error);
  if (!data) {
    return null;
  }
  return {
    ...(data as CompanySettings),
    default_booking_charges: normalizeBookingChargeTemplates(
      (data as { default_booking_charges?: unknown }).default_booking_charges,
    ),
  } as CompanySettings;
}

export async function upsertCompanySettings(payload: Partial<CompanySettings>) {
  const normalizedPayload = {
    ...payload,
    ...(payload.default_booking_charges
      ? { default_booking_charges: normalizeBookingChargeTemplates(payload.default_booking_charges) }
      : {}),
  };
  const { data, error } = await supabase
    .from('company_settings')
    .upsert(normalizedPayload, { onConflict: 'company_id' })
    .select('*')
    .single();
  if (error) {
    if (
      isMissingSchemaCacheColumn(error, 'company_settings', 'default_booking_charges')
      && Object.prototype.hasOwnProperty.call(normalizedPayload, 'default_booking_charges')
    ) {
      const fallbackPayload = { ...normalizedPayload } as Partial<CompanySettings> & {
        default_booking_charges?: BookingChargeTemplate[];
      };
      delete fallbackPayload.default_booking_charges;

      const retry = await supabase
        .from('company_settings')
        .upsert(fallbackPayload, { onConflict: 'company_id' })
        .select('*')
        .single();
      throwIfError(retry.error);
      return {
        ...(retry.data as CompanySettings),
        default_booking_charges: normalizeBookingChargeTemplates(
          (retry.data as { default_booking_charges?: unknown }).default_booking_charges,
        ),
      } as CompanySettings;
    }
    throwIfError(error);
  }
  return {
    ...(data as CompanySettings),
    default_booking_charges: normalizeBookingChargeTemplates(
      (data as { default_booking_charges?: unknown }).default_booking_charges,
    ),
  } as CompanySettings;
}

export async function getProfiles() {
  const { data, error } = await supabase.from('profiles').select('*').order('full_name');
  throwIfError(error);
  return (data ?? []) as Profile[];
}

export async function upsertProfile(payload: Partial<Profile>) {
  const { data, error } = await supabase.from('profiles').upsert(payload).select('*').single();
  throwIfError(error);
  return data as Profile;
}

export async function getTeamInvites() {
  const { data, error } = await supabase.from('team_invites').select('*').order('invited_at', { ascending: false });
  throwIfError(error);
  return (data ?? []) as TeamInvite[];
}

export async function inviteTeamMember(payload: { email: string; role: string }) {
  const { data, error } = await supabase.functions.invoke('invite-team-member', { body: payload });
  throwIfError(error);
  return data;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const [machines, invoices] = await Promise.all([
    getMachines(),
    getInvoices(),
  ]);

  const monthStart = startOfMonth(new Date());
  const monthEnd = endOfMonth(new Date());

  const invoicedThisMonth = invoices
    .filter((invoice) => {
      const issued = new Date(invoice.issue_date);
      return issued >= monthStart && issued <= monthEnd;
    })
    .reduce((sum, invoice) => sum + Number(invoice.total), 0);

  const paidThisMonth = invoices
    .filter((invoice) => {
      if (!invoice.paid_date) {
        return false;
      }
      const paid = new Date(invoice.paid_date);
      return paid >= monthStart && paid <= monthEnd;
    })
    .reduce((sum, invoice) => sum + Number(invoice.total), 0);

  const outstanding = invoices
    .filter((invoice) => ['sent', 'overdue', 'partially_paid'].includes(invoice.status))
    .reduce((sum, invoice) => sum + Math.max(Number(invoice.total) - Number(invoice.paid_amount ?? 0), 0), 0);

  return {
    totalMachines: machines.length,
    onHire: machines.filter((machine) => machine.status === 'on_hire').length,
    available: machines.filter((machine) => machine.status === 'available').length,
    underRepair: machines.filter((machine) => machine.status === 'under_repair').length,
    invoicedThisMonth,
    outstanding,
    paidThisMonth,
  };
}

export async function getAdminStats() {
  const [companies, machines, deals] = await Promise.all([
    supabase.from('companies').select('*'),
    supabase.from('machines').select('*'),
    supabase.from('cross_hire_deals').select('*'),
  ]);

  throwIfError(companies.error);
  throwIfError(machines.error);
  throwIfError(deals.error);

  const dealRows = (deals.data ?? []) as CrossHireDeal[];
  const activeDeals = dealRows.filter((deal) => ['confirmed', 'active'].includes(deal.status));

  const thisMonthDeals = dealRows.filter((deal) => {
    const createdAt = new Date(deal.created_at);
    const monthStart = startOfMonth(new Date());
    const monthEnd = endOfMonth(new Date());
    return createdAt >= monthStart && createdAt <= monthEnd;
  });

  const revenue = thisMonthDeals.reduce((sum, deal) => sum + Number(deal.client_rate ?? 0), 0);
  const margin = thisMonthDeals.reduce((sum, deal) => sum + Number(deal.margin ?? 0), 0);

  return {
    totalCompanies: (companies.data ?? []).length,
    totalMachines: (machines.data ?? []).length,
    totalAvailableMachines: ((machines.data ?? []) as Machine[]).filter((machine) => machine.status === 'available').length,
    activeCrossHireDeals: activeDeals.length,
    crossHireRevenueThisMonth: revenue,
    crossHireMarginThisMonth: margin,
  };
}

export async function searchAvailableMachines(filters: {
  categoryId?: string;
  location?: string;
  companyId?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}) {
  const { data, error } = await supabase.rpc('search_available_machines', {
    p_category_id: filters.categoryId ?? null,
    p_location: filters.location ?? null,
    p_company_id: filters.companyId ?? null,
    p_search: filters.search ?? null,
    p_start_date: filters.startDate ?? null,
    p_end_date: filters.endDate ?? null,
  });
  throwIfError(error);

  const machines = (data ?? []) as Machine[];
  const companyIds = [...new Set(machines.map((m) => m.company_id))];
  if (!companyIds.length) {
    return machines;
  }

  const { data: companyData, error: companyError } = await supabase
    .from('companies')
    .select('*')
    .in('id', companyIds);
  throwIfError(companyError);

  const companyMap = new Map((companyData ?? []).map((company: Company) => [company.id, company]));
  return machines.map((machine) => ({ ...machine, companies: companyMap.get(machine.company_id) ?? null }));
}

export async function getCrossHireDeals() {
  const { data, error } = await supabase
    .from('cross_hire_deals')
    .select('*, machines(*), companies(*)')
    .order('created_at', { ascending: false });
  throwIfError(error);
  return (data ?? []) as CrossHireDeal[];
}

export async function upsertCrossHireDeal(payload: Partial<CrossHireDeal>) {
  const { data, error } = await supabase
    .from('cross_hire_deals')
    .upsert(payload)
    .select('*')
    .single();
  throwIfError(error);
  return data as CrossHireDeal;
}

export async function getAllCompaniesWithStats() {
  const { data: companies, error } = await supabase.from('companies').select('*').order('name');
  throwIfError(error);

  const { data: machines, error: machineError } = await supabase.from('machines').select('*');
  throwIfError(machineError);

  const machineRows = (machines ?? []) as Machine[];

  return ((companies ?? []) as Company[]).map((company) => {
    const scoped = machineRows.filter((machine) => machine.company_id === company.id);
    const available = scoped.filter((machine) => machine.status === 'available').length;
    const onHire = scoped.filter((machine) => machine.status === 'on_hire').length;

    return {
      ...company,
      totalMachines: scoped.length,
      availableMachines: available,
      utilisation: scoped.length ? (onHire / scoped.length) * 100 : 0,
    };
  });
}

export async function getCurrentCompanyId() {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) {
    return null;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', userId)
    .maybeSingle();
  throwIfError(error);
  return (data?.company_id as string | null) ?? null;
}

export async function createSignup(payload: {
  company: Partial<Company>;
  user: { full_name: string; email: string; password: string; phone?: string | null };
}) {
  const signUpResponse = await supabase.auth.signUp({
    email: payload.user.email,
    password: payload.user.password,
    options: {
      data: {
        full_name: payload.user.full_name,
      },
    },
  });

  throwIfError(signUpResponse.error);

  const user = signUpResponse.data.user;
  const userId = user?.id;
  if (!userId) {
    throw new Error('Failed to create auth user');
  }

  if (Array.isArray(user?.identities) && user.identities.length === 0) {
    throw new Error('This email is already registered. Please log in instead.');
  }

  const companyId = crypto.randomUUID();
  const { error: companyError } = await supabase
    .from('companies')
    .insert({ ...payload.company, id: companyId });
  throwIfError(companyError);

  let profileInsertError: { message: string; code?: string } | null = null;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const { error } = await supabase.from('profiles').insert({
      id: userId,
      company_id: companyId,
      full_name: payload.user.full_name,
      phone: payload.user.phone ?? null,
      role: 'admin',
    });
    if (!error) {
      profileInsertError = null;
      break;
    }

    profileInsertError = error;
    if (isUniqueViolation(error)) {
      // Profile already exists — this email was partially registered before.
      // Clean up the orphaned company row we just created.
      await supabase.from('companies').delete().eq('id', companyId);
      throw new Error('This email is already registered. Please log in instead.');
    }
    if (attempt < 3 && isProfilesIdForeignKeyError(error)) {
      await sleep(250 * attempt);
      continue;
    }
    break;
  }
  throwIfError(profileInsertError);

  return signUpResponse.data;
}

// Called after Google OAuth when the user has no profile yet.
export async function createOAuthUserSetup(userId: string, fullName: string) {
  const companyId = crypto.randomUUID();
  const companyName = fullName ? `${fullName}'s Business` : 'My Business';

  const { error: companyError } = await supabase
    .from('companies')
    .insert({ id: companyId, name: companyName, state: 'NSW' });
  throwIfError(companyError);

  const { error: profileError } = await supabase.from('profiles').insert({
    id: userId,
    company_id: companyId,
    full_name: fullName,
    role: 'admin',
  });
  throwIfError(profileError);
}

export async function generateDocumentNumber(prefix: 'INV' | 'QUO' | 'BOK') {
  const companyId = await getCurrentCompanyId();
  if (!companyId) {
    throw new Error('Company not found for current user');
  }
  const { data, error } = await supabase.rpc('generate_document_number', {
    p_company_id: companyId,
    p_prefix: prefix,
  });
  throwIfError(error);
  return data as string;
}

// ─── Accounting / Expenses ───────────────────────────────────────────────────

export async function getExpenses(filters?: {
  category?: string;
  dateFrom?: string;
  dateTo?: string;
  bookingId?: string;
}) {
  let query = supabase
    .from('expenses')
    .select('*')
    .order('date', { ascending: false });

  if (filters?.category) query = query.eq('category', filters.category);
  if (filters?.dateFrom) query = query.gte('date', filters.dateFrom);
  if (filters?.dateTo) query = query.lte('date', filters.dateTo);
  if (filters?.bookingId) query = query.eq('booking_id', filters.bookingId);

  const { data, error } = await query;
  throwIfError(error);

  const rows = (data ?? []) as Expense[];
  const withSignedReceiptUrls = await Promise.all(
    rows.map(async (expense) => {
      const receiptPath = extractReceiptStoragePath(expense.receipt_url);
      if (!receiptPath) {
        return expense;
      }

      const { data: signedData, error: signedError } = await supabase
        .storage
        .from('receipts')
        .createSignedUrl(receiptPath, 60 * 60);

      if (signedError || !signedData?.signedUrl) {
        return { ...expense, receipt_url: null };
      }

      return { ...expense, receipt_url: signedData.signedUrl };
    }),
  );

  return withSignedReceiptUrls;
}

export async function upsertExpense(payload: Partial<Expense>) {
  const { data, error } = await supabase
    .from('expenses')
    .upsert(payload)
    .select()
    .single();
  throwIfError(error);
  return data as Expense;
}

export async function deleteExpense(id: string) {
  const { error } = await supabase.from('expenses').delete().eq('id', id);
  throwIfError(error);
}

export async function getAttentionItems() {
  const today = new Date().toISOString().split('T')[0];
  const soon = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  // Flag jobs that have been in 'pending' state for more than 24 hours
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [overdueResult, expiringResult, pendingJobsResult, overdueReturnsResult] = await Promise.all([
    supabase
      .from('invoices')
      .select('id, invoice_number, total, due_date, customers(name)')
      .in('status', ['sent', 'overdue', 'partially_paid'])
      .lte('due_date', today)
      .order('due_date', { ascending: true })
      .limit(5),
    supabase
      .from('quotes')
      .select('id, quote_number, total, expiry_date, customers(name)')
      .eq('status', 'sent')
      .lte('expiry_date', soon)
      .order('expiry_date', { ascending: true })
      .limit(5),
    supabase
      .from('bookings')
      .select('id, total_amount, created_at, machines(name), customers(name)')
      .eq('status', 'quote')
      .lte('created_at', yesterday)
      .order('created_at', { ascending: true })
      .limit(5),
    supabase
      .from('bookings')
      .select('id, booking_number, end_date, machines(name), customers(name)')
      .eq('status', 'confirmed')
      .lt('end_date', today)
      .order('end_date', { ascending: true })
      .limit(5),
  ]);

  return {
    overdueInvoices: (overdueResult.data ?? []) as unknown as Array<{
      id: string; invoice_number: string; total: number; due_date: string;
      customers: { name: string } | null;
    }>,
    expiringQuotes: (expiringResult.data ?? []) as unknown as Array<{
      id: string; quote_number: string; total: number; expiry_date: string;
      customers: { name: string } | null;
    }>,
    pendingJobs: (pendingJobsResult.data ?? []) as unknown as Array<{
      id: string; total_amount: number | null; created_at: string;
      machines: { name: string } | null;
      customers: { name: string } | null;
    }>,
    overdueReturns: (overdueReturnsResult.data ?? []) as unknown as Array<{
      id: string; booking_number: string | null; end_date: string;
      machines: { name: string } | null;
      customers: { name: string } | null;
    }>,
  };
}

// ─── Machine Profitability ───────────────────────────────────────────────────

export interface MachineProfitabilityRow {
  machine_id: string;
  machine_name: string;
  make: string | null;
  model: string | null;
  job_count: number;
  total_days: number;
  total_revenue: number;
  avg_daily_revenue: number;
}

export async function getMachineExpenses(dateFrom: string, dateTo: string): Promise<Map<string, number>> {
  const companyId = await getCurrentCompanyId();
  const { data, error } = await supabase
    .from('expenses')
    .select('machine_id, amount')
    .eq('company_id', companyId)
    .not('machine_id', 'is', null)
    .gte('date', dateFrom)
    .lte('date', dateTo);
  throwIfError(error);
  const map = new Map<string, number>();
  for (const row of (data ?? []) as Array<{ machine_id: string; amount: number }>) {
    if (row.machine_id) {
      map.set(row.machine_id, (map.get(row.machine_id) ?? 0) + Number(row.amount));
    }
  }
  return map;
}

export async function getMachineProfitability(
  dateFrom: string,
  dateTo: string,
): Promise<MachineProfitabilityRow[]> {
  // Query via booking_machines to support multi-machine bookings.
  // Revenue per machine = bm.rate_amount × booking_days.
  const { data, error } = await supabase
    .from('booking_machines')
    .select('machine_id, rate_amount, machines(id, name, make, model), bookings!inner(id, status, start_date, end_date, total_amount, hire_subtotal)')
    .in('bookings.status', ['confirmed', 'completed'])
    .gte('bookings.start_date', dateFrom)
    .lte('bookings.start_date', dateTo);
  throwIfError(error);

  const machineMap = new Map<string, MachineProfitabilityRow>();
  for (const row of (data ?? []) as unknown as Array<{
    machine_id: string;
    rate_amount: number;
    machines: { id: string; name: string; make: string | null; model: string | null } | null;
    bookings: { id: string; start_date: string; end_date: string | null } | null;
  }>) {
    const machine = Array.isArray(row.machines) ? row.machines[0] : row.machines;
    const booking = Array.isArray(row.bookings) ? row.bookings[0] : row.bookings;
    if (!machine || !booking) continue;
    const start = new Date(booking.start_date);
    const end = booking.end_date ? new Date(booking.end_date) : start;
    const days = Math.max(Math.ceil((end.getTime() - start.getTime()) / 86400000) + 1, 1);
    const revenue = Number(row.rate_amount) * days;
    const existing = machineMap.get(row.machine_id);
    if (existing) {
      existing.job_count += 1;
      existing.total_days += days;
      existing.total_revenue += revenue;
    } else {
      machineMap.set(row.machine_id, {
        machine_id: row.machine_id,
        machine_name: machine.name,
        make: machine.make,
        model: machine.model,
        job_count: 1,
        total_days: days,
        total_revenue: revenue,
        avg_daily_revenue: 0,
      });
    }
  }
  return Array.from(machineMap.values())
    .map((m) => ({ ...m, avg_daily_revenue: m.total_days > 0 ? m.total_revenue / m.total_days : 0 }))
    .sort((a, b) => b.total_revenue - a.total_revenue);
}

// ─── Invoice PDF Download ─────────────────────────────────────────────────────

export async function downloadInvoicePdf(invoiceId: string, invoiceNumber: string) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Not authenticated');

  const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? '';
  const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined) ?? '';

  const response = await fetch(`${supabaseUrl}/functions/v1/generate-invoice-pdf`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'apikey': anonKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ invoice_id: invoiceId }),
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({ error: 'PDF generation failed' }));
    throw new Error((errBody as { error?: string }).error ?? 'PDF generation failed');
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${invoiceNumber}.pdf`;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export async function getAccountingSummary(dateFrom: string, dateTo: string): Promise<AccountingSummary> {
  // Fetch paid invoices in period
  const { data: invoices, error: invErr } = await supabase
    .from('invoices')
    .select('subtotal, gst, total, paid_date, issue_date')
    .eq('status', 'paid')
    .gte('paid_date', dateFrom)
    .lte('paid_date', dateTo);
  throwIfError(invErr);

  // Fetch expenses in period
  const { data: expenses, error: expErr } = await supabase
    .from('expenses')
    .select('amount, gst_amount, date')
    .gte('date', dateFrom)
    .lte('date', dateTo);
  throwIfError(expErr);

  const totalRevenue = (invoices ?? []).reduce((s, i) => s + (i.subtotal ?? 0), 0);
  const totalGstCollected = (invoices ?? []).reduce((s, i) => s + (i.gst ?? 0), 0);
  const totalExpenses = (expenses ?? []).reduce((s, e) => s + (e.amount ?? 0), 0);
  const totalGstPaid = (expenses ?? []).reduce((s, e) => s + (e.gst_amount ?? 0), 0);

  // Group by month (last 6 months)
  const monthMap: Record<string, { revenue: number; expenses: number }> = {};
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthMap[key] = { revenue: 0, expenses: 0 };
  }

  (invoices ?? []).forEach((inv) => {
    const key = (inv.paid_date ?? inv.issue_date ?? '').slice(0, 7);
    if (monthMap[key]) monthMap[key].revenue += inv.subtotal ?? 0;
  });

  (expenses ?? []).forEach((exp) => {
    const key = (exp.date ?? '').slice(0, 7);
    if (monthMap[key]) monthMap[key].expenses += exp.amount ?? 0;
  });

  const revenueByMonth = Object.entries(monthMap).map(([month, vals]) => ({
    month,
    ...vals,
  }));

  return {
    totalRevenue,
    totalGstCollected,
    totalExpenses,
    totalGstPaid,
    netProfit: totalRevenue - totalExpenses,
    netGstPayable: totalGstCollected - totalGstPaid,
    revenueByMonth,
  };
}
