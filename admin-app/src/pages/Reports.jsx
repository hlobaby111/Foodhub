import { Download, Loader2 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import { getMonthlyRevenue, getTopRestaurants, getCuisineBreakdown } from '../api/admin';
import { useApi } from '../hooks/useApi';

const COLORS = ['#E23744', '#0F172A', '#3B82F6', '#F59E0B', '#10B981', '#8B5CF6', '#EC4899', '#06B6D4'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function Reports() {
  const { data: rev, loading: l1 } = useApi(() => getMonthlyRevenue(6));
  const { data: top, loading: l2 } = useApi(() => getTopRestaurants(5));
  const { data: cuisine, loading: l3 } = useApi(getCuisineBreakdown);

  const revData = (rev?.data || []).map((d) => ({ m: MONTHS[d._id.m - 1], rev: d.revenue }));
  const topData = (top?.data || []).map((d) => ({ n: d.name, o: d.orders }));
  const pieData = (cuisine?.data || []).map((d) => ({ name: d._id, value: d.count }));

  if (l1 || l2 || l3) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={32} /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">Reports & Analytics</h1>
          <p className="text-sm text-gray-500">Platform-wide performance insights</p>
        </div>
        <button className="btn-primary flex items-center gap-2"><Download size={16} /> Export</button>
      </div>

      <div className="card p-6">
        <h3 className="font-bold text-ink mb-4">Monthly Revenue Growth</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={revData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
            <XAxis dataKey="m" stroke="#64748b" />
            <YAxis stroke="#64748b" tickFormatter={(v) => `₹${v / 1000}K`} />
            <Tooltip formatter={(v) => `₹${v.toLocaleString()}`} />
            <Line type="monotone" dataKey="rev" stroke="#E23744" strokeWidth={3} dot={{ fill: '#E23744', r: 6 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <h3 className="font-bold text-ink mb-4">Top Restaurants</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={topData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
              <XAxis type="number" stroke="#64748b" />
              <YAxis dataKey="n" type="category" stroke="#64748b" width={120} fontSize={12} />
              <Tooltip />
              <Bar dataKey="o" fill="#E23744" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-6">
          <h3 className="font-bold text-ink mb-4">Cuisine Breakdown</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Legend />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
