import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { Toaster } from './components/ui/sonner';
import Navigation from './components/Navigation';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import AuthSplash from './pages/AuthSplash';
import PhoneAuth from './pages/PhoneAuth';
import OTPAuth from './pages/OTPAuth';
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

const AppContent = () => {
  const { cartCount } = useCart();
  const { user } = useAuth();
  const location = useLocation();
  const isAuthRoute = location.pathname.startsWith('/auth/');


  return (
    <div className="min-h-screen bg-background">
      {!isAuthRoute && <Navigation cartItemsCount={cartCount} />}
      <Routes>
        <Route path="/auth/splash" element={<AuthSplash />} />
        <Route path="/auth/phone" element={<PhoneAuth />} />
        <Route path="/auth/otp" element={<OTPAuth />} />

        <Route path="/" element={
          user ? <Home /> : <Navigate to="/auth/splash" replace />
        } />
        <Route path="/login" element={<Navigate to="/auth/phone" replace />} />
        <Route path="/register" element={<Navigate to="/auth/phone" replace />} />
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
