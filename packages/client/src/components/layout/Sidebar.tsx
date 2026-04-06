import { NavLink } from 'react-router-dom';
import {
  LayoutGrid,
  ChefHat,
  Table2,
  ClipboardList,
  UtensilsCrossed,
  BarChart3,
  Settings,
  LogOut,
  type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@/types/auth';

interface NavItem {
  to: string;
  icon: LucideIcon;
  label: string;
  roles?: UserRole[];
}

const navItems: NavItem[] = [
  { to: '/', icon: LayoutGrid, label: 'POS' },
  { to: '/kitchen', icon: ChefHat, label: 'Kitchen', roles: ['admin', 'manager', 'kitchen'] },
  { to: '/tables', icon: Table2, label: 'Tables' },
  { to: '/orders', icon: ClipboardList, label: 'Orders' },
  {
    to: '/menu-management',
    icon: UtensilsCrossed,
    label: 'Menu',
    roles: ['admin', 'manager'],
  },
  { to: '/reports', icon: BarChart3, label: 'Reports', roles: ['admin', 'manager'] },
  { to: '/settings', icon: Settings, label: 'Settings', roles: ['admin'] },
];

export function Sidebar() {
  const { user, logout } = useAuth();

  const filteredItems = navItems.filter(
    (item) => !item.roles || (user && item.roles.includes(user.role))
  );

  return (
    <aside className="w-[72px] bg-[#0a1628] border-r border-[#1e3a5f] flex flex-col items-center py-4 flex-shrink-0">
      {/* Logo */}
      <div className="w-11 h-11 rounded-xl bg-saffron/20 border border-saffron/30 flex items-center justify-center mb-6">
        <span className="text-lg font-bold text-saffron">N</span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 flex flex-col items-center gap-1 w-full px-2">
        {filteredItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `
                w-full flex flex-col items-center gap-1 py-2.5 rounded-xl
                transition-all duration-200 group
                ${
                  isActive
                    ? 'bg-saffron/15 text-saffron'
                    : 'text-cream/40 hover:text-cream/70 hover:bg-white/5'
                }
              `}
            >
              <Icon size={20} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User / Logout */}
      <div className="flex flex-col items-center gap-2 pt-4 border-t border-[#1e3a5f] w-full px-2">
        {user && (
          <div className="w-9 h-9 rounded-full bg-indigo/30 flex items-center justify-center">
            <span className="text-xs font-bold text-cream">
              {user.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <button
          onClick={logout}
          className="w-full flex flex-col items-center gap-1 py-2.5 rounded-xl text-cream/30 hover:text-tandoori hover:bg-tandoori/10 transition-all"
        >
          <LogOut size={18} />
          <span className="text-[10px] font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
}
