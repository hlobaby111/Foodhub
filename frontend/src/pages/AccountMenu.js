import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, ShoppingBag, LogOut, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';

const AccountMenu = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate('/auth/phone', { replace: true });
  };

  return (
    <div className="min-h-screen bg-background px-4 py-6" data-testid="account-menu-page">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-heading font-semibold mb-6">My Account</h1>

        <div className="bg-white border border-border rounded-2xl p-5 mb-4">
          <p className="text-base font-semibold text-foreground">{user?.name || 'FoodHub User'}</p>
          <p className="text-sm text-muted-foreground mt-1">{user?.phone || user?.email || 'No contact info'}</p>
        </div>

        <div className="bg-white border border-border rounded-2xl overflow-hidden">
          <button
            className="w-full flex items-center justify-between p-4 hover:bg-muted/40 transition-colors"
            onClick={() => navigate('/profile')}
            data-testid="account-profile-button"
          >
            <span className="flex items-center gap-3 text-sm font-medium">
              <User className="w-4 h-4" />
              Profile
            </span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>

          <div className="h-px bg-border" />

          <button
            className="w-full flex items-center justify-between p-4 hover:bg-muted/40 transition-colors"
            onClick={() => navigate('/orders')}
            data-testid="account-orders-button"
          >
            <span className="flex items-center gap-3 text-sm font-medium">
              <ShoppingBag className="w-4 h-4" />
              My Orders
            </span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>

          <div className="h-px bg-border" />

          <button
            className="w-full flex items-center justify-between p-4 hover:bg-red-50 transition-colors text-red-600"
            onClick={handleLogout}
            data-testid="account-logout-button"
          >
            <span className="flex items-center gap-3 text-sm font-medium">
              <LogOut className="w-4 h-4" />
              Logout
            </span>
            <ChevronRight className="w-4 h-4 text-red-400" />
          </button>
        </div>

        <Button className="mt-6" variant="outline" onClick={() => navigate('/')}>
          Back to Home
        </Button>
      </div>
    </div>
  );
};

export default AccountMenu;
