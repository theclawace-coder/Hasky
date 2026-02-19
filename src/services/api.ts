import { endOfMonth, startOfMonth } from 'date-fns';
import { supabase } from '../lib/supabase';
import type {
  AccountingSummary,
  Booking,
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
  const { data, error } = await supabase
    .from('machines')
    .upsert(payload)
    .select('*')
    .single();
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
}) {
  let query = supabase
    .from('bookings')
    .select('*, machines(*,machine_categories(*)), customers(*)')
    .order('start_date', { ascending: true });

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

  const { data, error } = await query;
  throwIfError(error);
  return (data ?? []) as Booking[];
}

export async function getBookingById(id: string) {
  const { data, error } = await supabase
    .from('bookings')
    .select('*, machines(*, machine_categories(*)), customers(*)')
    .eq('id', id)
    .maybeSingle();
  throwIfError(error);
  return data as Booking | null;
}

export async function upsertBooking(payload: Partial<Booking>) {
  const { data, error } = await supabase
    .from('bookings')
    .upsert(payload)
    .select('*')
    .single();
  throwIfError(error);
  return data as Booking;
}

export async function updateBookingAndMachineStatus(bookingId: string, bookingStatus: string, machineStatus: string) {
  const booking = await getBookingById(bookingId);
  if (!booking) {
    throw new Error('Booking not found');
  }

  const { error: bookingError } = await supabase
    .from('bookings')
    .update({ status: bookingStatus })
    .eq('id', bookingId);
  throwIfError(bookingError);

  const { error: machineError } = await supabase
    .from('machines')
    .update({ status: machineStatus })
    .eq('id', booking.machine_id);
  throwIfError(machineError);
}

export async function createInvoiceFromBooking(bookingId: string) {
  const { data, error } = await supabase.rpc('create_invoice_from_booking', { p_booking_id: bookingId });
  throwIfError(error);
  return data as string;
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

  if (items.length) {
    await supabase.from('invoice_items').delete().eq('invoice_id', data.id);
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
  }
  const { data, error } = await supabase.from('invoices').update(payload).eq('id', id).select('*').single();
  throwIfError(error);
  return data as Invoice;
}

export async function getQuotes(status?: string) {
  let query = supabase.from('quotes').select('*, customers(*), machines(*)').order('created_at', { ascending: false });
  if (status) {
    query = query.eq('status', status);
  }
  const { data, error } = await query;
  throwIfError(error);
  return (data ?? []) as Quote[];
}

export async function upsertQuote(
  payload: Partial<Quote>,
  items: Array<Pick<QuoteItem, 'description' | 'quantity' | 'unit_price'>>,
) {
  const { data, error } = await supabase.from('quotes').upsert(payload).select('*').single();
  throwIfError(error);

  if (items.length) {
    await supabase.from('quote_items').delete().eq('quote_id', data.id);
    const { error: itemError } = await supabase
      .from('quote_items')
      .insert(items.map((item) => ({ ...item, quote_id: data.id })));
    throwIfError(itemError);
  }

  return data as Quote;
}

export async function convertQuoteToBooking(quoteId: string) {
  const { data, error } = await supabase.rpc('convert_quote_to_booking', { p_quote_id: quoteId });
  throwIfError(error);
  return data as string;
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
  throwIfError(error);
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
  throwIfError(error);
  return data as DocumentShareResponse;
}

export async function getPublicDocument(documentType: DocumentType, token: string) {
  const { data, error } = await supabase.functions.invoke('get-public-document', {
    body: {
      document_type: documentType,
      token,
    },
  });
  throwIfError(error);
  return data as PublicDocumentPayload;
}

export async function getStripeConfigStatus() {
  const { data, error } = await supabase.functions.invoke('get-stripe-config');
  throwIfError(error);
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
  throwIfError(error);
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
  return data as CompanySettings | null;
}

export async function upsertCompanySettings(payload: Partial<CompanySettings>) {
  const { data, error } = await supabase
    .from('company_settings')
    .upsert(payload)
    .select('*')
    .single();
  throwIfError(error);
  return data as CompanySettings;
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
    .filter((invoice) => ['sent', 'overdue'].includes(invoice.status))
    .reduce((sum, invoice) => sum + Number(invoice.total), 0);

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

export async function generateDocumentNumber(prefix: 'INV' | 'QUO') {
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
}) {
  let query = supabase
    .from('expenses')
    .select('*')
    .order('date', { ascending: false });

  if (filters?.category) query = query.eq('category', filters.category);
  if (filters?.dateFrom) query = query.gte('date', filters.dateFrom);
  if (filters?.dateTo) query = query.lte('date', filters.dateTo);

  const { data, error } = await query;
  throwIfError(error);
  return (data ?? []) as Expense[];
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

  const [overdueResult, expiringResult] = await Promise.all([
    supabase
      .from('invoices')
      .select('id, invoice_number, total, due_date, customers(name)')
      .in('status', ['sent', 'overdue'])
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
  };
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
