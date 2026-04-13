import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Switch } from '../components/ui/switch';
import { toast } from 'sonner';
import { MapPin, Package, Check, Truck, Clock, Navigation2, Phone, DollarSign } from 'lucide-react';

const DeliveryDashboard = () => {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState({ activeOrders: [], completedToday: 0, totalDelivered: 0, isAvailable: true });
  const [availableOrders, setAvailableOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('active');

  useEffect(() => { fetchData(); const t = setInterval(fetchData, 15000); return () => clearInterval(t); }, []);

  const fetchData = async () => {
    try {
      const [dashRes, availRes] = await Promise.all([
        api.get('/api/delivery/dashboard'),
        api.get('/api/delivery/available')
      ]);
      setDashboard(dashRes.data);
      setAvailableOrders(availRes.data.orders);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const toggleAvailability = async () => {
    try {
      const r = await api.put('/api/delivery/toggle-availability');
      setDashboard(prev => ({ ...prev, isAvailable: r.data.isAvailable }));
      toast.success(r.data.message);
    } catch (e) { toast.error('Failed'); }
  };

  const acceptOrder = async (orderId) => {
    try {
      await api.put(`/api/delivery/accept/${orderId}`);
      toast.success('Delivery accepted!');
      fetchData();
    } catch (e) { toast.error(e.response?.data?.message || 'Failed'); }
  };

  const markDelivered = async (orderId) => {
    try {
      await api.put(`/api/delivery/delivered/${orderId}`);
      toast.success('Order marked as delivered!');
      fetchData();
    } catch (e) { toast.error('Failed'); }
  };

  const updateLocation = async (orderId) => {
    if (!navigator.geolocation) { toast.error('Geolocation not supported'); return; }
    navigator.geolocation.getCurrentPosition(async (pos) => {
      try {
        await api.put(`/api/delivery/location/${orderId}`, { lat: pos.coords.latitude, lng: pos.coords.longitude });
        toast.success('Location shared');
      } catch (e) { toast.error('Failed to share location'); }
    }, () => toast.error('Location access denied'));
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" /></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6" data-testid="delivery-dashboard">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-heading font-semibold">Delivery Dashboard</h1>
          <p className="text-sm text-muted-foreground">{user?.name}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-medium ${dashboard.isAvailable ? 'text-green-600' : 'text-red-500'}`}>
            {dashboard.isAvailable ? 'Online' : 'Offline'}
          </span>
          <Switch checked={dashboard.isAvailable} onCheckedChange={toggleAvailability} data-testid="availability-toggle" />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-border/50 p-4 text-center">
          <Truck className="w-5 h-5 text-primary mx-auto mb-1" />
          <p className="text-2xl font-heading font-semibold">{dashboard.activeOrders?.length || 0}</p>
          <p className="text-[10px] text-muted-foreground">Active</p>
        </div>
        <div className="bg-white rounded-xl border border-border/50 p-4 text-center">
          <Check className="w-5 h-5 text-green-600 mx-auto mb-1" />
          <p className="text-2xl font-heading font-semibold">{dashboard.completedToday}</p>
          <p className="text-[10px] text-muted-foreground">Today</p>
        </div>
        <div className="bg-white rounded-xl border border-border/50 p-4 text-center">
          <DollarSign className="w-5 h-5 text-amber-600 mx-auto mb-1" />
          <p className="text-2xl font-heading font-semibold">{dashboard.totalDelivered}</p>
          <p className="text-[10px] text-muted-foreground">Total</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <Button variant={tab === 'active' ? 'default' : 'secondary'} size="sm" className="rounded-full text-xs" onClick={() => setTab('active')} data-testid="tab-active">
          Active ({dashboard.activeOrders?.length || 0})
        </Button>
        <Button variant={tab === 'available' ? 'default' : 'secondary'} size="sm" className="rounded-full text-xs" onClick={() => setTab('available')} data-testid="tab-available">
          Available ({availableOrders.length})
        </Button>
      </div>

      {/* Active Orders */}
      {tab === 'active' && (
        <div className="space-y-3" data-testid="active-orders">
          {dashboard.activeOrders?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground"><Package className="w-12 h-12 mx-auto mb-2 opacity-30" /><p>No active deliveries</p></div>
          ) : dashboard.activeOrders?.map(order => (
            <div key={order._id} className="bg-white rounded-xl border border-border/50 p-4" data-testid={`delivery-order-${order._id}`}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-medium text-sm">#{order.orderNumber}</p>
                  <Badge variant="secondary" className="text-[10px] rounded-full capitalize mt-1">{order.orderStatus?.replace(/_/g, ' ')}</Badge>
                </div>
                <span className="font-semibold">&#8377;{order.totalAmount}</span>
              </div>
              <div className="space-y-2 text-xs text-muted-foreground mb-3">
                <p className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-primary" /> <strong>Pickup:</strong> {order.restaurant?.name} - {order.restaurant?.location}</p>
                <p className="flex items-center gap-1.5"><Navigation2 className="w-3.5 h-3.5 text-green-600" /> <strong>Drop:</strong> {order.deliveryAddress?.street}, {order.deliveryAddress?.city}</p>
                <p className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {order.customer?.name} - {order.customer?.phone}</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="rounded-full text-xs flex-1" onClick={() => updateLocation(order._id)} data-testid={`share-location-${order._id}`}>
                  <Navigation2 className="w-3 h-3 mr-1" /> Share Location
                </Button>
                {order.orderStatus !== 'delivered' && (
                  <Button size="sm" className="rounded-full text-xs flex-1" onClick={() => markDelivered(order._id)} data-testid={`mark-delivered-${order._id}`}>
                    <Check className="w-3 h-3 mr-1" /> Delivered
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Available Orders */}
      {tab === 'available' && (
        <div className="space-y-3" data-testid="available-orders">
          {availableOrders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground"><Package className="w-12 h-12 mx-auto mb-2 opacity-30" /><p>No orders available for pickup</p></div>
          ) : availableOrders.map(order => (
            <div key={order._id} className="bg-white rounded-xl border border-border/50 p-4" data-testid={`available-order-${order._id}`}>
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium text-sm">#{order.orderNumber}</p>
                <span className="font-semibold">&#8377;{order.totalAmount}</span>
              </div>
              <div className="space-y-1.5 text-xs text-muted-foreground mb-3">
                <p><strong>Pickup:</strong> {order.restaurant?.name} - {order.restaurant?.location}</p>
                <p><strong>Drop:</strong> {order.deliveryAddress?.street}, {order.deliveryAddress?.city}</p>
              </div>
              <Button size="sm" className="rounded-full text-xs w-full" onClick={() => acceptOrder(order._id)} data-testid={`accept-delivery-${order._id}`}>
                Accept Delivery
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DeliveryDashboard;
