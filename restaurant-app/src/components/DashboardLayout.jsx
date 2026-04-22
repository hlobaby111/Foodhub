import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ClipboardList, UtensilsCrossed, BarChart3, ChefHat, LogOut, Bell, Clock, Edit } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getMyRestaurants, toggleMyRestaurantActive } from '../api/restaurant';
import { useAuth } from '../contexts/AuthContext';

export default function DashboardLayout() {
  const navigate = useNavigate();
  const [restaurantActive, setRestaurantActive] = useState(true);
  const [togglingActive, setTogglingActive] = useState(false);
  const [restaurantStatus, setRestaurantStatus] = useState('approved'); // assume approved until checked
  const { user, logout } = useAuth();

  useEffect(() => {
    getMyRestaurants()
      .then(res => {
        const r = res.data?.restaurants?.[0];
        if (!r) { navigate('/profile-setup'); return; }
        setRestaurantStatus(r.status);
        setRestaurantActive(r.isActive !== false);
        if (r.status !== 'approved') navigate('/status');
      })
      .catch(() => {});
  }, []);

  const onToggleRestaurantActive = async () => {
    setTogglingActive(true);
    try {
      const res = await toggleMyRestaurantActive();
      const updated = res.data?.restaurant;
      if (updated) {
        setRestaurantActive(updated.isActive !== false);
      }
    } catch (_) {
      // Keep UI stable, next data fetch will restore source of truth.
    } finally {
      setTogglingActive(false);
    }
  };

  const approvedNavItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/orders', icon: ClipboardList, label: 'Orders' },
    { to: '/menu', icon: UtensilsCrossed, label: 'Menu' },
    { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  ];

  const pendingNavItems = [
    { to: '/status', icon: Clock, label: 'Approval Status' },
    { to: '/profile-setup', icon: Edit, label: 'My Profile' },
  ];

  const navItems = restaurantStatus === 'approved' ? approvedNavItems : pendingNavItems;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <ChefHat className="text-white" size={22} />
            </div>
            <div>
              <p className="font-bold text-dark leading-tight">Foodhub</p>
              <p className="text-xs text-gray-500">Partner Portal</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                  isActive ? 'bg-primary-light text-primary' : 'text-gray-700 hover:bg-gray-50'
                }`
              }
            >
              <item.icon size={20} />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <button
          onClick={async () => {
            await logout();
            navigate('/login');
          }}
          className="m-4 flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut size={20} /> Logout
        </button>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-dark">Welcome back, {user.name || 'Partner'}!</h1>
            <p className="text-sm text-gray-500">Here's what's happening today</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={onToggleRestaurantActive}
              disabled={togglingActive}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
                restaurantActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${restaurantActive ? 'bg-green-500' : 'bg-gray-400'}`} />
              {togglingActive ? 'Updating...' : restaurantActive ? 'Open' : 'Closed'}
            </button>
            <button className="relative p-2 hover:bg-gray-100 rounded-lg">
              <Bell size={20} className="text-gray-700" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
            </button>
          </div>
        </header>
        <main className="flex-1 p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
