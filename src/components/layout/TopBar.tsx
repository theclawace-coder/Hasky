import { Menu, HelpCircle, Bell } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useUiStore } from '../../store/uiStore';

const PAGE_TITLES: Record<string, string> = {
  dashboard:  'Dashboard',
  fleet:      'Fleet',
  bookings:   'Jobs',
  customers:  'Customers',
  quotes:     'Quotes',
  invoices:   'Invoices',
  accounting: 'Reports',
  settings:   'Settings',
  admin:      'Admin',
};

interface TopBarProps {
  onHelpClick?: () => void;
}

export function TopBar({ onHelpClick }: TopBarProps) {
  const { pathname } = useLocation();
  const { company } = useAuth();
  const { setSidebarOpen } = useUiStore();

  const segments = pathname.split('/').filter(Boolean);
  const pageKey = segments[0] ?? 'dashboard';
  const pageTitle = PAGE_TITLES[pageKey] ?? pageKey.replace(/-/g, ' ').replace(/^\w/, (c) => c.toUpperCase());

  const breadcrumb = segments
    .map((s) => PAGE_TITLES[s] ?? s.replace(/-/g, ' ').replace(/^\w/, (c) => c.toUpperCase()))
    .join(' › ');

  return (
    <header
      className="sticky top-0 z-20 border-b"
      style={{
        background: 'rgba(255,255,255,0.78)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderColor: 'rgba(255,255,255,0.55)',
        boxShadow: '0 1px 0 rgba(0,0,0,0.04), 0 4px 16px rgba(0,0,0,0.04)',
      }}
    >
      <div className="flex min-h-[60px] items-center justify-between px-4 lg:px-6">
        {/* Left: hamburger + title */}
        <div className="flex items-center gap-3">
          <button
            className="flex size-9 items-center justify-center rounded-xl text-slate-500 transition-all hover:bg-white/80 hover:text-slate-800 hover:shadow-sm lg:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="size-5" />
          </button>
          <div>
            {breadcrumb ? (
              <p className="hidden text-[11px] font-medium text-slate-400 sm:block">{breadcrumb}</p>
            ) : null}
            <h1 className="text-base font-bold tracking-tight text-slate-900">{pageTitle}</h1>
          </div>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-1.5">
          {/* Company name pill — glass */}
          {company?.name ? (
            <span
              className="hidden items-center rounded-full px-3 py-1 text-xs font-semibold text-slate-700 sm:flex"
              style={{
                background: 'rgba(255,255,255,0.72)',
                border: '1px solid rgba(255,255,255,0.6)',
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              }}
            >
              {company.name}
            </span>
          ) : null}

          {/* Notifications */}
          <button
            className="relative flex size-9 items-center justify-center rounded-xl text-slate-400 transition-all hover:bg-white/80 hover:text-slate-700 hover:shadow-sm"
            aria-label="Notifications"
            title="Notifications"
          >
            <Bell className="size-4" />
            {/* Pulse dot */}
            <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 shadow-sm" />
          </button>

          {/* Help / guide trigger */}
          <button
            id="help-button"
            onClick={onHelpClick}
            className="flex size-9 items-center justify-center rounded-xl text-slate-400 transition-all hover:bg-violet-50 hover:text-violet-600 hover:shadow-sm"
            aria-label="Help & guide"
            title="Help & guide"
          >
            <HelpCircle className="size-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
