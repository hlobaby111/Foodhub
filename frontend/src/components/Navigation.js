import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ShoppingCart, User, Store, Shield } from 'lucide-react';
import { Button } from './ui/button';

const Navigation = ({ cartItemsCount = 0 }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleUserMenuClick = () => {
    if (!user) return;

    if (user.role === 'customer') {
      navigate('/account');
      return;
    }

    if (user.role === 'restaurant_owner') {
      navigate('/owner/dashboard');
      return;
    }

    if (user.role === 'admin') {
      navigate('/admin/dashboard');
      return;
    }

    if (user.role === 'delivery_partner') {
      navigate('/delivery/dashboard');
    }
  };

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50" data-testid="main-navigation">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <Link to="/home" className="flex items-center space-x-2" data-testid="logo-link">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <Store className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-heading font-semibold">FoodHub</span>
          </Link>

          <div className="flex items-center space-x-4">
            {user ? (
              <>
                {user.role === 'customer' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="relative"
                    onClick={() => navigate('/cart')}
                    data-testid="cart-button"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    {cartItemsCount > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center" data-testid="cart-count">
                        {cartItemsCount}
                      </span>
                    )}
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="icon"
                  data-testid="user-menu-trigger"
                  onClick={handleUserMenuClick}
                >
                  {user.role === 'admin' ? <Shield className="w-5 h-5" /> : <User className="w-5 h-5" />}
                </Button>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Button 
                  className="rounded-full"
                  onClick={() => navigate('/phone-auth')}
                  data-testid="login-button"
                >
                  Get Started
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;