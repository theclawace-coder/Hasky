import type { GuideStep } from './guideSteps';

// ─── Per-page tour step sets ──────────────────────────────────────────────
// Each array is passed to AppGuide as a custom `steps` override when the user
// launches a tour from the Help Wiki article for that page.
// PAGE_TOUR_MAP is also used by Layout/TopBar to auto-detect the tour for the current route.
// ─────────────────────────────────────────────────────────────────────────
// Most steps use position:'center' to avoid needing specific DOM targets.
// ─────────────────────────────────────────────────────────────────────────

export const FLEET_TOUR: GuideStep[] = [
  {
    id: 'fleet-1',
    title: 'Fleet Management 📦',
    description:
      'Welcome to your Fleet. This page shows every machine in your hire inventory — in a card grid or table view. You can filter by category or status to find what you need fast.',
    position: 'center',
    icon: '📦',
  },
  {
    id: 'fleet-2',
    title: 'Adding a Machine',
    description:
      'Click "Add Machine" to register a new piece of equipment. Fill in the name, category (Excavator, Telehandler, etc.), make, model, year, serial number, and location. You can also upload a photo.',
    position: 'center',
    icon: '➕',
  },
  {
    id: 'fleet-3',
    title: 'Setting Hire Rates',
    description:
      'Each machine can have up to 5 rate types: Hourly, Daily, Weekend, Weekly, and Monthly. These rates auto-fill when you create a booking for this machine — no manual entry required.',
    position: 'center',
    icon: '💲',
  },
  {
    id: 'fleet-4',
    title: 'Machine Status',
    description:
      'Every machine has a live status: Available (ready to book), On Hire (currently out), Under Repair (blocked from booking), In Transit, or Retired. Status updates automatically when jobs start and finish.',
    position: 'center',
    icon: '🔄',
  },
  {
    id: 'fleet-5',
    title: 'Maintenance History',
    description:
      'Click any machine to open its detail page, then click "Add Maintenance Record". Log services, repairs, inspections, and certifications with cost, date, and who performed the work — a full audit trail.',
    position: 'center',
    icon: '🔧',
  },
  {
    id: 'fleet-6',
    title: "Fleet — You're set! ✅",
    description:
      'Your fleet is now ready. Add all your machines here, then head to Jobs to start creating hire bookings. The dashboard will show fleet utilisation in real-time.',
    target: '#help-button',
    position: 'bottom',
    icon: '✅',
  },
];

export const JOBS_TOUR: GuideStep[] = [
  {
    id: 'jobs-1',
    title: 'Jobs & Bookings 🏗️',
    description:
      'This is where every hire lives — from the initial quote through to completion. View all jobs on the calendar or switch to list view to search and filter.',
    position: 'center',
    icon: '🏗️',
  },
  {
    id: 'jobs-2',
    title: 'The 4-Step Wizard',
    description:
      'Click "New Job" to launch the booking wizard. Step 1: pick an available machine. Step 2: choose or create a customer. Step 3: set dates, rate type, delivery address, and payment plan. Step 4: review and confirm.',
    position: 'center',
    icon: '🧙',
  },
  {
    id: 'jobs-3',
    title: 'Job Statuses',
    description:
      'Every job follows a lifecycle: Quote (created, awaiting deposit) → Confirmed (deposit paid) → In Progress (machine on site) → Completed (machine returned). The status bar at the top of each job shows where you are.',
    position: 'center',
    icon: '📊',
  },
  {
    id: 'jobs-4',
    title: 'Payment Plans',
    description:
      'In Step 3, choose between Upfront (full payment before delivery) or Deposit (a % or fixed amount upfront, remainder later). The job cannot be confirmed until the required payment is recorded.',
    position: 'center',
    icon: '💰',
  },
  {
    id: 'jobs-5',
    title: 'Complete a Hire',
    description:
      'When the machine comes back, open the job and click "Complete Hire". A return checklist appears — tick off: machine returned, fuel level, no damage, accessories, hours logged. Confirming sets the machine back to Available.',
    position: 'center',
    icon: '✔️',
  },
  {
    id: 'jobs-6',
    title: 'Job Profit Tracking',
    description:
      'Click "Log Job Cost" on any job to record fuel, labour, or maintenance expenses. The job detail shows a live profit card: Revenue − Costs = Profit (with margin %). Every job tells you if it\'s making money.',
    position: 'center',
    icon: '📈',
  },
  {
    id: 'jobs-7',
    title: "Jobs — You're set! ✅",
    description:
      'Create jobs, track them through the workflow, and generate invoices with one click when the hire is done. The calendar gives you a visual overview of where every machine is at any time.',
    target: '#help-button',
    position: 'bottom',
    icon: '✅',
  },
];

