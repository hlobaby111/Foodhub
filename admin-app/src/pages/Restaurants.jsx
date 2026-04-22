import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Download } from 'lucide-react';
import { listRestaurants } from '../api/admin';
import { useApi } from '../hooks/useApi';
import { exportToCSV, formatRestaurantsForExport } from '../utils/csvExport';

const statusBadge = { approved: 'badge-green', pending: 'badge-yellow', rejected: 'badge-red', inactive: 'badge-gray' };

export default function Restaurants() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('all');
  const { data, loading } = useApi(() => listRestaurants({ limit: 100 }));

  const all = data?.restaurants || [];
  const filtered = tab === 'all' ? all : all.filter((r) => r.status === tab);

  const handleExport = () => {
    const formatted = formatRestaurantsForExport(filtered);
    exportToCSV(formatted, 'restaurants');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">Restaurant Management</h1>
          <p className="text-sm text-gray-500">Approve, manage, and control restaurant partners</p>
        </div>
        <button onClick={handleExport} className="btn-primary flex items-center gap-2">
          <Download size={16} /> Export CSV
        </button>
      </div>

      <div className="flex gap-2">
        {['all', 'pending', 'approved', 'rejected'].map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize ${tab === t ? 'bg-primary text-white' : 'bg-white text-gray-700 border border-gray-200'}`}>
            {t} {t !== 'all' && `(${all.filter((r) => r.status === t).length})`}
          </button>
        ))}
      </div>

      <div className="card overflow-visible">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" /></div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3 text-left">Restaurant</th>
                <th className="px-6 py-3 text-left">Owner</th>
                <th className="px-6 py-3 text-left">City</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-right">Commission</th>
                <th className="px-6 py-3 text-right">Orders</th>
                <th className="px-6 py-3 text-right">Earnings</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr
                  key={r._id}
                  className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate(`/restaurants/${r._id}`)}
                >
                  <td className="px-6 py-4">
                    <p className="font-semibold text-ink">{r.name}</p>
                    <p className="text-xs text-gray-500">{r._id.slice(-6).toUpperCase()}</p>
                  </td>
                  <td className="px-6 py-4 text-gray-700">{r.owner?.name || '—'}</td>
                  <td className="px-6 py-4 text-gray-700">{r.address?.city || r.location || '—'}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className={`badge ${statusBadge[r.status]}`}>{r.status}</span>
                      <span className={`text-xs font-semibold ${r.isActive === false ? 'text-red-600' : 'text-green-600'}`}>
                        {r.isActive === false ? 'paused' : 'active'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right font-semibold">{r.commissionPercent || 18}%</td>
                  <td className="px-6 py-4 text-right">{(r.totalOrders || 0).toLocaleString()}</td>
                  <td className="px-6 py-4 text-right font-semibold">₹{(r.totalEarnings || 0).toLocaleString()}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan="7" className="text-center py-12 text-gray-500">No restaurants found</td></tr>
              )}
            </tbody>
          </table>
          </div>
        )}
      </div>
    </div>
  );
}
