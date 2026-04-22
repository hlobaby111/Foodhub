import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { Toaster } from './components/ui/sonner';
import Navigation from './components/Navigation';
import Home from './pages/Home';
import SplashScreen from './pages/SplashScreen';
import PhoneAuth from './pages/PhoneAuth';
import OTPVerification from './pages/OTPVerification';
import RestaurantDetail from './pages/RestaurantDetail';
import Cart from './pages/Cart';
import Orders from './pages/Orders';
import OrderTracking from './pages/OrderTracking';
import Profile from './pages/Profile';
import AccountMenu from './pages/AccountMenu';
import OwnerDashboard from './pages/OwnerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import DeliveryDashboard from './pages/DeliveryDashboard';
import { useCart } from './contexts/CartContext';
import { useAuth } from './contexts/AuthContext';

const RouteLoader = () => (
  <div className="flex items-center justify-center min-h-screen" data-testid="loading-state">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) return <RouteLoader />;
  if (!user) return <Navigate to="/phone-auth" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/home" replace />;

  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <RouteLoader />;
  if (user) return <Navigate to="/home" replace />;

  return children;
};

const AppContent = () => {
  const { cartCount } = useCart();
  const location = useLocation();
  const isAuthRoute = ['/', '/phone-auth', '/verify-otp'].includes(location.pathname);


  return (
    <div className="min-h-screen bg-background">
      {!isAuthRoute && <Navigation cartItemsCount={cartCount} />}
      <Routes>
        <Route path="/" element={<SplashScreen />} />
        <Route
          path="/phone-auth"
          element={
            <PublicRoute>
              <PhoneAuth />
            </PublicRoute>
          }
        />
        <Route
          path="/verify-otp"
          element={
            <PublicRoute>
              <OTPVerification />
            </PublicRoute>
          }
        />

        <Route
          path="/home"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<Navigate to="/phone-auth" replace />} />
        <Route path="/register" element={<Navigate to="/phone-auth" replace />} />
        <Route path="/auth/splash" element={<Navigate to="/" replace />} />
        <Route path="/auth/phone" element={<Navigate to="/phone-auth" replace />} />
        <Route path="/auth/otp" element={<Navigate to="/verify-otp" replace />} />
        <Route path="/restaurant/:id" element={
          <ProtectedRoute allowedRoles={['customer']}>
            <RestaurantDetail />
          </ProtectedRoute>
        } />
        <Route path="/cart" element={
          <ProtectedRoute allowedRoles={['customer']}>
            <Cart />
          </ProtectedRoute>
        } />
        <Route path="/checkout" element={<Navigate to="/cart" replace />} />
        <Route path="/orders" element={
          <ProtectedRoute allowedRoles={['customer']}>
            <Orders />
          </ProtectedRoute>
        } />
        <Route path="/track/:id" element={
          <ProtectedRoute allowedRoles={['customer']}>
            <OrderTracking />
          </ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />
        <Route path="/account" element={
          <ProtectedRoute allowedRoles={['customer']}>
            <AccountMenu />
          </ProtectedRoute>
        } />
        <Route path="/owner/dashboard" element={
          <ProtectedRoute allowedRoles={['restaurant_owner']}>
            <OwnerDashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin/dashboard" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />
        <Route path="/delivery/dashboard" element={
          <ProtectedRoute allowedRoles={['delivery_partner']}>
            <DeliveryDashboard />
          </ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster position="bottom-right" />
    </div>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <AppContent />
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
