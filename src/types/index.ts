import type {
  AU_STATES,
  BOOKING_STATUSES,
  DEAL_STATUSES,
  EXPENSE_CATEGORIES,
  INVOICE_STATUSES,
  MACHINE_STATUSES,
  QUOTE_STATUSES,
  RATE_TYPES,
} from '../lib/constants';

export type UUID = string;
export type AUState = (typeof AU_STATES)[number] | string;

export type MachineStatus = (typeof MACHINE_STATUSES)[number];
export type BookingStatus = (typeof BOOKING_STATUSES)[number];
export type RateType = (typeof RATE_TYPES)[number];
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];
export type QuoteStatus = (typeof QUOTE_STATUSES)[number];
export type DealStatus = (typeof DEAL_STATUSES)[number];

export interface Company {
  id: UUID;
  name: string;
  abn: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: AUState;
  logo_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: UUID;
  company_id: UUID | null;
  full_name: string;
  phone: string | null;
  role: 'admin' | 'user' | 'viewer';
  is_platform_admin: boolean;
  is_active: boolean;
  created_at: string;
  company?: Company | null;
}

export interface MachineCategory {
  id: UUID;
  name: string;
  icon: string | null;
}

export interface MachineModelCatalogEntry {
  id: UUID;
  machine_type: string;
  make: string;
  model: string;
  display_name: string;
  image_url: string | null;
  source_url: string;
  created_at: string;
  updated_at: string;
}

export interface Machine {
  id: UUID;
  company_id: UUID;
  category_id: UUID | null;
  name: string;
  make: string | null;
  model: string | null;
  year: number | null;
  serial_number: string | null;
  registration: string | null;
  status: MachineStatus;
  hourly_rate: number | null;
  daily_rate: number | null;
  weekly_rate: number | null;
  monthly_rate: number | null;
  photo_urls: string[] | null;
  attachments_info: string | null;
  cross_hire_available: boolean;
  notes: string | null;
  location: string | null;
  created_at: string;
  updated_at: string;
  machine_categories?: MachineCategory | null;
  companies?: Company | null;
}

export interface Customer {
  id: UUID;
  company_id: UUID;
  name: string;
  abn: string | null;
  contact_name: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  state: AUState | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: UUID;
  company_id: UUID;
  machine_id: UUID;
  customer_id: UUID;
  quote_id: UUID | null;
  status: BookingStatus;
  start_date: string;
  end_date: string | null;
  rate_type: RateType | null;
  rate_amount: number;
  total_amount: number | null;
  delivery_address: string | null;
  notes: string | null;
  is_cross_hire: boolean;
  cross_hire_deal_id: UUID | null;
  created_by: UUID | null;
  created_at: string;
  updated_at: string;
  machines?: Machine;
  customers?: Customer;
}

export interface Invoice {
  id: UUID;
  company_id: UUID;
  booking_id: UUID | null;
  customer_id: UUID;
  invoice_number: string;
  subtotal: number;
  gst: number;
  total: number;
  status: InvoiceStatus;
  issue_date: string;
  due_date: string;
  paid_date: string | null;
  notes: string | null;
  pdf_url: string | null;
  share_token: string | null;
  sent_to: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
  customers?: Customer;
  bookings?: Booking | null;
}

export interface InvoiceItem {
  id: UUID;
  invoice_id: UUID;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  created_at: string;
}

export interface MaintenanceLog {
  id: UUID;
  machine_id: UUID;
  company_id: UUID;
  type: 'service' | 'repair' | 'inspection' | 'certification';
  description: string;
  date_performed: string;
  next_due_date: string | null;
  cost: number | null;
  performed_by: string | null;
  document_urls: string[] | null;
  created_at: string;
}

export interface CrossHireDeal {
  id: UUID;
  lead_client_name: string;
  lead_company_name: string | null;
  lead_contact_phone: string | null;
  lead_contact_email: string | null;
  machine_category_needed: string | null;
  machine_size_needed: string | null;
  location_needed: string | null;
  start_date_needed: string | null;
  end_date_needed: string | null;
  supplier_company_id: UUID | null;
  machine_id: UUID | null;
  client_rate: number | null;
  supplier_rate: number | null;
  margin: number | null;
  status: DealStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
  machines?: Machine | null;
  companies?: Company | null;
}

export interface Quote {
  id: UUID;
  company_id: UUID;
  customer_id: UUID;
  machine_id: UUID | null;
  quote_number: string;
  status: QuoteStatus;
  issue_date: string;
  expiry_date: string | null;
  subtotal: number;
  gst: number;
  total: number;
  notes: string | null;
  paid_date: string | null;
  share_token: string | null;
  sent_to: string | null;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
  customers?: Customer;
  machines?: Machine | null;
}

export interface QuoteItem {
  id: UUID;
  quote_id: UUID;
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  created_at: string;
}

export interface CompanySettings {
  id: UUID;
  company_id: UUID;
  allow_cross_hire: boolean;
  payment_terms_days: number;
  bank_bsb: string | null;
  bank_account_number: string | null;
  bank_account_name: string | null;
  default_invoice_notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface TeamInvite {
  id: UUID;
  company_id: UUID;
  email: string;
  role: 'admin' | 'user' | 'viewer';
  invited_by: UUID;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  invited_at: string;
  accepted_at: string | null;
}

export interface DashboardStats {
  totalMachines: number;
  onHire: number;
  available: number;
  underRepair: number;
  invoicedThisMonth: number;
  outstanding: number;
  paidThisMonth: number;
}

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export interface Expense {
  id: UUID;
  company_id: UUID;
  category: ExpenseCategory;
  description: string;
  amount: number;
  gst_amount: number;
  date: string;
  vendor: string | null;
  notes: string | null;
  receipt_url: string | null;
  created_by: UUID | null;
  created_at: string;
  updated_at: string;
}

export interface AccountingSummary {
  totalRevenue: number;
  totalGstCollected: number;
  totalExpenses: number;
  totalGstPaid: number;
  netProfit: number;
  netGstPayable: number;
  revenueByMonth: { month: string; revenue: number; expenses: number }[];
}

export type DocumentType = 'quote' | 'invoice';

export interface DocumentShareResponse {
  document_type: DocumentType;
  document_id: UUID;
  share_url: string;
  payment_url: string | null;
  to_email: string | null;
  email_sent: boolean;
}

export interface PublicDocumentPayload {
  document_type: DocumentType;
  share_url: string;
  payment_url: string | null;
  can_pay_online: boolean;
  stripe_publishable_key: string | null;
  company: Company | null;
  customer: Customer | null;
  document: Invoice | Quote;
  items: InvoiceItem[] | QuoteItem[];
}

export interface StripeConfigStatus {
  publishable_key: string | null;
  has_secret_key: boolean;
  has_webhook_secret: boolean;
  configured: boolean;
}
