import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import { Users, Store, Package, DollarSign, Check, X, Ban, UserCheck } from 'lucide-react';

const StatCard = ({ title, value, icon: Icon, color }) => (
  <div className="bg-white rounded-2xl border border-border/50 p-6" data-testid={`stat-${title.toLowerCase().replace(/\s/g, '-')}`}>
    <div className="flex items-center justify-between mb-3">
      <span className="text-sm text-muted-foreground uppercase tracking-wider">{title}</span>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
    <p className="text-3xl font-heading font-semibold">{value}</p>
  </div>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [pendingRestaurants, setPendingRestaurants] = useState([]);
  const [allRestaurants, setAllRestaurants] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, usersRes, pendingRes, restRes, ordersRes] = await Promise.all([
        api.get('/api/admin/stats'),
        api.get('/api/admin/users'),
        api.get('/api/admin/restaurants/pending'),
        api.get('/api/admin/restaurants'),
        api.get('/api/admin/orders')
      ]);
      setStats(statsRes.data.stats);
      setUsers(usersRes.data.users);
      setPendingRestaurants(pendingRes.data.restaurants);
      setAllRestaurants(restRes.data.restaurants);
      setOrders(ordersRes.data.orders);
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRestaurantStatus = async (id, status) => {
    try {
      await api.put(`/api/admin/restaurants/${id}/status`, { status });
      toast.success(`Restaurant ${status}`);
      fetchData();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleToggleUser = async (id) => {
    try {
      await api.put(`/api/admin/users/${id}/toggle-status`);
      toast.success('User status updated');
      fetchData();
    } catch (error) {
      toast.error('Failed to update user');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8" data-testid="admin-dashboard">
      <h1 className="text-2xl sm:text-3xl font-heading font-semibold mb-8">Admin Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" data-testid="stats-grid">
        <StatCard title="Total Users" value={stats?.totalUsers || 0} icon={Users} color="bg-blue-50 text-blue-600" />
        <StatCard title="Restaurants" value={stats?.totalRestaurants || 0} icon={Store} color="bg-green-50 text-green-600" />
        <StatCard title="Total Orders" value={stats?.totalOrders || 0} icon={Package} color="bg-purple-50 text-purple-600" />
        <StatCard title="Revenue" value={`₹${stats?.totalRevenue || 0}`} icon={DollarSign} color="bg-amber-50 text-amber-600" />
      </div>

      {pendingRestaurants.length > 0 && (
        <div className="bg-accent rounded-2xl p-6 mb-8" data-testid="pending-restaurants">
          <h2 className="font-heading font-medium text-lg mb-4 flex items-center gap-2">
            <Store className="w-5 h-5 text-primary" />
            Pending Approvals ({pendingRestaurants.length})
          </h2>
          <div className="space-y-3">
            {pendingRestaurants.map(r => (
              <div key={r._id} className="bg-white rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4" data-testid={`pending-${r._id}`}>
                <div className="flex-1">
                  <h3 className="font-medium">{r.name}</h3>
                  <p className="text-sm text-muted-foreground">{r.description}</p>
                  <p className="text-xs text-muted-foreground mt-1">Owner: {r.owner?.name} ({r.owner?.email})</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="rounded-full bg-green-600 hover:bg-green-700" onClick={() => handleRestaurantStatus(r._id, 'approved')} data-testid={`approve-${r._id}`}>
                    <Check className="w-4 h-4 mr-1" /> Approve
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-full text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleRestaurantStatus(r._id, 'rejected')} data-testid={`reject-${r._id}`}>
                    <X className="w-4 h-4 mr-1" /> Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="bg-muted rounded-full p-1">
          <TabsTrigger value="users" className="rounded-full" data-testid="admin-tab-users">Users</TabsTrigger>
          <TabsTrigger value="restaurants" className="rounded-full" data-testid="admin-tab-restaurants">Restaurants</TabsTrigger>
          <TabsTrigger value="orders" className="rounded-full" data-testid="admin-tab-orders">Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <div className="bg-white rounded-2xl border border-border/50 overflow-hidden" data-testid="users-table">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left p-4 font-medium">Name</th>
                    <th className="text-left p-4 font-medium">Email</th>
                    <th className="text-left p-4 font-medium">Role</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-right p-4 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u._id} className="border-b border-border/50 last:border-0" data-testid={`user-row-${u._id}`}>
                      <td className="p-4">{u.name}</td>
                      <td className="p-4 text-muted-foreground">{u.email}</td>
                      <td className="p-4"><Badge variant="secondary" className="rounded-full capitalize">{u.role?.replace('_', ' ')}</Badge></td>
                      <td className="p-4">
                        <span className={`inline-flex items-center gap-1 text-xs ${u.isActive ? 'text-green-600' : 'text-red-600'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${u.isActive ? 'bg-green-600' : 'bg-red-600'}`} />
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        {u.role !== 'admin' && (
                          <Button size="sm" variant="ghost" onClick={() => handleToggleUser(u._id)} data-testid={`toggle-user-${u._id}`}>
                            {u.isActive ? <Ban className="w-4 h-4 text-red-500" /> : <UserCheck className="w-4 h-4 text-green-600" />}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="restaurants">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="admin-restaurants-list">
            {allRestaurants.map(r => (
              <div key={r._id} className="bg-white rounded-xl border border-border/50 p-5" data-testid={`admin-restaurant-${r._id}`}>
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-heading font-medium">{r.name}</h3>
                  <Badge variant={r.status === 'approved' ? 'default' : r.status === 'pending' ? 'secondary' : 'destructive'} className="rounded-full capitalize">{r.status}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{r.location}</p>
                <p className="text-xs text-muted-foreground mt-1">Owner: {r.owner?.name}</p>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="orders">
          <div className="bg-white rounded-2xl border border-border/50 overflow-hidden" data-testid="admin-orders-table">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left p-4 font-medium">Order #</th>
                    <th className="text-left p-4 font-medium">Customer</th>
                    <th className="text-left p-4 font-medium">Restaurant</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-right p-4 font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o._id} className="border-b border-border/50 last:border-0" data-testid={`admin-order-${o._id}`}>
                      <td className="p-4 font-medium">{o.orderNumber}</td>
                      <td className="p-4 text-muted-foreground">{o.customer?.name}</td>
                      <td className="p-4">{o.restaurant?.name}</td>
                      <td className="p-4"><Badge variant="secondary" className="rounded-full capitalize">{o.orderStatus?.replace('_', ' ')}</Badge></td>
                      <td className="p-4 text-right font-semibold">&#8377;{o.totalAmount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
