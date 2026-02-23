import { useState, useRef, useEffect } from 'react';
import { Menu, HelpCircle, Bell, UserPlus, Play, BookOpen, Sparkles } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { notify } from '../../lib/notify';
import { useAuth } from '../../hooks/useAuth';
import { useUiStore } from '../../store/uiStore';
import { useCustomers } from '../../hooks/useCustomers';
import { Modal } from '../ui/Modal';
import { CustomerForm, type CustomerFormValues } from '../customers/CustomerForm';

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
  onTourClick?: () => void;
  onWikiClick?: () => void;
  onPageTourClick?: () => void;
}

export function TopBar({ onTourClick, onWikiClick, onPageTourClick }: TopBarProps) {
  const { pathname } = useLocation();
  const { company } = useAuth();
  const { setSidebarOpen } = useUiStore();
  const { saveCustomerMutation } = useCustomers();
  const [addCustomerOpen, setAddCustomerOpen] = useState(false);
  const [helpMenuOpen, setHelpMenuOpen] = useState(false);
  const helpMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (helpMenuRef.current && !helpMenuRef.current.contains(e.target as Node)) {
        setHelpMenuOpen(false);
      }
    };
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, []);

  const segments = pathname.split('/').filter(Boolean);
  const pageKey = segments[0] ?? 'dashboard';
  const pageTitle = PAGE_TITLES[pageKey] ?? pageKey.replace(/-/g, ' ').replace(/^\w/, (c) => c.toUpperCase());

  const breadcrumb = segments
    .map((s) => PAGE_TITLES[s] ?? s.replace(/-/g, ' ').replace(/^\w/, (c) => c.toUpperCase()))
    .join(' › ');

  const handleQuickAddCustomer = async (values: CustomerFormValues) => {
    try {
      await saveCustomerMutation.mutateAsync(values);
      notify.success(`${values.name} added as a customer`);
      setAddCustomerOpen(false);
    } catch (error) {
      notify.error(error instanceof Error ? error.message : 'Failed to add customer');
    }
  };

  return (
    <>
      <header
        data-topbar
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
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold tracking-tight text-slate-900">{pageTitle}</h1>
                {onPageTourClick ? (
                  <button
                    onClick={onPageTourClick}
                    title={`Take the ${pageTitle} tour`}
                    className="hidden items-center gap-1 rounded-full bg-violet-100 px-2.5 py-0.5 text-[11px] font-semibold text-violet-700 transition-all hover:bg-violet-200 hover:shadow-sm sm:flex"
                  >
                    <Sparkles className="size-3" />
                    Tour
                  </button>
                ) : null}
              </div>
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

            {/* Quick-add customer */}
            <button
              onClick={() => setAddCustomerOpen(true)}
              className="flex size-9 items-center justify-center rounded-xl text-slate-400 transition-all hover:bg-emerald-50 hover:text-emerald-600 hover:shadow-sm"
              aria-label="Add customer"
              title="Quick-add customer"
            >
              <UserPlus className="size-4" />
            </button>

            {/* Notifications */}
            <button
              onClick={() => notify.info('No new notifications')}
              className="relative flex size-9 items-center justify-center rounded-xl text-slate-400 transition-all hover:bg-white/80 hover:text-slate-700 hover:shadow-sm"
              aria-label="Notifications"
              title="Notifications"
            >
              <Bell className="size-4" />
            </button>

            {/* Help dropdown */}
            <div className="relative" ref={helpMenuRef}>
              <button
                id="help-button"
                onClick={() => setHelpMenuOpen((prev) => !prev)}
                className={`flex size-9 items-center justify-center rounded-xl text-slate-400 transition-all hover:bg-violet-50 hover:text-violet-600 hover:shadow-sm${helpMenuOpen ? ' bg-violet-50 text-violet-600' : ''}`}
                aria-label="Help & guide"
                title="Help & guide"
                aria-expanded={helpMenuOpen}
                aria-haspopup="true"
              >
                <HelpCircle className="size-4" />
              </button>

              {helpMenuOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-48 overflow-hidden rounded-2xl animate-scale-in z-50"
                  style={{
                    background: 'rgba(255,255,255,0.94)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.7)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.10), 0 1px 0 rgba(255,255,255,0.8)',
                  }}
                >
                  <div
                    className="h-[2px] w-full"
                    style={{ background: 'linear-gradient(90deg, #c084fc, #818cf8, #38bdf8)' }}
                  />
                  <div className="p-1.5">
                    {onPageTourClick ? (
                      <>
                        <button
                          onClick={() => { setHelpMenuOpen(false); onPageTourClick(); }}
                          className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-violet-50/80 hover:text-violet-700"
                        >
                          <Sparkles className="size-4 text-violet-500" />
                          Tour this page
                        </button>
                        <div className="mx-2 my-1 h-px bg-slate-100" />
                      </>
                    ) : null}
                    <button
                      onClick={() => { setHelpMenuOpen(false); onTourClick?.(); }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-violet-50/80 hover:text-violet-700"
                    >
                      <Play className="size-4 text-violet-500" />
                      Full App Tour
                    </button>
                    <button
                      onClick={() => { setHelpMenuOpen(false); onWikiClick?.(); }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-violet-50/80 hover:text-violet-700"
                    >
                      <BookOpen className="size-4 text-violet-500" />
                      Help Wiki
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Quick-add customer modal */}
      <Modal
        open={addCustomerOpen}
        onClose={() => setAddCustomerOpen(false)}
        title="Add Customer"
      >
        <CustomerForm
          onSubmit={(values) => { void handleQuickAddCustomer(values); }}
          loading={saveCustomerMutation.isPending}
        />
      </Modal>
    </>
  );
}