export const QUOTES_TOUR: GuideStep[] = [
  {
    id: 'quotes-1',
    title: 'Quotes 📋',
    description:
      'The Quotes page is where you prepare and send pricing to customers before they commit. Quotes can expire after a set number of days and convert to bookings with a single click.',
    position: 'center',
    icon: '📋',
  },
  {
    id: 'quotes-2',
    title: 'Creating a Quote',
    description:
      'Click "New Quote". Select the customer and machine — the machine\'s daily rate auto-fills as the first line item. Add optional hire dates, then add extra line items for fuel levies, delivery, or other charges.',
    position: 'center',
    icon: '✏️',
  },
  {
    id: 'quotes-3',
    title: 'Sending to Customers',
    description:
      'Click "Send Email" to deliver the quote directly to the customer\'s inbox. Or click "Copy Link" to get a shareable URL — the customer can view the quote in their browser without logging in.',
    position: 'center',
    icon: '📧',
  },
  {
    id: 'quotes-4',
    title: 'GST & Totals',
    description:
      'HireHub automatically calculates GST at 10% on all line items. The quote shows Subtotal, GST (10%), and Total — the same layout your customer sees on the public quote page.',
    position: 'center',
    icon: '🧮',
  },
  {
    id: 'quotes-5',
    title: 'Accept & Convert to Job',
    description:
      'When a customer says yes, mark the quote as Accepted. An orange banner highlights it at the top of the Quotes list. Click "Convert to Job" — a confirmed booking is created instantly with all details pre-filled.',
    position: 'center',
    icon: '🔄',
  },
  {
    id: 'quotes-6',
    title: "Quotes — You're set! ✅",
    description:
      'Use quotes for any job that needs customer approval before you commit the machine. Accepted quotes feed directly into your bookings and invoicing workflow.',
    target: '#help-button',
    position: 'bottom',
    icon: '✅',
  },
];

export const INVOICES_TOUR: GuideStep[] = [
  {
    id: 'inv-1',
    title: 'Invoices & Payments 💰',
    description:
      'The Invoices page shows every invoice — standalone or generated from a completed booking. Filter by status using the tabs at the top: Draft, Sent, Paid, Overdue.',
    position: 'center',
    icon: '💰',
  },
  {
    id: 'inv-2',
    title: 'Invoice Status Flow',
    description:
      'Invoices follow a clear path: Draft (just created) → Sent (emailed to customer) → Paid (fully settled). If a due date passes without payment, the status becomes Overdue automatically — updated nightly.',
    position: 'center',
    icon: '🔄',
  },
  {
    id: 'inv-3',
    title: 'Sending an Invoice',
    description:
      'Open any draft invoice and click "Mark as Sent". Then click "Send Email" to deliver it to the customer — they receive a link to view it online plus a PDF attachment. Or use "Copy Link" to share it manually.',
    position: 'center',
    icon: '📧',
  },
  {
    id: 'inv-4',
    title: 'Recording Payments',
    description:
      'Open a Sent invoice and click "Record Payment". Enter the amount received — this can be a partial amount. The invoice shows the running balance. When fully paid, the status flips to Paid automatically.',
    position: 'center',
    icon: '✔️',
  },
  {
    id: 'inv-5',
    title: 'Payment Reminders',
    description:
      'For Sent or Overdue invoices, click the Bell icon ("Send Reminder"). This fires an automated email to the customer with their outstanding balance and a direct link to pay online.',
    position: 'center',
    icon: '🔔',
  },
  {
    id: 'inv-6',
    title: 'Online Payments (Stripe)',
    description:
      'Once Stripe is connected via Settings, a "Pay Now" button appears on every sent invoice. Customers click it, enter their card, and the invoice is marked Paid — no manual recording needed.',
    position: 'center',
    icon: '💳',
  },
  {
    id: 'inv-7',
    title: "Invoices — You're set! ✅",
    description:
      'Generate invoices from bookings, send them in one click, and get paid faster with online payments. The due-date badge on the list keeps you on top of what\'s outstanding.',
    target: '#help-button',
    position: 'bottom',
    icon: '✅',
  },
];

