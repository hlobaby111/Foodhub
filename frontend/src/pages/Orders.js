import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Badge } from '../components/ui/badge';
import { Clock, MapPin, Package, Check, Truck, ChefHat } from 'lucide-react';

const statusConfig = {
  placed: { label: 'Placed', color: 'bg-blue-100 text-blue-800', icon: Package },
  accepted: { label: 'Accepted', color: 'bg-indigo-100 text-indigo-800', icon: Check },
  preparing: { label: 'Preparing', color: 'bg-yellow-100 text-yellow-800', icon: ChefHat },
  out_for_delivery: { label: 'Out for Delivery', color: 'bg-orange-100 text-orange-800', icon: Truck },
  delivered: { label: 'Delivered', color: 'bg-green-100 text-green-800', icon: Check },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: Package },
};

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await api.get('/api/orders/my');
      setOrders(response.data.orders);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-2xl sm:text-3xl font-heading font-semibold mb-8">My Orders</h1>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-40 bg-muted animate-pulse rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-8" data-testid="orders-page">
      <h1 className="text-2xl sm:text-3xl font-heading font-semibold mb-8">My Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center py-20" data-testid="no-orders">
          <Package className="w-16 h-16 mx-auto text-muted-foreground/40 mb-4" />
          <p className="text-lg text-muted-foreground">No orders yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => {
            const statusInfo = statusConfig[order.orderStatus] || statusConfig.placed;
            const StatusIcon = statusInfo.icon;
            return (
              <div
                key={order._id}
                className="bg-white rounded-2xl border border-border/50 p-6"
                data-testid={`order-${order._id}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Order #{order.orderNumber}</p>
                    <h3 className="font-heading font-medium text-lg">{order.restaurant?.name || 'Restaurant'}</h3>
                  </div>
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
                    <StatusIcon className="w-3.5 h-3.5" />
                    {statusInfo.label}
                  </div>
                </div>

                <div className="space-y-1.5 mb-4">
                  {order.items?.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{item.name} x{item.quantity}</span>
                      <span>&#8377;{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-t border-border/50 pt-4 gap-2">
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="capitalize">{order.paymentMethod === 'cash' ? 'COD' : 'Online'}</span>
                  </div>
                  <span className="font-semibold text-lg" data-testid={`order-total-${order._id}`}>
                    &#8377;{order.totalAmount}
                  </span>
                </div>

                {/* Status Tracker */}
                <div className="mt-4 pt-4 border-t border-border/50">
                  <div className="flex items-center gap-1">
                    {['placed', 'accepted', 'preparing', 'out_for_delivery', 'delivered'].map((step, i) => {
                      const isCompleted = order.statusHistory?.some(h => h.status === step);
                      const isCurrent = order.orderStatus === step;
                      return (
                        <React.Fragment key={step}>
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                            isCompleted || isCurrent
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground'
                          }`}>
                            {isCompleted ? <Check className="w-3 h-3" /> : i + 1}
                          </div>
                          {i < 4 && (
                            <div className={`flex-1 h-0.5 ${isCompleted ? 'bg-primary' : 'bg-muted'}`} />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                  <div className="flex justify-between mt-1">
                    {['Placed', 'Accepted', 'Preparing', 'On Way', 'Delivered'].map(s => (
                      <span key={s} className="text-[10px] text-muted-foreground">{s}</span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Orders;
