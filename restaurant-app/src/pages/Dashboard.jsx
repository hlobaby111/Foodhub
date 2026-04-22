import { useEffect, useMemo, useState } from 'react';
import { TrendingUp, ShoppingBag, DollarSign, Star, Loader2 } from 'lucide-react';
import { getMyRestaurants, getRestaurantOrders } from '../api/restaurant';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [orders, setOrders] = useState([]);
  const [restaurants, setRestaurants] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError('');
        const [ordersRes, restaurantsRes] = await Promise.all([
          getRestaurantOrders(),
          getMyRestaurants(),
        ]);
        setOrders(ordersRes.data.orders || []);
        setRestaurants(restaurantsRes.data.restaurants || []);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const today = new Date();
  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  const metrics = useMemo(() => {
    const todayOrders = orders.filter((o) => new Date(o.createdAt) >= startOfDay);
    const todayRevenue = todayOrders.reduce((sum, o) => sum + Number(o.totalAmount || 0), 0);
    const avgOrderValue = todayOrders.length ? Math.round(todayRevenue / todayOrders.length) : 0;
    const avgRating = restaurants.length
      ? (restaurants.reduce((sum, r) => sum + Number(r.rating || 0), 0) / restaurants.length).toFixed(1)
      : '0.0';

    return {
      todayOrders: todayOrders.length,
      todayRevenue,
      avgOrderValue,
      avgRating,
    };
  }, [orders, restaurants, startOfDay]);

  const recentOrders = useMemo(
    () => orders.slice(0, 6).map((o) => ({
      id: `#${o.orderNumber || o._id?.slice(-6)?.toUpperCase()}`,
      customer: o.customer?.name || o.customer?.phone || 'Customer',
      items: (o.items || []).reduce((sum, i) => sum + Number(i.quantity || 0), 0),
      total: `₹${Number(o.totalAmount || 0).toLocaleString()}`,
      status: (o.orderStatus || 'placed').replace(/_/g, ' '),
    })),
    [orders]
  );

  const stats = [
    { label: "Today's Orders", value: metrics.todayOrders.toLocaleString(), icon: ShoppingBag, color: 'blue' },
    { label: "Today's Revenue", value: `₹${metrics.todayRevenue.toLocaleString()}`, icon: DollarSign, color: 'green' },
    { label: 'Avg Order Value', value: `₹${metrics.avgOrderValue.toLocaleString()}`, icon: TrendingUp, color: 'purple' },
    { label: 'Rating', value: metrics.avgRating, icon: Star, color: 'yellow' },
  ];

  const colorMap = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-green-100 text-green-600',
    purple: 'bg-purple-100 text-purple-600',
    yellow: 'bg-yellow-100 text-yellow-600',
  };

  const statusColor = {
    placed: 'bg-yellow-100 text-yellow-700',
    accepted: 'bg-blue-100 text-blue-700',
    preparing: 'bg-orange-100 text-orange-700',
    ready: 'bg-indigo-100 text-indigo-700',
    picked_up: 'bg-cyan-100 text-cyan-700',
    out_for_delivery: 'bg-sky-100 text-sky-700',
    delivered: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
  };

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-primary" /></div>;
  }

  if (error) {
    return <div className="card text-red-600">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((s) => (
          <div key={s.label} className="card">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorMap[s.color]}`}>
                <s.icon size={22} />
              </div>
            </div>
            <p className="text-3xl font-extrabold text-dark">{s.value}</p>
            <p className="text-sm text-gray-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <h2 className="text-xl font-bold text-dark mb-4">Recent Orders</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b border-gray-200">
                <th className="pb-3 font-medium">Order ID</th>
                <th className="pb-3 font-medium">Customer</th>
                <th className="pb-3 font-medium">Items</th>
                <th className="pb-3 font-medium">Total</th>
                <th className="pb-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((o) => {
                const key = (o.status || '').replace(/ /g, '_');
                return (
                  <tr key={o.id + o.customer} className="border-b border-gray-100 last:border-0">
                    <td className="py-4 font-semibold text-dark">{o.id}</td>
                    <td className="py-4 text-gray-700">{o.customer}</td>
                    <td className="py-4 text-gray-700">{o.items}</td>
                    <td className="py-4 font-semibold text-dark">{o.total}</td>
                    <td className="py-4">
                      <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusColor[key] || 'bg-gray-100 text-gray-700'}`}>
                        {o.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
              {recentOrders.length === 0 && (
                <tr>
                  <td className="py-8 text-gray-500" colSpan="5">No orders yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
