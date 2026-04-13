import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ShoppingCart, User, LogOut, Store, Shield } from 'lucide-react';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

const Navigation = ({ cartItemsCount = 0 }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50" data-testid="main-navigation">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2" data-testid="logo-link">
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

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" data-testid="user-menu-trigger">
                      {user.role === 'admin' ? <Shield className="w-5 h-5" /> : <User className="w-5 h-5" />}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <div className="px-2 py-1.5">
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    
                    {user.role === 'customer' && (
                      <>
                        <DropdownMenuItem onClick={() => navigate('/profile')} data-testid="profile-menu-item">
                          <User className="w-4 h-4 mr-2" />
                          Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate('/orders')} data-testid="orders-menu-item">
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          My Orders
                        </DropdownMenuItem>
                      </>
                    )}
                    
                    {user.role === 'restaurant_owner' && (
                      <DropdownMenuItem onClick={() => navigate('/owner/dashboard')} data-testid="dashboard-menu-item">
                        <Store className="w-4 h-4 mr-2" />
                        Dashboard
                      </DropdownMenuItem>
                    )}
                    
                    {user.role === 'admin' && (
                      <DropdownMenuItem onClick={() => navigate('/admin/dashboard')} data-testid="admin-dashboard-menu-item">
                        <Shield className="w-4 h-4 mr-2" />
                        Admin Panel
                      </DropdownMenuItem>
                    )}
                    
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} data-testid="logout-menu-item">
                      <LogOut className="w-4 h-4 mr-2" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Button 
                  variant="ghost" 
                  onClick={() => navigate('/login')}
                  data-testid="login-button"
                >
                  Login
                </Button>
                <Button 
                  className="rounded-full" 
                  onClick={() => navigate('/register')}
                  data-testid="register-button"
                >
                  Sign Up
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