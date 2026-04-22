import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Clock, MapPin, DollarSign, TrendingUp, Power, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isOnline, setIsOnline] = useState(false);
  const [availableOrders, setAvailableOrders] = useState([]);
  const [activeDelivery, setActiveDelivery] = useState(null);
  const [stats, setStats] = useState({
    todayEarnings: 420,
    todayDeliveries: 12,
    totalDeliveries: 156,
    rating: 4.8
  });

  useEffect(() => {
    if (!user) navigate('/login');
    // Mock data - replace with API calls
    fetchAvailableOrders();
  }, [user, navigate]);

  const fetchAvailableOrders = () => {
    // Mock orders - replace with actual API call
    setAvailableOrders([
      {
        id: 'ORD001',
        restaurant: 'Tandoori Express',
        distance: 2.3,
        payment: 45,
        pickupAddress: '123 MG Road',
        deliveryAddress: '456 Park Street',
        items: 3
      },
      {
        id: 'ORD002',
        restaurant: 'Pizza Hub',
        distance: 1.5,
        payment: 38,
        pickupAddress: '789 Brigade Road',
        deliveryAddress: '321 Church Street',
        items: 2
      }
    ]);
  };

  const handleToggleOnline = () => {
    setIsOnline(!isOnline);
    // API call to update status
  };

  const handleAcceptOrder = (order) => {
    setActiveDelivery(order);
    navigate('/active-delivery');
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-green-600 text-white p-4 shadow-lg">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              {user?.name?.charAt(0).toUpperCase() || 'D'}
            </div>
            <div>
              <h2 className="font-bold">{user?.name || 'Delivery Partner'}</h2>
              <p className="text-sm opacity-90">ID: {user?.id || 'DP12345'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => navigate('/profile')} className="p-2 hover:bg-white/10 rounded-lg">
              <Settings size={20} />
            </button>
            <button onClick={handleLogout} className="p-2 hover:bg-white/10 rounded-lg">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 space-y-6">
        {/* Online/Offline Toggle */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-xl text-gray-900">Status</h3>
              <p className="text-sm text-gray-500">
                {isOnline ? 'You are online and receiving orders' : 'Go online to start receiving orders'}
              </p>
            </div>
            <button
              onClick={handleToggleOnline}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all ${
                isOnline
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <Power size={18} />
              {isOnline ? 'Online' : 'Go Online'}
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-md p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign className="text-green-600" size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-500">Today's Earnings</p>
                <p className="text-xl font-bold text-gray-900">₹{stats.todayEarnings}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Package className="text-blue-600" size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-500">Today's Deliveries</p>
                <p className="text-xl font-bold text-gray-900">{stats.todayDeliveries}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="text-purple-600" size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-500">Total Deliveries</p>
                <p className="text-xl font-bold text-gray-900">{stats.totalDeliveries}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-md p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <span className="text-yellow-600 text-xl">⭐</span>
              </div>
              <div>
                <p className="text-xs text-gray-500">Rating</p>
                <p className="text-xl font-bold text-gray-900">{stats.rating}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Available Orders */}
        {isOnline && (
          <div className="bg-white rounded-2xl shadow-md p-6">
            <h3 className="font-bold text-xl text-gray-900 mb-4">Available Orders</h3>
            {availableOrders.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Package size={48} className="mx-auto mb-3 opacity-50" />
                <p>No orders available right now</p>
                <p className="text-sm">New orders will appear here automatically</p>
              </div>
            ) : (
              <div className="space-y-4">
                {availableOrders.map((order) => (
                  <div key={order.id} className="border-2 border-gray-200 rounded-xl p-4 hover:border-green-500 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-bold text-gray-900">{order.restaurant}</h4>
                        <p className="text-sm text-gray-500">{order.items} items • {order.distance} km</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">₹{order.payment}</p>
                        <p className="text-xs text-gray-500">Earnings</p>
                      </div>
                    </div>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium">Pickup</p>
                          <p className="text-gray-600">{order.pickupAddress}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium">Delivery</p>
                          <p className="text-gray-600">{order.deliveryAddress}</p>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleAcceptOrder(order)}
                      className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Clock size={18} />
                      Accept Order
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => navigate('/earnings')}
            className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow text-left"
          >
            <DollarSign className="text-green-600 mb-2" size={24} />
            <h4 className="font-bold text-gray-900">View Earnings</h4>
            <p className="text-sm text-gray-500">Track your income</p>
          </button>
          <button
            onClick={() => navigate('/profile')}
            className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow text-left"
          >
            <Settings className="text-blue-600 mb-2" size={24} />
            <h4 className="font-bold text-gray-900">Profile</h4>
            <p className="text-sm text-gray-500">Manage your account</p>
          </button>
        </div>
      </div>
    </div>
  );
}
