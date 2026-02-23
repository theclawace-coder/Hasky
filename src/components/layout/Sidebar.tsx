import { useEffect, useCallback, useState } from 'react';
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
  LifeBuoy,
  Volume2,
  VolumeOff,
} from 'lucide-react';
import { notify } from '../../lib/notify';
import { sounds } from '../../lib/sounds';
import { useAuth } from '../../hooks/useAuth';
import { useUiStore } from '../../store/uiStore';
import { cn } from '../../lib/utils';
import { LogoMark } from '../ui/Logo';

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

interface SidebarProps {
  onHelpClick: () => void;
}

function SoundToggle({ collapsed }: { collapsed: boolean }) {
  const [muted, setMuted] = useState(sounds.isMuted());

  const handleToggle = () => {
    const next = sounds.toggleMute();
    setMuted(next);
    if (!next) sounds.click();
  };

  return (
    <button
      onClick={handleToggle}
      className={cn(
        'group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200',
        'text-white/40 hover:bg-white/[0.06] hover:text-white/80',
        collapsed && 'justify-center px-2',
      )}
      title={muted ? 'Unmute sounds' : 'Mute sounds'}
    >
      {muted ? (
        <VolumeOff className="size-5 shrink-0 text-white/30 transition-colors group-hover:text-white/60" />
      ) : (
        <Volume2 className="size-5 shrink-0 text-white/30 transition-colors group-hover:text-white/60" />
      )}
      {!collapsed ? <span className="flex-1">{muted ? 'Sounds Off' : 'Sounds On'}</span> : null}
    </button>
  );
}

export function Sidebar({ onHelpClick }: SidebarProps) {
  const { profile, company, isPlatformAdmin, signOut } = useAuth();
  const { sidebarCollapsed, toggleSidebarCollapsed, sidebarOpen, setSidebarOpen } = useUiStore();

  const rawName = (profile?.full_name ?? '').trim();
  const initials = rawName
    ? rawName.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
    } catch {
      notify.error('Sign out failed — please try again');
    }
  }, [signOut]);

  // Close sidebar on Escape key (mobile)
  useEffect(() => {
    if (!sidebarOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSidebarOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [sidebarOpen, setSidebarOpen]);

  return (
    <>
      {/* Mobile overlay */}
      <div
        role="presentation"
        aria-hidden="true"
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
          !sidebarOpen && 'max-lg:hidden',
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-4">
          <Link
            to="/dashboard"
            className="flex items-center gap-3 overflow-hidden"
            onClick={() => setSidebarOpen(false)}
          >
            {/* Brand logo */}
            <LogoMark
              size={36}
              className="shrink-0 animate-glow-pulse"
              style={{ filter: 'drop-shadow(0 0 14px rgba(192,132,252,0.45)) drop-shadow(0 4px 8px rgba(0,0,0,0.3))' }}
            />
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
                  aria-label={item.label}
                  className={({ isActive }) =>
                    cn(
                      'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200',
                      isActive
                        ? `${item.activeBg} ${item.activeText} sidebar-glow-breathe`
                        : 'text-white/40 hover:bg-white/[0.06] hover:text-white/80',
                      sidebarCollapsed && 'justify-center px-2',
                    )
                  }
                  style={({ isActive }) =>
                    isActive
                      ? { '--glow-color': item.glow } as React.CSSProperties
                      : {}
                  }
                >
                  {({ isActive }) => (
                    <>
                      {/* Breathing indicator dot */}
                      {isActive && (
                        <span
                          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 size-1.5 rounded-full animate-dot-breathe"
                          style={{ backgroundColor: item.glow.replace('0.35', '1') }}
                        />
                      )}
                      <Icon
                        aria-hidden="true"
                        className={cn(
                          'size-5 shrink-0 transition-colors',
                          isActive ? item.color : 'text-white/30 group-hover:text-white/60',
                        )}
                      />
                      {!sidebarCollapsed ? (
                        <>
                          <span className="flex-1">{item.label}</span>
                          {isActive ? <ChevronRight aria-hidden="true" className="size-3.5 opacity-50" /> : null}
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

        {/* Help + Sound toggle */}
        <div className="border-t border-white/[0.06] px-3 pt-2 pb-1 space-y-0.5">
          <button
            onClick={() => { setSidebarOpen(false); onHelpClick(); }}
            className={cn(
              'group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200',
              'text-white/40 hover:bg-white/[0.06] hover:text-white/80',
              sidebarCollapsed && 'justify-center px-2',
            )}
            title="Help Center"
          >
            <LifeBuoy className="size-5 shrink-0 text-white/30 transition-colors group-hover:text-white/60" />
            {!sidebarCollapsed ? <span className="flex-1">Help</span> : null}
          </button>
          <SoundToggle collapsed={sidebarCollapsed} />
        </div>

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
                data-testid="logout-button"
                onClick={() => void handleSignOut()}
                className="rounded-lg p-1.5 text-white/30 transition-colors hover:bg-white/[0.06] hover:text-red-400"
                title="Sign out"
                aria-label="Sign out"
              >
                <LogOut aria-hidden="true" className="size-4" />
              </button>
            ) : null}
          </div>
          {sidebarCollapsed ? (
            <button
              data-testid="logout-button"
              onClick={() => void handleSignOut()}
              className="mt-1 flex w-full items-center justify-center rounded-xl p-2 text-white/30 transition-colors hover:bg-white/[0.06] hover:text-red-400"
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut aria-hidden="true" className="size-4" />
            </button>
          ) : null}
        </div>
      </aside>
    </>
  );
}
