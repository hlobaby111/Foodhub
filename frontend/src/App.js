import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { Toaster } from './components/ui/sonner';
import Navigation from './components/Navigation';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import RestaurantDetail from './pages/RestaurantDetail';
import Cart from './pages/Cart';
import Orders from './pages/Orders';
import OrderTracking from './pages/OrderTracking';
import Profile from './pages/Profile';
import OwnerDashboard from './pages/OwnerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import DeliveryDashboard from './pages/DeliveryDashboard';
import { useCart } from './contexts/CartContext';
import { useAuth } from './contexts/AuthContext';
import { Navigate } from 'react-router-dom';

const AppContent = () => {
  const { cartCount } = useCart();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Navigation cartItemsCount={cartCount} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/restaurant/:id" element={<RestaurantDetail />} />
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