export const CUSTOMERS_TOUR: GuideStep[] = [
  {
    id: 'cust-1',
    title: 'Customers 👥',
    description:
      'The Customers page is your client database. Every customer is linked to their bookings, quotes, and invoices — no duplicate data entry across the app.',
    position: 'center',
    icon: '👥',
  },
  {
    id: 'cust-2',
    title: 'Adding a Customer',
    description:
      'Click "Add Customer" to create a new customer record. Fill in the company name, contact person, phone, email, and address. Add notes for anything useful — payment history, site access details, VIP status.',
    position: 'center',
    icon: '➕',
  },
  {
    id: 'cust-3',
    title: 'Quick-Add from Top Bar',
    description:
      'The person+ icon in the top bar lets you add a customer from anywhere — even mid-booking. The customer is saved instantly and available to select immediately.',
    target: '#help-button',
    position: 'bottom',
    icon: '⚡',
  },
  {
    id: 'cust-4',
    title: 'Customer History',
    description:
      'Click any customer to open their detail page. Three tabs show you everything: Bookings (every job they\'ve had), Invoices (all bills and their status), and Notes. Revenue and outstanding balance are shown at the top.',
    position: 'center',
    icon: '📂',
  },
  {
    id: 'cust-5',
    title: "Customers — You're set! ✅",
    description:
      'Build up your customer list and every booking, quote, and invoice you create for them is automatically linked. Your most valuable customers show up clearly with their lifetime revenue.',
    position: 'center',
    icon: '✅',
  },
];

export const ACCOUNTING_TOUR: GuideStep[] = [
  {
    id: 'acc-1',
    title: 'Accounting & Reports 📊',
    description:
      'The Reports page gives you a financial view of your business. Income is pulled automatically from paid invoices. Use the period selector to view any time range — this month, last quarter, or a custom range.',
    position: 'center',
    icon: '📊',
  },
  {
    id: 'acc-2',
    title: 'Overview Tab',
    description:
      'The Overview shows your P&L at a glance: total revenue, total expenses, gross profit, and net margin %. It updates in real-time as you record payments and log expenses.',
    position: 'center',
    icon: '🔭',
  },
  {
    id: 'acc-3',
    title: 'Logging Expenses',
    description:
      'Go to the Expenses tab and click "Add Expense". Select a category (Fuel, Maintenance, Insurance, Wages, etc.), enter the amount and GST. Upload a receipt file for your records. Expenses from individual jobs also appear here automatically.',
    position: 'center',
    icon: '🧾',
  },
  {
    id: 'acc-4',
    title: 'P&L Report',
    description:
      'The P&L Report tab shows a full income statement for the selected period: invoiced revenue, collected revenue, outstanding, expenses by category, and net profit. Print or export for your accountant.',
    position: 'center',
    icon: '📄',
  },
  {
    id: 'acc-5',
    title: 'Fleet ROI',
    description:
      'The Fleet ROI tab ranks every machine by profitability — total revenue earned minus total costs logged, with a margin %. Instantly see which machines are your most profitable and which need attention.',
    position: 'center',
    icon: '🏆',
  },
  {
    id: 'acc-6',
    title: "Accounting — You're set! ✅",
    description:
      'Log expenses consistently, record payments promptly, and you\'ll always have an accurate picture of your business finances. Run the P&L report at month-end to see exactly how you performed.',
    target: '#help-button',
    position: 'bottom',
    icon: '✅',
  },
];

export const SETTINGS_TOUR: GuideStep[] = [
  {
    id: 'set-1',
    title: 'Settings ⚙️',
    description:
      'Settings is where you configure HireHub for your business. There are five tabs: Company Profile, Team Members, Cross-Hire, Invoice Settings, and My Profile.',
    position: 'center',
    icon: '⚙️',
  },
  {
    id: 'set-2',
    title: 'Company Profile',
    description:
      'Update your company name, ABN, phone number, and address. These details appear on all invoices and quotes sent to customers, so keep them current.',
    position: 'center',
    icon: '🏢',
  },
  {
    id: 'set-3',
    title: 'Invoice Settings',
    description:
      'Set your bank account BSB, account number, and account name — these print on every invoice PDF so customers know where to pay. Also set your default payment terms (e.g. 30 days) and any standard invoice notes.',
    position: 'center',
    icon: '🏦',
  },
  {
    id: 'set-4',
    title: 'Team Members',
    description:
      'Invite team members by email and assign a role: Admin (full access), User (bookings and invoices), or Finance (reports only). Pending invites are listed here and can be revoked any time.',
    position: 'center',
    icon: '👤',
  },
  {
    id: 'set-5',
    title: 'Stripe (Online Payments)',
    description:
      'The Invoice Settings tab has a Stripe Configuration section. Follow the CLI instructions shown to connect Stripe — once set up, a "Pay Now" button automatically appears on all sent invoices.',
    position: 'center',
    icon: '💳',
  },
  {
    id: 'set-6',
    title: "Settings — You're set! ✅",
    description:
      'Get your bank details and payment terms set up first — they\'re embedded in every invoice. Then invite your team and you\'ll be running as a full organisation.',
    target: '#help-button',
    position: 'bottom',
    icon: '✅',
  },
];

