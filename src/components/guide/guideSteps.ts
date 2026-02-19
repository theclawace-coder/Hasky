export interface GuideStep {
  id: string;
  title: string;
  description: string;
  target?: string; // CSS selector for spotlight
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  icon?: string;
}

export const GUIDE_STEPS: GuideStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Hasky! 🎉',
    description:
      'Hasky is your all-in-one platform for managing your machine hire business — from fleet tracking and bookings, to invoicing and accounting. This quick tour will walk you through all the key features.',
    position: 'center',
    icon: '🚜',
  },
  {
    id: 'sidebar',
    title: 'Navigation Sidebar',
    description:
      'The sidebar on the left is your main navigation hub. Click any item to jump to that section. You can collapse the sidebar using the arrow button at the top to give yourself more screen space.',
    target: '#sidebar',
    position: 'right',
    icon: '🧭',
  },
  {
    id: 'dashboard',
    title: 'Dashboard Overview',
    description:
      'Your dashboard gives you a real-time snapshot of your business: total machines, how many are on hire, available, or under repair — plus revenue metrics for the current month.',
    target: '#dashboard-stats',
    position: 'bottom',
    icon: '📊',
  },
  {
    id: 'fleet',
    title: 'Fleet Management',
    description:
      'The Fleet section lets you manage all your machines. Add new machines with photos, track their status (available, on hire, under repair), set hourly/daily/weekly/monthly rates, and log maintenance records.',
    position: 'center',
    icon: '🚛',
  },
  {
    id: 'bookings',
    title: 'Bookings',
    description:
      'Create and manage hire bookings here. Set the machine, customer, dates, and rate type. Bookings flow through statuses: Quote → Confirmed → Active → Completed. You can also view a calendar layout.',
    position: 'center',
    icon: '📅',
  },
  {
    id: 'customers',
    title: 'Customers',
    description:
      'Keep all your customer records in one place. Store contact details, ABN, address, and notes. Click a customer to view their full history — all bookings, quotes, and invoices linked to them.',
    position: 'center',
    icon: '👥',
  },
  {
    id: 'quotes',
    title: 'Quotes',
    description:
      'Generate professional quotes with line items and send them to customers. When a quote is accepted, convert it to a booking with one click — no double-entry needed.',
    position: 'center',
    icon: '📝',
  },
  {
    id: 'invoices',
    title: 'Invoices & Payments',
    description:
      'Create invoices from bookings or from scratch. Send them to customers and mark them as paid. The "Pay Now" button lets customers pay directly via credit/debit card through Stripe — fully embedded in the app.',
    position: 'center',
    icon: '💳',
  },
  {
    id: 'accounting',
    title: 'Accounting',
    description:
      'The Accounting page gives you a simple financial overview. Income is auto-synced from paid invoices. You can manually log expenses (fuel, maintenance, wages, etc.), and view a full P&L report with GST summary.',
    position: 'center',
    icon: '📒',
  },
  {
    id: 'settings',
    title: 'Settings',
    description:
      'In Settings, configure your company profile, bank details for invoices, invite team members with role-based access (Admin, User, Viewer), and set your cross-hire preferences.',
    position: 'center',
    icon: '⚙️',
  },
  {
    id: 'help',
    title: 'Getting Help',
    description:
      'Whenever you need a refresher, click the "?" button in the top-right of any page to restart this guide. Each section also has in-context hints and empty-state messages to guide you.',
    target: '#help-button',
    position: 'bottom',
    icon: '❓',
  },
  {
    id: 'done',
    title: "You're all set! 🚀",
    description:
      "That's everything! Start by adding your machines in the Fleet section, then create your first customer and booking. If you ever get stuck, the Help button is always there. Happy hiring!",
    position: 'center',
    icon: '✅',
  },
];
