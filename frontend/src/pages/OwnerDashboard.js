import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Switch } from '../components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { toast } from 'sonner';
import {
  Store, Plus, Package, Check, ChefHat, Truck, Trash2,
  LayoutDashboard, UtensilsCrossed, ClipboardList, MapPin,
  Clock, DollarSign, Star, TrendingUp, Menu as MenuIcon, X
} from 'lucide-react';

const OwnerDashboard = () => {
  const { user } = useAuth();
  const [restaurants, setRestaurants] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showAddRestaurant, setShowAddRestaurant] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', description: '', price: '', category: '', isVegetarian: false, restaurantId: '' });
  const [newRestaurant, setNewRestaurant] = useState({ name: '', description: '', email: '', phone: '', location: '', cuisineType: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [restRes, menuRes, ordersRes] = await Promise.all([
        api.get('/api/restaurants/my'),
        api.get('/api/menu/my'),
        api.get('/api/orders/restaurant')
      ]);
      setRestaurants(restRes.data.restaurants);
      setMenuItems(menuRes.data.menuItems);
      setOrders(ordersRes.data.orders);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddRestaurant = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/restaurants', {
        ...newRestaurant,
        cuisineType: newRestaurant.cuisineType.split(',').map(c => c.trim())
      });
      toast.success('Restaurant submitted for approval');
      setShowAddRestaurant(false);
      setNewRestaurant({ name: '', description: '', email: '', phone: '', location: '', cuisineType: '' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add restaurant');
    }
  };

  const handleAddMenuItem = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/menu', { ...newItem, price: Number(newItem.price) });
      toast.success('Menu item added');
      setShowAddMenu(false);
      setNewItem({ name: '', description: '', price: '', category: '', isVegetarian: false, restaurantId: '' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add item');
    }
  };

  const handleDeleteMenuItem = async (id) => {
    if (!window.confirm('Delete this menu item?')) return;
    try {
      await api.delete(`/api/menu/${id}`);
      toast.success('Menu item deleted');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete item');
    }
  };

  const handleUpdateOrderStatus = async (orderId, status) => {
    try {
      await api.put(`/api/orders/${orderId}/status`, { status });
      toast.success('Order status updated');
      fetchData();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const approvedRestaurants = restaurants.filter(r => r.status === 'approved');
  const pendingOrders = orders.filter(o => o.orderStatus === 'placed');
  const activeOrders = orders.filter(o => ['accepted', 'preparing', 'out_for_delivery'].includes(o.orderStatus));
  const completedOrders = orders.filter(o => o.orderStatus === 'delivered');
  const totalRevenue = completedOrders.reduce((sum, o) => sum + o.totalAmount, 0);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'orders', label: 'Orders', icon: ClipboardList, badge: pendingOrders.length },
    { id: 'menu', label: 'Menu', icon: UtensilsCrossed },
    { id: 'restaurants', label: 'Restaurants', icon: Store },
  ];

  const getNextStatus = (currentStatus) => {
    const flow = { placed: 'accepted', accepted: 'preparing', preparing: 'out_for_delivery', out_for_delivery: 'delivered' };
    return flow[currentStatus] || null;
  };

  const statusLabel = { accepted: 'Accept Order', preparing: 'Start Preparing', out_for_delivery: 'Send for Delivery', delivered: 'Mark Delivered' };
  const statusColors = {
    placed: 'bg-blue-100 text-blue-800',
    accepted: 'bg-indigo-100 text-indigo-800',
    preparing: 'bg-yellow-100 text-yellow-800',
    out_for_delivery: 'bg-orange-100 text-orange-800',
    delivered: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800'
  };

  return (
    <div className="flex min-h-[calc(100vh-64px)]" data-testid="owner-dashboard">
      {/* Mobile sidebar toggle */}
      <button
        className="lg:hidden fixed bottom-4 right-4 z-50 bg-primary text-primary-foreground w-12 h-12 rounded-full shadow-lg flex items-center justify-center"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        data-testid="sidebar-toggle"
      >
        {sidebarOpen ? <X className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
      </button>

      {/* Sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/40 z-30" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:sticky top-16 z-40 lg:z-auto h-[calc(100vh-64px)] w-64 bg-white border-r border-border/50 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-5">
          <div className="mb-6">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Dashboard</p>
            <h2 className="font-heading font-semibold text-lg truncate">{user?.name}</h2>
          </div>
          <nav className="space-y-1">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => { setActiveTab(tab.id); setSidebarOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                    activeTab === tab.id ? 'bg-primary/10 text-primary font-medium' : 'text-foreground/70 hover:bg-muted'
                  }`}
                  data-testid={`sidebar-${tab.id}`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{tab.label}</span>
                  {tab.badge > 0 && (
                    <span className="ml-auto bg-primary text-primary-foreground text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0">

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6" data-testid="overview-tab">
            <h1 className="text-xl sm:text-2xl font-heading font-semibold">Overview</h1>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white rounded-xl border border-border/50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center"><Package className="w-4 h-4 text-blue-600" /></div>
                  <span className="text-xs text-muted-foreground">Pending</span>
                </div>
                <p className="text-2xl font-heading font-semibold" data-testid="stat-pending">{pendingOrders.length}</p>
              </div>
              <div className="bg-white rounded-xl border border-border/50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center"><Truck className="w-4 h-4 text-orange-600" /></div>
                  <span className="text-xs text-muted-foreground">Active</span>
                </div>
                <p className="text-2xl font-heading font-semibold" data-testid="stat-active">{activeOrders.length}</p>
              </div>
              <div className="bg-white rounded-xl border border-border/50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center"><Check className="w-4 h-4 text-green-600" /></div>
                  <span className="text-xs text-muted-foreground">Delivered</span>
                </div>
                <p className="text-2xl font-heading font-semibold" data-testid="stat-delivered">{completedOrders.length}</p>
              </div>
              <div className="bg-white rounded-xl border border-border/50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center"><DollarSign className="w-4 h-4 text-amber-600" /></div>
                  <span className="text-xs text-muted-foreground">Revenue</span>
                </div>
                <p className="text-2xl font-heading font-semibold" data-testid="stat-revenue">&#8377;{totalRevenue}</p>
              </div>
            </div>

            {/* Recent pending orders */}
            {pendingOrders.length > 0 && (
              <div className="bg-accent/50 rounded-2xl p-4 sm:p-5">
                <h3 className="font-heading font-medium mb-3 flex items-center gap-2 text-sm sm:text-base">
                  <Clock className="w-4 h-4 text-primary" /> New Orders ({pendingOrders.length})
                </h3>
                <div className="space-y-3">
                  {pendingOrders.slice(0, 3).map(order => (
                    <div key={order._id} className="bg-white rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3" data-testid={`pending-order-${order._id}`}>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">#{order.orderNumber}</p>
                        <p className="text-xs text-muted-foreground truncate">{order.items?.map(i => `${i.name} x${i.quantity}`).join(', ')}</p>
                        <p className="font-semibold text-sm mt-1">&#8377;{order.totalAmount}</p>
                      </div>
                      <Button size="sm" className="rounded-full" onClick={() => handleUpdateOrderStatus(order._id, 'accepted')} data-testid={`accept-order-${order._id}`}>
                        <Check className="w-3 h-3 mr-1" /> Accept
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white rounded-xl border border-border/50 p-5">
                <h3 className="text-sm text-muted-foreground mb-2">Restaurants</h3>
                <p className="text-3xl font-heading font-semibold">{restaurants.length}</p>
                <p className="text-xs text-muted-foreground mt-1">{approvedRestaurants.length} approved</p>
              </div>
              <div className="bg-white rounded-xl border border-border/50 p-5">
                <h3 className="text-sm text-muted-foreground mb-2">Menu Items</h3>
                <p className="text-3xl font-heading font-semibold">{menuItems.length}</p>
                <p className="text-xs text-muted-foreground mt-1">across {approvedRestaurants.length} restaurants</p>
              </div>
            </div>
          </div>
        )}

        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-6" data-testid="orders-tab">
            <h1 className="text-xl sm:text-2xl font-heading font-semibold">Order Management</h1>

            {orders.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Package className="w-14 h-14 mx-auto mb-3 opacity-30" />
                <p className="text-lg">No orders yet</p>
                <p className="text-sm mt-1">Orders from customers will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map(order => {
                  const nextStatus = getNextStatus(order.orderStatus);
                  return (
                    <div key={order._id} className="bg-white rounded-xl border border-border/50 p-4 sm:p-5" data-testid={`owner-order-${order._id}`}>
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-sm">#{order.orderNumber}</p>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${statusColors[order.orderStatus]}`}>
                              {order.orderStatus?.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {order.customer?.name} &middot; {order.customer?.phone}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(order.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="font-semibold">&#8377;{order.totalAmount}</span>
                          <Badge variant="secondary" className="text-[10px] rounded-full capitalize">{order.paymentMethod === 'cash' ? 'COD' : 'Online'}</Badge>
                        </div>
                      </div>

                      <div className="bg-muted/50 rounded-lg p-3 mb-3">
                        <p className="text-xs font-medium text-muted-foreground mb-1">Items</p>
                        {order.items?.map((i, idx) => (
                          <p key={idx} className="text-sm">{i.name} <span className="text-muted-foreground">x{i.quantity}</span> <span className="text-muted-foreground ml-1">&#8377;{i.price * i.quantity}</span></p>
                        ))}
                      </div>

                      {order.deliveryAddress && (
                        <div className="text-xs text-muted-foreground mb-3 flex items-start gap-1">
                          <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          <span>{order.deliveryAddress.street}, {order.deliveryAddress.city} {order.deliveryAddress.pincode}</span>
                        </div>
                      )}

                      {nextStatus && (
                        <Button
                          size="sm"
                          className="rounded-full w-full sm:w-auto"
                          onClick={() => handleUpdateOrderStatus(order._id, nextStatus)}
                          data-testid={`update-status-${order._id}`}
                        >
                          {statusLabel[nextStatus]}
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Menu Tab */}
        {activeTab === 'menu' && (
          <div className="space-y-6" data-testid="menu-tab">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h1 className="text-xl sm:text-2xl font-heading font-semibold">Menu Management</h1>
              <Dialog open={showAddMenu} onOpenChange={setShowAddMenu}>
                <DialogTrigger asChild>
                  <Button className="rounded-full" data-testid="add-menu-item-button">
                    <Plus className="w-4 h-4 mr-1" /> Add Item
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Add Menu Item</DialogTitle></DialogHeader>
                  <form onSubmit={handleAddMenuItem} className="space-y-4">
                    <div>
                      <Label>Restaurant</Label>
                      <Select value={newItem.restaurantId} onValueChange={(v) => setNewItem({ ...newItem, restaurantId: v })}>
                        <SelectTrigger className="mt-1" data-testid="select-restaurant">
                          <SelectValue placeholder="Select restaurant" />
                        </SelectTrigger>
                        <SelectContent>
                          {approvedRestaurants.map(r => (
                            <SelectItem key={r._id} value={r._id}>{r.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label>Name</Label><Input value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} className="mt-1" required data-testid="menu-item-name" /></div>
                    <div><Label>Description</Label><Input value={newItem.description} onChange={(e) => setNewItem({ ...newItem, description: e.target.value })} className="mt-1" required data-testid="menu-item-desc" /></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><Label>Price (&#8377;)</Label><Input type="number" value={newItem.price} onChange={(e) => setNewItem({ ...newItem, price: e.target.value })} className="mt-1" required data-testid="menu-item-price" /></div>
                      <div><Label>Category</Label><Input value={newItem.category} onChange={(e) => setNewItem({ ...newItem, category: e.target.value })} className="mt-1" required data-testid="menu-item-category" /></div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={newItem.isVegetarian} onCheckedChange={(v) => setNewItem({ ...newItem, isVegetarian: v })} data-testid="menu-item-veg" />
                      <Label>Vegetarian</Label>
                    </div>
                    <Button type="submit" className="w-full rounded-full" data-testid="submit-menu-item">Add Item</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {menuItems.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <UtensilsCrossed className="w-14 h-14 mx-auto mb-3 opacity-30" />
                <p className="text-lg">No menu items yet</p>
                <p className="text-sm mt-1">Add items to start taking orders</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" data-testid="menu-items-list">
                {menuItems.map(item => (
                  <div key={item._id} className="bg-white rounded-xl border border-border/50 p-3 sm:p-4 flex gap-3" data-testid={`menu-manage-${item._id}`}>
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden flex-shrink-0 bg-muted">
                      <img src={item.image?.url || 'https://images.unsplash.com/photo-1617686578451-46fa5f114c9d?w=200&h=200&fit=crop'} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        {item.isVegetarian && <span className="w-3 h-3 border border-green-600 rounded-sm flex items-center justify-center flex-shrink-0"><span className="w-1.5 h-1.5 bg-green-600 rounded-full" /></span>}
                        <h3 className="font-medium text-sm truncate">{item.name}</h3>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{item.restaurant?.name} &middot; {item.category}</p>
                      <p className="font-semibold text-sm mt-1">&#8377;{item.price}</p>
                    </div>
                    <Button size="icon" variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 flex-shrink-0" onClick={() => handleDeleteMenuItem(item._id)} data-testid={`delete-menu-${item._id}`}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Restaurants Tab */}
        {activeTab === 'restaurants' && (
          <div className="space-y-6" data-testid="restaurants-tab">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h1 className="text-xl sm:text-2xl font-heading font-semibold">My Restaurants</h1>
              <Dialog open={showAddRestaurant} onOpenChange={setShowAddRestaurant}>
                <DialogTrigger asChild>
                  <Button className="rounded-full" data-testid="add-restaurant-button">
                    <Plus className="w-4 h-4 mr-1" /> Add Restaurant
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <DialogHeader><DialogTitle>Register Restaurant</DialogTitle></DialogHeader>
                  <form onSubmit={handleAddRestaurant} className="space-y-4">
                    <div><Label>Restaurant Name</Label><Input value={newRestaurant.name} onChange={(e) => setNewRestaurant({ ...newRestaurant, name: e.target.value })} className="mt-1" required data-testid="restaurant-name-input" /></div>
                    <div><Label>Description</Label><Input value={newRestaurant.description} onChange={(e) => setNewRestaurant({ ...newRestaurant, description: e.target.value })} className="mt-1" required data-testid="restaurant-desc-input" /></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div><Label>Email</Label><Input type="email" value={newRestaurant.email} onChange={(e) => setNewRestaurant({ ...newRestaurant, email: e.target.value })} className="mt-1" required data-testid="restaurant-email-input" /></div>
                      <div><Label>Phone</Label><Input value={newRestaurant.phone} onChange={(e) => setNewRestaurant({ ...newRestaurant, phone: e.target.value })} className="mt-1" required data-testid="restaurant-phone-input" /></div>
                    </div>
                    <div><Label>Location</Label><Input value={newRestaurant.location} onChange={(e) => setNewRestaurant({ ...newRestaurant, location: e.target.value })} placeholder="e.g. Bandra, Mumbai" className="mt-1" required data-testid="restaurant-location-input" /></div>
                    <div><Label>Cuisine Types (comma separated)</Label><Input value={newRestaurant.cuisineType} onChange={(e) => setNewRestaurant({ ...newRestaurant, cuisineType: e.target.value })} placeholder="Indian, Chinese, Italian" className="mt-1" required data-testid="restaurant-cuisine-input" /></div>
                    <Button type="submit" className="w-full rounded-full" data-testid="submit-restaurant">Submit for Approval</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            {restaurants.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Store className="w-14 h-14 mx-auto mb-3 opacity-30" />
                <p className="text-lg">No restaurants yet</p>
                <p className="text-sm mt-1">Register your first restaurant to start</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" data-testid="restaurants-list">
                {restaurants.map(r => (
                  <div key={r._id} className="bg-white rounded-xl border border-border/50 p-5" data-testid={`restaurant-manage-${r._id}`}>
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-heading font-medium">{r.name}</h3>
                      <Badge variant={r.status === 'approved' ? 'default' : r.status === 'pending' ? 'secondary' : 'destructive'} className="rounded-full capitalize text-[11px]">{r.status}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{r.description}</p>
                    <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {r.location}</span>
                      <span className="flex items-center gap-1"><Star className="w-3 h-3" /> {r.rating?.toFixed(1) || '0.0'}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {r.cuisineType?.map((c, i) => (
                        <span key={i} className="text-[10px] bg-muted px-2 py-0.5 rounded-full">{c}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default OwnerDashboard;
