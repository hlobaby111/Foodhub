import { useEffect, useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Loader2 } from 'lucide-react';
import { getMyRestaurants, getRestaurantOrders } from '../api/restaurant';

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function Analytics() {
  const [orders, setOrders] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
        setError(err.response?.data?.message || 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const last7Days = useMemo(() => {
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - 6);
    start.setHours(0, 0, 0, 0);

    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return {
        key: d.toDateString(),
        day: DAY_LABELS[d.getDay()],
        sales: 0,
        orders: 0,
      };
    });

    const map = new Map(days.map((d) => [d.key, d]));

    orders.forEach((o) => {
      const created = new Date(o.createdAt);
      if (created < start) return;
      const key = created.toDateString();
      const row = map.get(key);
      if (!row) return;
      row.orders += 1;
      row.sales += Number(o.totalAmount || 0);
    });

    return days;
  }, [orders]);

  const summary = useMemo(() => {
    const totalRevenue = last7Days.reduce((sum, d) => sum + d.sales, 0);
    const totalOrders = last7Days.reduce((sum, d) => sum + d.orders, 0);
    const avgRating = restaurants.length
      ? (restaurants.reduce((sum, r) => sum + Number(r.rating || 0), 0) / restaurants.length).toFixed(1)
      : '0.0';
    return { totalRevenue, totalOrders, avgRating };
  }, [last7Days, restaurants]);

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="animate-spin text-primary" /></div>;
  if (error) return <div className="card text-red-600">{error}</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Revenue (Week)', value: `₹${summary.totalRevenue.toLocaleString()}` },
          { label: 'Total Orders (Week)', value: summary.totalOrders.toLocaleString() },
          { label: 'Average Rating', value: `${summary.avgRating} ★` },
        ].map((s) => (
          <div key={s.label} className="card">
            <p className="text-sm text-gray-500">{s.label}</p>
            <p className="text-3xl font-extrabold text-dark mt-2">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <h2 className="text-xl font-bold text-dark mb-6">Weekly Sales</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={last7Days}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis dataKey="day" stroke="#666" />
            <YAxis stroke="#666" />
            <Tooltip formatter={(v) => `₹${Number(v).toLocaleString()}`} />
            <Bar dataKey="sales" fill="#E23744" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="card">
        <h2 className="text-xl font-bold text-dark mb-6">Weekly Orders</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={last7Days}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis dataKey="day" stroke="#666" />
            <YAxis stroke="#666" />
            <Tooltip />
            <Line type="monotone" dataKey="orders" stroke="#E23744" strokeWidth={3} dot={{ fill: '#E23744', r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
