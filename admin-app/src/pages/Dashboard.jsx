import { ShoppingBag, DollarSign, Store, Bike, AlertCircle, RefreshCw, Loader2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { getDashboard, getMonthlyRevenue } from '../api/admin';
import { useApi } from '../hooks/useApi';

const colorMap = {
  blue: 'bg-blue-50 text-blue-600', green: 'bg-green-50 text-green-600',
  purple: 'bg-purple-50 text-purple-600', orange: 'bg-orange-50 text-orange-600',
  yellow: 'bg-yellow-50 text-yellow-600', red: 'bg-red-50 text-red-600',
};

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function Dashboard() {
  const { data, loading, error } = useApi(getDashboard);
  const { data: revenueData } = useApi(() => getMonthlyRevenue(7));

  const fmt = (value) => Number(value || 0).toLocaleString();

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={32} /></div>;
  if (error) return <div className="card p-6 text-red-600">{error}</div>;

  const kpis = [
    { label: "Today's Orders", value: fmt(data?.todayOrders), icon: ShoppingBag, color: 'blue' },
    { label: "Today's Revenue", value: `₹${fmt(data?.todayRevenue)}`, icon: DollarSign, color: 'green' },
    { label: 'Active Restaurants', value: fmt(data?.activeRestaurants), icon: Store, color: 'purple' },
    { label: 'Active Delivery Boys', value: fmt(data?.activeDeliveryBoys), icon: Bike, color: 'orange' },
    { label: 'Pending Payouts', value: `₹${fmt(data?.pendingPayouts)}`, icon: AlertCircle, color: 'yellow' },
    { label: 'Refund Requests', value: fmt(data?.pendingRefunds), icon: RefreshCw, color: 'red' },
  ];

  const chartData = (revenueData?.data || []).map((d) => ({
    m: MONTHS[d._id.m - 1], rev: d.revenue, orders: d.orders,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-ink">Dashboard Overview</h1>
        <p className="text-sm text-gray-500">Real-time platform metrics</p>
      </div>

      {data?.platformPaused && (
        <div className="card p-4 bg-red-50 border-2 border-red-200 text-red-900 font-semibold">
          🚨 Platform is currently PAUSED - customers cannot place orders.
          {data?.pauseReason ? <div className="mt-1 text-sm font-medium">Reason: {data.pauseReason}</div> : null}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map((k) => (
          <div key={k.label} className="card p-5">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${colorMap[k.color]}`}><k.icon size={20} /></div>
            <p className="text-xs text-gray-500 font-medium">{k.label}</p>
            <p className="text-2xl font-extrabold text-ink mt-1">{k.value}</p>
          </div>
        ))}
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-ink">Current System Settings</h3>
            <p className="text-sm text-gray-500">Live snapshot of the values saved in System Settings</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <SettingTile label="Platform Fee" value={`₹${fmt(data?.settings?.platformFee)}`} />
          <SettingTile label="GST" value={`${fmt(data?.settings?.gstPercent)}%`} />
          <SettingTile label="Commission" value={`${fmt(data?.settings?.defaultCommissionPercent)}%`} />
          <SettingTile label="Min Order" value={`₹${fmt(data?.settings?.minimumOrderValue)}`} />
          <SettingTile label="Base Delivery" value={`₹${fmt(data?.settings?.baseDeliveryCharge)}`} />
          <SettingTile label="Per Km" value={`₹${fmt(data?.settings?.perKmCharge)}`} />
          <SettingTile label="Radius" value={`${fmt(data?.settings?.defaultDeliveryRadiusKm)} km`} />
          <SettingTile label="Cancel Fee" value={`₹${fmt(data?.settings?.cancellationFee)}`} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="font-bold text-ink mb-4">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="m" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip formatter={(v) => `₹${v.toLocaleString()}`} />
              <Line type="monotone" dataKey="rev" stroke="#E23744" strokeWidth={3} dot={{ fill: '#E23744', r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="card p-6">
          <h3 className="font-bold text-ink mb-4">Orders Trend</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis dataKey="m" stroke="#64748b" fontSize={12} />
              <YAxis stroke="#64748b" fontSize={12} />
              <Tooltip />
              <Bar dataKey="orders" fill="#0F172A" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function SettingTile({ label, value }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
      <p className="text-xs text-gray-500 font-medium">{label}</p>
      <p className="text-lg font-bold text-ink mt-1">{value}</p>
    </div>
  );
}
