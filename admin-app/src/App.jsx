import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './components/AdminLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Restaurants from './pages/Restaurants';
import RestaurantDashboard from './pages/RestaurantDashboard';
import DeliveryPartners from './pages/DeliveryPartners';
import Customers from './pages/Customers';
import CustomerDetail from './pages/CustomerDetail';
import Orders from './pages/Orders';
import Payments from './pages/Payments';
import Offers from './pages/Offers';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import Roles from './pages/Roles';
import EmergencyControls from './pages/EmergencyControls';
import Banners from './pages/Banners';
import AuditLogs from './pages/AuditLogs';
import { useAuth } from './contexts/AuthContext';

function RequireAuth({ children }) {
  const { isReady, isAuthenticated } = useAuth();
  if (!isReady) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-gray-500">
        Restoring session...
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<RequireAuth><AdminLayout /></RequireAuth>}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/restaurants" element={<Restaurants />} />
        <Route path="/restaurants/:id" element={<RestaurantDashboard />} />
        <Route path="/delivery-partners" element={<DeliveryPartners />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/customers/:id" element={<CustomerDetail />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/payments" element={<Payments />} />
        <Route path="/offers" element={<Offers />} />
        <Route path="/banners" element={<Banners />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/roles" element={<Roles />} />
        <Route path="/audit-logs" element={<AuditLogs />} />
        <Route path="/emergency" element={<EmergencyControls />} />
      </Route>
    </Routes>
  );
}