export const PAYMENTS_TOUR: GuideStep[] = [
  {
    id: 'pay-1',
    title: 'Online Payments 💳',
    description:
      'HireHub integrates with Stripe to let customers pay invoices online by card. No more chasing bank transfers — customers click "Pay Now" on their invoice and pay in seconds.',
    position: 'center',
    icon: '💳',
  },
  {
    id: 'pay-2',
    title: 'Connecting Stripe',
    description:
      'Go to Settings → Invoice Settings → scroll to Stripe Configuration. Follow the CLI instructions to deploy the payment Edge Function with your Stripe Secret Key. Add your Publishable Key to the .env file.',
    position: 'center',
    icon: '🔌',
  },
  {
    id: 'pay-3',
    title: '"Pay Now" on Invoices',
    description:
      'Once Stripe is live, a "Pay Now" button appears automatically on all Sent and Overdue invoices — both in the app and on the public invoice link your customer receives.',
    position: 'center',
    icon: '🟢',
  },
  {
    id: 'pay-4',
    title: 'Deposit Payment Plans',
    description:
      'When creating a booking, select "Deposit" as the payment plan in Step 3. Set a percentage (e.g. 30%) or a fixed dollar amount. The customer pays the deposit to confirm the booking, with the balance due on delivery.',
    position: 'center',
    icon: '📑',
  },
  {
    id: 'pay-5',
    title: 'Manual Payments',
    description:
      'Not using Stripe? No problem. Use "Record Payment" on any invoice to manually record cash, bank transfer, or cheque payments. Enter the amount and it\'s tracked against the invoice balance.',
    position: 'center',
    icon: '💵',
  },
  {
    id: 'pay-6',
    title: "Payments — You're set! ✅",
    description:
      'Whether you take card payments online or record them manually, every payment is tracked against its invoice. Your accounting automatically reflects what\'s been paid vs what\'s outstanding.',
    target: '#help-button',
    position: 'bottom',
    icon: '✅',
  },
];

export const DASHBOARD_TOUR: GuideStep[] = [
  {
    id: 'dash-1',
    title: 'Your Dashboard 🏠',
    description:
      'The Dashboard is your daily command centre. At a glance you can see fleet status, revenue for the month, upcoming jobs, and anything that needs your attention — all in one view.',
    position: 'center',
    icon: '🏠',
  },
  {
    id: 'dash-2',
    title: 'Fleet & Revenue Stats',
    description:
      'The stat cards show: Total Machines, On Hire, Available, and Under Repair — plus Invoiced This Month, Outstanding, and Paid. Numbers update in real-time as bookings and invoices change.',
    target: '#dashboard-stats',
    position: 'bottom',
    icon: '📊',
  },
  {
    id: 'dash-3',
    title: 'Fleet Utilisation',
    description:
      'The Fleet Utilisation card shows what percentage of your fleet is on hire. Higher utilisation = more revenue. The stacked bar breaks it down so you can see how many machines are available vs deployed.',
    position: 'center',
    icon: '📈',
  },
  {
    id: 'dash-4',
    title: 'Needs Attention Panel',
    description:
      'The "Needs Attention" panel surfaces the most urgent items: overdue invoices, quotes expiring soon, bookings awaiting confirmation, and machines overdue for return. Check it every morning.',
    position: 'center',
    icon: '⚠️',
  },
  {
    id: 'dash-5',
    title: 'Quick Actions',
    description:
      'The three gradient cards at the bottom let you jump straight to New Job, New Quote, or New Invoice. These are the most common daily tasks — one click gets you straight into the creation flow.',
    position: 'center',
    icon: '⚡',
  },
  {
    id: 'dash-6',
    title: "Dashboard — You're set! ✅",
    description:
      'Start every day on the Dashboard to check utilisation, review upcoming jobs, and clear the Needs Attention panel. It\'s the fastest way to keep your business running smoothly.',
    target: '#help-button',
    position: 'bottom',
    icon: '✅',
  },
];

// ─── Route → tour steps map ───────────────────────────────────────────────
// Used by Layout to derive the active page's tour from location.pathname.
export const PAGE_TOUR_MAP: Record<string, GuideStep[]> = {
  '/dashboard':  DASHBOARD_TOUR,
  '/fleet':      FLEET_TOUR,
  '/bookings':   JOBS_TOUR,
  '/quotes':     QUOTES_TOUR,
  '/invoices':   INVOICES_TOUR,
  '/customers':  CUSTOMERS_TOUR,
  '/accounting': ACCOUNTING_TOUR,
  '/settings':   SETTINGS_TOUR,
};
