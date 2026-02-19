import { Link, NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Truck,
  CalendarRange,
  Users,
  FileText,
  Receipt,
  Settings,
  Shield,
  Search,
  BriefcaseBusiness,
  Building2,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  BookOpen,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useUiStore } from '../../store/uiStore';
import { cn } from '../../lib/utils';

const mainNav = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'text-blue-400',   activeBg: 'bg-blue-500/20',   activeText: 'text-blue-200',   glow: 'rgba(59,130,246,0.35)' },
  { to: '/fleet',     label: 'Fleet',     icon: Truck,           color: 'text-amber-400',  activeBg: 'bg-amber-500/20',  activeText: 'text-amber-200',  glow: 'rgba(245,158,11,0.35)' },
  { to: '/bookings',  label: 'Jobs',      icon: CalendarRange,   color: 'text-violet-400', activeBg: 'bg-violet-500/20', activeText: 'text-violet-200', glow: 'rgba(139,92,246,0.35)' },
  { to: '/customers', label: 'Customers', icon: Users,           color: 'text-emerald-400',activeBg: 'bg-emerald-500/20',activeText: 'text-emerald-200',glow: 'rgba(16,185,129,0.35)' },
  { to: '/quotes',    label: 'Quotes',    icon: FileText,        color: 'text-sky-400',    activeBg: 'bg-sky-500/20',    activeText: 'text-sky-200',    glow: 'rgba(14,165,233,0.35)' },
  { to: '/invoices',  label: 'Invoices',  icon: Receipt,         color: 'text-orange-400', activeBg: 'bg-orange-500/20', activeText: 'text-orange-200', glow: 'rgba(249,115,22,0.35)' },
  { to: '/accounting',label: 'Reports',   icon: BookOpen,        color: 'text-teal-400',   activeBg: 'bg-teal-500/20',   activeText: 'text-teal-200',   glow: 'rgba(20,184,166,0.35)' },
  { to: '/settings',  label: 'Settings',  icon: Settings,        color: 'text-slate-400',  activeBg: 'bg-slate-500/20',  activeText: 'text-slate-200',  glow: 'rgba(100,116,139,0.35)' },
];

const adminNav = [
  { to: '/admin',          label: 'Admin Dashboard', icon: Shield },
  { to: '/admin/search',   label: 'Machine Search',  icon: Search },
  { to: '/admin/deals',    label: 'Deals',           icon: BriefcaseBusiness },
  { to: '/admin/companies',label: 'Companies',        icon: Building2 },
];

export function Sidebar() {
  const { profile, company, isPlatformAdmin, signOut } = useAuth();
  const { sidebarCollapsed, toggleSidebarCollapsed, sidebarOpen, setSidebarOpen } = useUiStore();

  const initials = (profile?.full_name ?? 'U')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={cn(
          'fixed inset-0 z-30 bg-slate-950/60 backdrop-blur-sm lg:hidden transition-opacity duration-300',
          sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
        onClick={() => setSidebarOpen(false)}
      />

      <aside
        id="sidebar"
        className={cn(
          'fixed left-0 top-0 z-40 flex h-full flex-col transition-all duration-300 lg:translate-x-0',
          // Glass dark sidebar
          'glass-dark border-r border-white/[0.06]',
          sidebarCollapsed ? 'lg:w-[72px]' : 'lg:w-64',
          sidebarOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64',
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-4">
          <Link
            to="/dashboard"
            className="flex items-center gap-3 overflow-hidden"
            onClick={() => setSidebarOpen(false)}
          >
            {/* Brand logo — gradient orb */}
            <div
              className="flex size-9 shrink-0 items-center justify-center rounded-xl font-black text-white text-sm shadow-lg animate-glow-pulse"
              style={{
                background: 'linear-gradient(135deg, #c084fc 0%, #818cf8 50%, #38bdf8 100%)',
                boxShadow: '0 0 20px rgba(192,132,252,0.4), 0 4px 16px rgba(0,0,0,0.3)',
              }}
            >
              H
            </div>
            {!sidebarCollapsed ? (
              <div className="min-w-0">
                <p className="truncate text-sm font-bold tracking-tight text-white">Hasky</p>
                <p className="truncate text-[10px] text-white/40">{company?.name ?? 'Machine Hire'}</p>
              </div>
            ) : null}
          </Link>
          <button
            className="hidden shrink-0 rounded-lg p-1.5 text-white/30 transition-colors hover:bg-white/8 hover:text-white/70 lg:flex"
            onClick={toggleSidebarCollapsed}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-3" aria-label="Main navigation">
          <div className="space-y-0.5">
            {!sidebarCollapsed ? (
              <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-white/25">
                Menu
              </p>
            ) : null}
            {mainNav.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200',
                      isActive
                        ? `${item.activeBg} ${item.activeText}`
                        : 'text-white/40 hover:bg-white/[0.06] hover:text-white/80',
                      sidebarCollapsed && 'justify-center px-2',
                    )
                  }
                  style={({ isActive }) =>
                    isActive
                      ? { boxShadow: `inset 0 0 20px ${item.glow}` }
                      : {}
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        className={cn(
                          'size-5 shrink-0 transition-colors',
                          isActive ? item.color : 'text-white/30 group-hover:text-white/60',
                        )}
                      />
                      {!sidebarCollapsed ? (
                        <>
                          <span className="flex-1">{item.label}</span>
                          {isActive ? <ChevronRight className="size-3.5 opacity-50" /> : null}
                        </>
                      ) : null}
                    </>
                  )}
                </NavLink>
              );
            })}
          </div>

          {isPlatformAdmin ? (
            <div className="mt-4 border-t border-white/[0.06] pt-4">
              {!sidebarCollapsed ? (
                <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-white/25">
                  Platform Admin
                </p>
              ) : null}
              <div className="space-y-0.5">
                {adminNav.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={() => setSidebarOpen(false)}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                          isActive
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'text-white/40 hover:bg-white/[0.06] hover:text-white/80',
                          sidebarCollapsed && 'justify-center px-2',
                        )
                      }
                    >
                      <Icon className="size-[18px] shrink-0 text-emerald-500" />
                      {!sidebarCollapsed ? <span>{item.label}</span> : null}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ) : null}
        </nav>

        {/* User footer */}
        <div className="border-t border-white/[0.06] p-3">
          <div
            className={cn(
              'flex items-center gap-3 rounded-xl p-2',
              sidebarCollapsed && 'justify-center',
            )}
          >
            <div
              className="flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #818cf8, #6EE7FF)' }}
            >
              {initials}
            </div>
            {!sidebarCollapsed ? (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white/90">{profile?.full_name ?? 'User'}</p>
                <p className="truncate text-[11px] text-white/35">{company?.name ?? 'No company'}</p>
              </div>
            ) : null}
            {!sidebarCollapsed ? (
              <button
                onClick={() => void signOut()}
                className="rounded-lg p-1.5 text-white/30 transition-colors hover:bg-white/[0.06] hover:text-red-400"
                title="Sign out"
              >
                <LogOut className="size-4" />
              </button>
            ) : null}
          </div>
          {sidebarCollapsed ? (
            <button
              onClick={() => void signOut()}
              className="mt-1 flex w-full items-center justify-center rounded-xl p-2 text-white/30 transition-colors hover:bg-white/[0.06] hover:text-red-400"
              title="Sign out"
            >
              <LogOut className="size-4" />
            </button>
          ) : null}
        </div>
      </aside>
    </>
  );
}
