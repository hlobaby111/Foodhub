import { Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import Register from './pages/Register';
import ProfileSetup from './pages/ProfileSetup';
import ApprovalStatus from './pages/ApprovalStatus';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import Menu from './pages/Menu';
import Analytics from './pages/Analytics';
import DashboardLayout from './components/DashboardLayout';
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
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/profile-setup" element={<RequireAuth><ProfileSetup /></RequireAuth>} />
      <Route path="/status" element={<RequireAuth><ApprovalStatus /></RequireAuth>} />
      <Route element={<RequireAuth><DashboardLayout /></RequireAuth>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/analytics" element={<Analytics />} />
      </Route>
    </Routes>
  );
}
