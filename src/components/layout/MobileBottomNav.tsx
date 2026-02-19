import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Truck, CalendarRange, FileText, Receipt } from 'lucide-react';
import { cn } from '../../lib/utils';

const mobileNav = [
  { to: '/dashboard', label: 'Home',     icon: LayoutDashboard, activeColor: 'text-blue-600',   activeBg: 'bg-blue-100/80',   glow: 'rgba(59,130,246,0.25)'  },
  { to: '/fleet',     label: 'Fleet',    icon: Truck,           activeColor: 'text-amber-600',  activeBg: 'bg-amber-100/80',  glow: 'rgba(245,158,11,0.25)'  },
  { to: '/bookings',  label: 'Jobs',     icon: CalendarRange,   activeColor: 'text-violet-600', activeBg: 'bg-violet-100/80', glow: 'rgba(139,92,246,0.25)'  },
  { to: '/quotes',    label: 'Quotes',   icon: FileText,        activeColor: 'text-sky-600',    activeBg: 'bg-sky-100/80',    glow: 'rgba(14,165,233,0.25)'  },
  { to: '/invoices',  label: 'Invoices', icon: Receipt,         activeColor: 'text-orange-600', activeBg: 'bg-orange-100/80', glow: 'rgba(249,115,22,0.25)'  },
];

export function MobileBottomNav() {
  return (
    <nav
      className="mobile-bottom-nav fixed bottom-0 left-0 right-0 z-30 border-t lg:hidden"
      style={{
        background: 'rgba(255, 255, 255, 0.88)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderColor: 'rgba(255, 255, 255, 0.6)',
        boxShadow: '0 -1px 0 rgba(0,0,0,0.04), 0 -8px 24px rgba(0,0,0,0.06)',
      }}
    >
      <div className="flex items-center justify-around px-1 py-1">
        {mobileNav.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center gap-0.5 rounded-xl px-2 py-1.5 transition-all duration-200',
                  isActive ? item.activeColor : 'text-slate-400',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div
                    className={cn(
                      'flex size-10 items-center justify-center rounded-xl transition-all duration-200',
                      isActive ? item.activeBg : '',
                    )}
                    style={isActive ? { boxShadow: `0 0 12px ${item.glow}` } : {}}
                  >
                    <Icon className="size-5" />
                  </div>
                  <span className="text-[10px] font-semibold leading-none">{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
