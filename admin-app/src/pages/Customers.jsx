import { useState } from 'react';
import { Eye, Ban, Search, Loader2 } from 'lucide-react';
import { listUsers, toggleUserStatus } from '../api/admin';
import { useApi } from '../hooks/useApi';

export default function Customers() {
  const [q, setQ] = useState('');
  const { data, loading, refetch } = useApi(() => listUsers({ limit: 100 }));

  const all = (data?.users || []).filter((u) => u.role === 'customer');
  const filtered = all.filter((c) =>
    (c.name || '').toLowerCase().includes(q.toLowerCase()) || (c.phone || '').includes(q)
  );

  const handleToggle = async (id) => {
    try { await toggleUserStatus(id); refetch(); }
    catch (e) { alert(e.response?.data?.message || 'Failed'); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-ink">Customer Management</h1>
        <p className="text-sm text-gray-500">View, block, and track customer activity</p>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or phone..." className="input pl-10" />
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" /></div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3 text-left">Customer</th>
                <th className="px-6 py-3 text-left">Email</th>
                <th className="px-6 py-3 text-left">Joined</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c._id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-ink">{c.name || 'Guest'}</p>
                    <p className="text-xs text-gray-500">{c.phone}</p>
                  </td>
                  <td className="px-6 py-4 text-gray-700">{c.email || '—'}</td>
                  <td className="px-6 py-4 text-gray-700">{new Date(c.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4"><span className={`badge ${c.isActive ? 'badge-green' : 'badge-red'}`}>{c.isActive ? 'active' : 'blocked'}</span></td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-1">
                      <button className="p-1.5 hover:bg-gray-100 rounded-lg"><Eye size={16} className="text-gray-600" /></button>
                      <button onClick={() => handleToggle(c._id)} className="p-1.5 hover:bg-red-50 rounded-lg"><Ban size={16} className="text-red-600" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan="5" className="text-center py-12 text-gray-500">No customers found</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
