import type { GuideStep } from '../guide/guideSteps';
import {
  DASHBOARD_TOUR,
  FLEET_TOUR,
  JOBS_TOUR,
  QUOTES_TOUR,
  INVOICES_TOUR,
  CUSTOMERS_TOUR,
  ACCOUNTING_TOUR,
  SETTINGS_TOUR,
  PAYMENTS_TOUR,
} from '../guide/pageGuides';

export interface AccordionItem {
  id: string;
  question: string;
  answer: string;
}

export interface WikiArticle {
  id: string;
  emoji: string;
  label: string;
  title: string;
  description: string;
  capabilities: string[];
  steps: AccordionItem[];
  tips: string[];
  showTourCTA: boolean;
  tourSteps?: GuideStep[];
  tourPath?: string;
}

export const WIKI_ARTICLES: WikiArticle[] = [
  {
    id: 'getting-started',
    emoji: '🚀',
    label: 'Getting Started',
    title: 'Getting Started with HireHub',
    description: 'Everything you need to know to get your hire business running from day one.',
    capabilities: [
      'Manage your entire fleet from a single, real-time dashboard',
      'Create bookings end-to-end in a guided 4-step wizard',
      'Send professional quotes and invoices to customers',
      'Track payments (partial or full) and run P&L reports',
      'Invite team members with role-based access',
    ],
    steps: [
      {
        id: 'gs-0',
        question: 'Add your first machine',
        answer:
          'Go to Fleet in the sidebar and click "Add Machine". Enter the machine name, category, make, model, and daily rate. You can also set hourly, weekly, and monthly rates. Once saved, your machine appears on the dashboard and is immediately bookable.',
      },
      {
        id: 'gs-1',
        question: 'Create your first customer',
        answer:
          'Go to Customers and click "Add Customer". Fill in the company name, contact name, phone, and email. You can also use the quick-add button (person+ icon) in the top bar from anywhere in the app.',
      },
      {
        id: 'gs-2',
        question: 'Create a booking (job)',
        answer:
          'Go to Jobs and click "New Job". The 4-step wizard walks you through: (1) picking a machine, (2) selecting a customer, (3) setting dates and rates, and (4) reviewing and confirming. The job starts as a Quote until you confirm it.',
      },
      {
        id: 'gs-3',
        question: 'Generate and send an invoice',
        answer:
          'Open any booking and click "Generate Invoice". The invoice is pre-filled with the booking details. Click "Mark as Sent" then "Send Email" to deliver it to your customer. They receive a link to view the invoice online.',
      },
      {
        id: 'gs-4',
        question: 'Record a payment',
        answer:
          'Open an invoice that has been sent. Click "Record Payment", enter the amount received, and confirm. The invoice automatically transitions to Paid once the full balance is covered. Partial payments are tracked with a running balance.',
      },
    ],
    tips: [
      'Use the "Needs Attention" panel on your dashboard every morning — it surfaces overdue invoices, expiring quotes, and machines due back.',
      'Click the ? button in the top bar anytime to re-launch the interactive tour.',
    ],
    showTourCTA: true,
    tourSteps: DASHBOARD_TOUR,
    tourPath: '/dashboard',
  },

  {
    id: 'fleet',
    emoji: '📦',
    label: 'Fleet',
    title: 'Fleet Management',
    description: 'Track, maintain, and monitor every machine in your hire fleet.',
    capabilities: [
      'Add machines with photos, category, make, model, and serial number',
      'Set hourly, daily, weekend, weekly, and monthly hire rates',
      'Track machine status in real-time: Available, On Hire, Under Repair, In Transit, Retired',
      'Log a full maintenance history — services, repairs, inspections, certifications',
      'Mark machines as available for cross-hire to other companies',
    ],
    steps: [
      {
        id: 'fl-0',
        question: 'Add a machine to your fleet',
        answer:
          'Go to Fleet → click "Add Machine". Fill in the name, category, make, model, year, serial number, registration, and location. Add notes for things like weight limits or special requirements. Click Save to add it to your fleet.',
      },
      {
        id: 'fl-1',
        question: 'Set hire rates',
        answer:
          'In the machine form, scroll to the Rates section. You can set an Hourly rate, Daily rate, Weekend rate, Weekly rate, and Monthly rate. These rates auto-fill when you create a booking for this machine. Leave any rate blank if you don\'t offer that billing period.',
      },
      {
        id: 'fl-2',
        question: 'Change machine status',
        answer:
          'Open the machine detail page and use the Status dropdown at the top to change it. Available (green) means it can be booked. On Hire (blue) is set automatically when a job goes active. Under Repair (orange) blocks the machine from being booked. Retired (grey) removes it from active availability.',
      },
      {
        id: 'fl-3',
        question: 'Log a maintenance record',
        answer:
          'Open the machine detail page and click "Add Maintenance Record". Select the type (Service, Repair, Inspection, or Certification), enter the description, date performed, next due date, cost, and who performed it. Records appear in a history table on the machine page.',
      },
      {
        id: 'fl-4',
        question: 'View booking history for a machine',
        answer:
          'On the machine detail page, scroll down to the Booking History section. You\'ll see every job this machine has been on, with links to view the full booking detail.',
      },
    ],
    tips: [
      'Toggle between Grid view and Table view on the Fleet list using the icons in the top-right corner of the page.',
      'Use the Status filter and search bar to quickly find machines by name or status when you have a large fleet.',
    ],
    showTourCTA: false,
    tourSteps: FLEET_TOUR,
    tourPath: '/fleet',
  },

  {
    id: 'jobs',
    emoji: '🏗️',
    label: 'Jobs & Bookings',
    title: 'Jobs & Bookings',
    description: 'Manage every hire from initial quote through to completed job — all in one place.',
    capabilities: [
      'Create bookings via a guided 4-step wizard with date conflict detection',
      'View all jobs on a colour-coded weekly or monthly calendar',
      'Track the full job lifecycle: Quote → Confirmed → In Progress → Completed',
      'Set deposit or upfront payment plans with partial payment tracking',
      'Log job expenses (fuel, labour, maintenance) and see profit per job',
    ],
    steps: [
      {
        id: 'jb-0',
        question: 'Start a new job with the wizard',
        answer:
          'Go to Jobs → click "New Job". Step 1: select an available machine from the grid. Step 2: choose an existing customer or create one inline. Step 3: set the start and end dates, rate type (daily/weekly/etc.), delivery address, payment plan, and any extra charges. Step 4: review everything and click "Create Job".',
      },
      {
        id: 'jb-1',
        question: 'Confirm a job and put the machine on hire',
        answer:
          'Open the job and click "Mark as In Progress" (or "Confirm Job" depending on payment plan). The machine status automatically changes to "On Hire" and the job moves to the In Progress stage. If a deposit is required, you must record the deposit first.',
      },
      {
        id: 'jb-2',
        question: 'Complete a hire and return the machine',
        answer:
          'When the machine is returned, open the job and click "Complete Hire". A return checklist appears with 5 items to verify: machine returned, fuel level checked, no damage, all accessories back, hours logged. Tick all items and confirm. The machine status returns to Available.',
      },
      {
        id: 'jb-3',
        question: 'Log expenses against a job',
        answer:
          'Open the job detail and click "Log Job Cost". Select a category (Fuel, Maintenance, Wages, etc.), enter the description and amount. You can tick "Auto-GST" to calculate 1/11 GST automatically. These costs feed into the job\'s profit calculation.',
      },
      {
        id: 'jb-4',
        question: 'Use the calendar view',
        answer:
          'The Jobs page defaults to Calendar view showing all bookings as coloured bars across time. Toggle between Weekly and Monthly views. Click any empty cell to start a new booking pre-filled with that machine and date. Click any booking bar to open the job detail.',
      },
      {
        id: 'jb-5',
        question: 'Edit a confirmed booking',
        answer:
          'Open the booking detail page. If the status is Quote or Confirmed, an Edit button is visible at the top. Click it to open the edit modal where you can change dates, rates, delivery address, payment plan, and notes.',
      },
    ],
    tips: [
      'Date conflicts are detected automatically — if you pick dates when a machine is already booked, a warning banner appears in Step 3 of the wizard.',
      'Switch to List view on the Jobs page for quick searching — search by customer name or machine name using the search bar.',
    ],
    showTourCTA: false,
    tourSteps: JOBS_TOUR,
    tourPath: '/bookings',
  },

  {
    id: 'quotes',
    emoji: '📋',
    label: 'Quotes',
    title: 'Quotes',
    description: 'Send professional hire quotes to customers and convert them to jobs with one click.',
    capabilities: [
      'Create quotes with custom line items, hire dates, and auto-calculated GST',
      'Send quotes directly to customers via email or a shareable link',
      'Quotes expire after a configurable number of days',
      'Accept quotes on behalf of customers when verbal confirmation is received',
      'Convert accepted quotes to confirmed bookings with a single click',
    ],
    steps: [
      {
        id: 'qt-0',
        question: 'Create a quote',
        answer:
          'Go to Quotes → click "New Quote". Select the customer and machine. Set the issue date and expiry date. Add hire start and end dates (optional). The machine\'s daily rate auto-fills as the first line item — you can adjust the quantity and price. Add additional line items for fuel levies, delivery, or other charges. The subtotal, GST, and total calculate automatically.',
      },
      {
        id: 'qt-1',
        question: 'Send a quote to a customer',
        answer:
          'From the Quotes list, click "Send Email" next to the quote. If the customer has an email address on file, the quote is emailed directly. Otherwise, a shareable link is generated and copied to your clipboard — you can paste it into any message to your customer.',
      },
      {
        id: 'qt-2',
        question: 'Share a public quote link',
        answer:
          'Click "Copy Link" on any quote. This generates a time-limited, shareable URL that lets your customer view the quote without logging in. The page shows your company branding, line items, total, and a way to contact you.',
      },
      {
        id: 'qt-3',
        question: 'Accept a quote and convert to a job',
        answer:
          'When a customer accepts verbally or in writing, open the quote and mark it as Accepted. An "Accepted" banner appears at the top of the Quotes list. Click "Convert to Job" — a confirmed booking is created instantly with the quote\'s machine, customer, dates, and line items pre-filled.',
      },
    ],
    tips: [
      'Accepted quotes are highlighted at the top of the Quotes list so you never miss a conversion.',
      'You can set a default quote expiry period in Settings → Invoice Settings to save time on every new quote.',
    ],
    showTourCTA: false,
    tourSteps: QUOTES_TOUR,
    tourPath: '/quotes',
  },

  {
    id: 'invoices',
    emoji: '💰',
    label: 'Invoices',
    title: 'Invoices & Payments',
    description: 'Create, send, and track invoices — and get paid faster with online payment links.',
    capabilities: [
      'Auto-generate invoices from completed bookings with all charges pre-filled',
      'Send invoices to customers by email with a PDF attachment',
      'Record partial payments with a live balance tracker',
      'Send payment reminders to customers with overdue invoices',
      'Accept online payments via Stripe with a Pay Now button on the invoice',
    ],
    steps: [
      {
        id: 'inv-0',
        question: 'Create an invoice from a booking',
        answer:
          'Open a completed or confirmed booking and click "Generate Invoice". The invoice is created with the booking reference, customer details, and all charges pre-filled. You\'re taken directly to the invoice detail page.',
      },
      {
        id: 'inv-1',
        question: 'Create a standalone invoice',
        answer:
          'Go to Invoices → click "New Invoice". Select the customer, set the issue date and due date. Add line items with description, quantity, and unit price. The GST (10%) and total calculate automatically. Click Save to create the draft invoice.',
      },
      {
        id: 'inv-2',
        question: 'Send an invoice to a customer',
        answer:
          'Open the invoice. If it\'s in Draft status, click "Mark as Sent" first — this changes the status and enables email sending. Then click "Send Email" to deliver it. The customer receives an email with a link to view the invoice online and a PDF attachment.',
      },
      {
        id: 'inv-3',
        question: 'Record a payment (partial or full)',
        answer:
          'Open a Sent or Overdue invoice and click "Record Payment" (the primary green button). Enter the amount received — this can be a partial amount. The running balance updates immediately. When the full amount is paid, the invoice automatically transitions to Paid.',
      },
      {
        id: 'inv-4',
        question: 'Send a payment reminder',
        answer:
          'Open a Sent or Overdue invoice and click the Bell icon ("Send Reminder"). An automated reminder email is sent to the customer with a link back to the invoice and the outstanding balance. This is only available on Sent and Overdue invoices.',
      },
      {
        id: 'inv-5',
        question: 'Download an invoice as PDF',
        answer:
          'Open the invoice and click the Download icon. If your PDF Edge Function is deployed, a formatted PDF downloads directly. Otherwise, the browser\'s print dialog opens — use "Save as PDF" to export.',
      },
    ],
    tips: [
      'Invoices automatically turn Overdue when their due date passes — the system checks nightly via a scheduled database function.',
      'The due-date badge on the Invoices list is colour-coded: green for on time, yellow for due soon (≤3 days), red for overdue.',
    ],
    showTourCTA: false,
    tourSteps: INVOICES_TOUR,
    tourPath: '/invoices',
  },

  {
    id: 'customers',
    emoji: '👥',
    label: 'Customers',
    title: 'Customers',
    description: 'Build and manage your client database — linked to every booking, quote, and invoice.',
    capabilities: [
      'Store customer contact details, address, and notes',
      'View the full booking and invoice history for each customer',
      'See total revenue and outstanding balance at a glance',
      'Quick-add customers from anywhere in the app via the top bar',
      'Link customers to quotes, jobs, and invoices — no double entry',
    ],
    steps: [
      {
        id: 'cu-0',
        question: 'Add a new customer',
        answer:
          'Go to Customers → click "Add Customer". Enter the company name, contact name, phone number, email address, and address details. Add any notes (e.g. "Preferred client", "Always pays on time"). Click Save.',
      },
      {
        id: 'cu-1',
        question: 'Quick-add a customer from anywhere',
        answer:
          'Click the person+ icon in the top bar (right side, next to the bell). A quick modal opens where you can enter the basic customer details. The customer is saved and immediately available to select in bookings, quotes, and invoices.',
      },
      {
        id: 'cu-2',
        question: 'View a customer\'s history',
        answer:
          'Click on any customer name in the list to open their detail page. The page shows their contact details and three tabs: Bookings (all jobs for this customer), Invoices (all invoices), and Notes. Each row links through to the full booking or invoice.',
      },
      {
        id: 'cu-3',
        question: 'Edit customer details',
        answer:
          'From the customer detail page, click "Edit" to open the edit modal. You can update all fields including the notes section. Click Save to apply changes.',
      },
    ],
    tips: [
      'The Customers list shows a total revenue figure for each customer — great for identifying your most valuable clients at a glance.',
      'Search customers by name, contact name, or email using the search bar at the top of the Customers list.',
    ],
    showTourCTA: false,
    tourSteps: CUSTOMERS_TOUR,
    tourPath: '/customers',
  },

  {
    id: 'accounting',
    emoji: '📊',
    label: 'Accounting',
    title: 'Accounting & Reports',
    description: 'Track income, expenses, and profitability — with fleet ROI down to each machine.',
    capabilities: [
      'View income auto-synced from paid invoices in real-time',
      'Log business expenses with categories, GST, and receipt uploads',
      'Run a Profit & Loss report for any custom date period',
      'See Fleet ROI — revenue vs costs per machine',
      'Export GST summary data for your accountant',
    ],
    steps: [
      {
        id: 'ac-0',
        question: 'View your income for a period',
        answer:
          'Go to Reports (Accounting) in the sidebar. Use the period selector at the top to choose This Month, Last Month, This Quarter, or a custom date range. The Overview tab shows revenue, expenses, profit, and margin for that period.',
      },
      {
        id: 'ac-1',
        question: 'Log a business expense',
        answer:
          'Go to Reports → Expenses tab → click "Add Expense". Select a category (Fuel, Maintenance, Insurance, Wages, etc.), enter the date, description, and amount excluding GST. Click "Auto-GST" to calculate 1/11 GST automatically. Optionally add the vendor name and upload a receipt file.',
      },
      {
        id: 'ac-2',
        question: 'Run a Profit & Loss report',
        answer:
          'Go to Reports → P&L Report tab. Select your date range using the period buttons or custom date picker. The report shows total income (invoiced and paid), total expenses broken down by category, gross profit, and net margin percentage.',
      },
      {
        id: 'ac-3',
        question: 'Check Fleet ROI per machine',
        answer:
          'Go to Reports → Fleet ROI tab. Each machine in your fleet is listed with its total revenue, total costs, profit, and margin % for the selected period. This shows you which machines are your most profitable and which are costing you more than they earn.',
      },
    ],
    tips: [
      'Job expenses logged directly on a booking (via "Log Job Cost") automatically appear in the Expenses tab — no double entry needed.',
      'Run the expenses database migration if the Expenses tab shows a setup notice — the SQL is displayed on the page.',
    ],
    showTourCTA: false,
    tourSteps: ACCOUNTING_TOUR,
    tourPath: '/accounting',
  },

  {
    id: 'settings',
    emoji: '⚙️',
    label: 'Settings',
    title: 'Settings',
    description: 'Configure your company profile, invoice defaults, bank details, and your team.',
    capabilities: [
      'Update company name, ABN, phone, email, and address',
      'Set bank account details that automatically appear on every invoice',
      'Configure default invoice payment terms and notes',
      'Invite team members by email with Admin, User, or Finance roles',
      'Manage cross-hire preferences for your fleet',
    ],
    steps: [
      {
        id: 'st-0',
        question: 'Update company details',
        answer:
          'Go to Settings → Company Profile tab. Update your company name, ABN, phone, email, and address. These details appear on all invoices and quotes sent to customers. Click Save when done.',
      },
      {
        id: 'st-1',
        question: 'Add bank details to invoices',
        answer:
          'Go to Settings → Invoice Settings tab. Enter your BSB, account number, and account name in the Bank Details section. These details are embedded into every PDF invoice and displayed on the online invoice view, so customers know exactly where to pay.',
      },
      {
        id: 'st-2',
        question: 'Set invoice defaults',
        answer:
          'In Settings → Invoice Settings, set your default Payment Terms (number of days until due) and a default Invoice Notes message (e.g. "Payment due within 30 days. Thank you for your business."). These pre-fill on every new invoice you create.',
      },
      {
        id: 'st-3',
        question: 'Invite a team member',
        answer:
          'Go to Settings → Team Members tab. Enter the email address and select a role: Admin (full access), User (create and manage bookings/invoices), or Finance (reports and invoices only). Click "Send Invite". The person receives an email invitation to join your account.',
      },
      {
        id: 'st-4',
        question: 'Update your personal profile',
        answer:
          'Go to Settings → My Profile tab. Update your full name, phone number, and password. Click Save to apply changes.',
      },
    ],
    tips: [
      'Keep your bank details and payment terms up to date — they\'re embedded in every invoice PDF sent to customers.',
      'Pending invites can be revoked from the Team Members tab if someone no longer needs access.',
    ],
    showTourCTA: false,
    tourSteps: SETTINGS_TOUR,
    tourPath: '/settings',
  },

  {
    id: 'payments',
    emoji: '💳',
    label: 'Payments',
    title: 'Online Payments (Stripe)',
    description: 'Let customers pay invoices online by card — funds go directly to your account.',
    capabilities: [
      'Accept credit and debit card payments directly on invoices',
      'Customers click "Pay Now" on their invoice link — no account needed',
      'Supports deposit plans — customers can pay a percentage upfront',
      'Stripe handles all card security and PCI compliance',
      'Invoice status updates to Paid automatically after successful payment',
    ],
    steps: [
      {
        id: 'py-0',
        question: 'Connect Stripe to HireHub',
        answer:
          'Go to Settings → Invoice Settings → scroll to the Stripe Configuration section. Follow the CLI instructions shown on screen to deploy the payment Edge Function with your Stripe secret key as an environment variable. You\'ll also need to add your Stripe Publishable Key to the .env file.',
      },
      {
        id: 'py-1',
        question: 'Enable Pay Now on an invoice',
        answer:
          'Once Stripe is configured, a "Pay Online" button automatically appears on all Sent and Overdue invoices. You don\'t need to do anything extra per invoice — it works for all of them.',
      },
      {
        id: 'py-2',
        question: 'How customers pay online',
        answer:
          'Your customer opens the invoice link (from the email or a shared link). They click "Pay Now", enter their card details in the secure Stripe payment form, and confirm. The payment is processed immediately and the invoice status updates to Paid.',
      },
      {
        id: 'py-3',
        question: 'Deposit payment plans',
        answer:
          'When creating a booking, in Step 3 set the Payment Plan to "Deposit". Choose a percentage (e.g. 30%) or a fixed amount. The customer is shown the deposit amount due on the invoice. Once the deposit is paid, the booking can be confirmed and the machine put on hire.',
      },
    ],
    tips: [
      'Stripe credentials are stored as server-side environment variables and are never exposed in the browser — your keys are safe.',
      'You can still record manual cash or bank transfer payments using "Record Payment" even if Stripe is not configured.',
    ],
    showTourCTA: false,
    tourSteps: PAYMENTS_TOUR,
    tourPath: '/settings',
  },
];
