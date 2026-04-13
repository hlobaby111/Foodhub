import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Switch } from '../components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { toast } from 'sonner';
import { Store, Plus, Clock, Package, Check, ChefHat, Truck, Pencil, Trash2 } from 'lucide-react';

const OwnerDashboard = () => {
  const { user } = useAuth();
  const [restaurants, setRestaurants] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showAddRestaurant, setShowAddRestaurant] = useState(false);
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

  const statusOptions = [
    { value: 'accepted', label: 'Accept' },
    { value: 'preparing', label: 'Preparing' },
    { value: 'out_for_delivery', label: 'Out for Delivery' },
    { value: 'delivered', label: 'Delivered' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-6 py-8" data-testid="owner-dashboard">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-heading font-semibold">Restaurant Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back, {user?.name}</p>
        </div>
      </div>

      <Tabs defaultValue="orders" className="space-y-6">
        <TabsList className="bg-muted rounded-full p-1">
          <TabsTrigger value="orders" className="rounded-full" data-testid="tab-orders">Orders</TabsTrigger>
          <TabsTrigger value="menu" className="rounded-full" data-testid="tab-menu">Menu</TabsTrigger>
          <TabsTrigger value="restaurants" className="rounded-full" data-testid="tab-restaurants">Restaurants</TabsTrigger>
        </TabsList>

        {/* Orders Tab */}
        <TabsContent value="orders">
          <div className="space-y-4" data-testid="orders-list">
            {orders.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p>No orders yet</p>
              </div>
            ) : (
              orders.map(order => (
                <div key={order._id} className="bg-white rounded-xl border border-border/50 p-5" data-testid={`owner-order-${order._id}`}>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                    <div>
                      <p className="text-xs text-muted-foreground">#{order.orderNumber}</p>
                      <p className="font-medium">{order.customer?.name} &middot; {order.customer?.phone}</p>
                    </div>
                    <Badge variant="secondary" className="rounded-full capitalize">{order.orderStatus?.replace('_', ' ')}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground mb-3">
                    {order.items?.map(i => `${i.name} x${i.quantity}`).join(', ')}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">&#8377;{order.totalAmount}</span>
                    {order.orderStatus !== 'delivered' && order.orderStatus !== 'cancelled' && (
                      <div className="flex gap-2">
                        {statusOptions
                          .filter(s => {
                            const order_idx = ['placed', 'accepted', 'preparing', 'out_for_delivery', 'delivered'].indexOf(order.orderStatus);
                            const status_idx = ['placed', 'accepted', 'preparing', 'out_for_delivery', 'delivered'].indexOf(s.value);
                            return status_idx === order_idx + 1;
                          })
                          .map(s => (
                            <Button
                              key={s.value}
                              size="sm"
                              className="rounded-full"
                              onClick={() => handleUpdateOrderStatus(order._id, s.value)}
                              data-testid={`update-status-${order._id}-${s.value}`}
                            >
                              {s.label}
                            </Button>
                          ))
                        }
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>

        {/* Menu Tab */}
        <TabsContent value="menu">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-heading font-medium text-lg">Menu Items</h2>
            <Dialog open={showAddMenu} onOpenChange={setShowAddMenu}>
              <DialogTrigger asChild>
                <Button className="rounded-full" data-testid="add-menu-item-button">
                  <Plus className="w-4 h-4 mr-1" /> Add Item
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Menu Item</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddMenuItem} className="space-y-4">
                  <div>
                    <Label>Restaurant</Label>
                    <Select value={newItem.restaurantId} onValueChange={(v) => setNewItem({ ...newItem, restaurantId: v })}>
                      <SelectTrigger className="mt-1" data-testid="select-restaurant">
                        <SelectValue placeholder="Select restaurant" />
                      </SelectTrigger>
                      <SelectContent>
                        {restaurants.filter(r => r.status === 'approved').map(r => (
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="menu-items-list">
            {menuItems.map(item => (
              <div key={item._id} className="bg-white rounded-xl border border-border/50 p-4 flex gap-4" data-testid={`menu-manage-${item._id}`}>
                <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-muted">
                  <img src={item.image?.url || 'https://images.unsplash.com/photo-1617686578451-46fa5f114c9d?w=200&h=200&fit=crop'} alt={item.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {item.isVegetarian && <span className="w-3 h-3 border border-green-600 rounded-sm flex items-center justify-center"><span className="w-1.5 h-1.5 bg-green-600 rounded-full" /></span>}
                    <h3 className="font-medium text-sm">{item.name}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground">{item.restaurant?.name} &middot; {item.category}</p>
                  <p className="font-semibold mt-1">&#8377;{item.price}</p>
                </div>
                <Button size="icon" variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8" onClick={() => handleDeleteMenuItem(item._id)} data-testid={`delete-menu-${item._id}`}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Restaurants Tab */}
        <TabsContent value="restaurants">
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-heading font-medium text-lg">My Restaurants</h2>
            <Dialog open={showAddRestaurant} onOpenChange={setShowAddRestaurant}>
              <DialogTrigger asChild>
                <Button className="rounded-full" data-testid="add-restaurant-button">
                  <Plus className="w-4 h-4 mr-1" /> Add Restaurant
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Register Restaurant</DialogTitle>
                </DialogHeader>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="restaurants-list">
            {restaurants.map(r => (
              <div key={r._id} className="bg-white rounded-xl border border-border/50 p-5" data-testid={`restaurant-manage-${r._id}`}>
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-heading font-medium">{r.name}</h3>
                  <Badge variant={r.status === 'approved' ? 'default' : r.status === 'pending' ? 'secondary' : 'destructive'} className="rounded-full capitalize">{r.status}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{r.description}</p>
                <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                  <Store className="w-3.5 h-3.5" /> {r.location}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OwnerDashboard;
