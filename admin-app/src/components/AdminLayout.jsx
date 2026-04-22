import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Store, Bike, Users, Package, CreditCard,
  Tag, BarChart3, Settings, Shield, AlertTriangle, LogOut, Bell, Search, ChefHat
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const nav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/restaurants', icon: Store, label: 'Restaurants' },
  { to: '/delivery-partners', icon: Bike, label: 'Delivery Partners' },
  { to: '/customers', icon: Users, label: 'Customers' },
  { to: '/orders', icon: Package, label: 'Orders' },
  { to: '/payments', icon: CreditCard, label: 'Payments & Finance' },
  { to: '/offers', icon: Tag, label: 'Offers & Discounts' },
  { to: '/reports', icon: BarChart3, label: 'Reports & Analytics' },
  { to: '/settings', icon: Settings, label: 'System Settings' },
  { to: '/roles', icon: Shield, label: 'Roles & Permissions' },
  { to: '/emergency', icon: AlertTriangle, label: 'Emergency Controls', danger: true },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const { logout } = useAuth();

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar text-gray-300 flex flex-col flex-shrink-0">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <ChefHat className="text-white" size={22} />
            </div>
            <div>
              <p className="font-bold text-white leading-tight">Foodhub</p>
              <p className="text-xs text-gray-400">Super Admin</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-white'
                    : item.danger
                    ? 'text-red-400 hover:bg-red-500/10'
                    : 'hover:bg-sidebarHover hover:text-white'
                }`
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <button
          onClick={async () => {
            await logout();
            navigate('/login');
          }}
          className="m-3 flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-sidebarHover hover:text-white"
        >
          <LogOut size={18} /> Logout
        </button>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between flex-shrink-0">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search orders, restaurants, users..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:border-primary outline-none"
            />
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 hover:bg-gray-100 rounded-lg">
              <Bell size={18} className="text-gray-700" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
              <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm">
                SA
              </div>
              <div className="leading-tight">
                <p className="text-sm font-semibold text-ink">Super Admin</p>
                <p className="text-xs text-gray-500">admin@foodhub.com</p>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
