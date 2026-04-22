import { useState } from 'react';
import { Check, X, Star, Eye, Pause, Loader2 } from 'lucide-react';
import { listDeliveryPartners, decidePartnerKyc, togglePartner } from '../api/admin';
import { useApi } from '../hooks/useApi';

export default function DeliveryPartners() {
  const [tab, setTab] = useState('all');
  const { data, loading, refetch } = useApi(() => listDeliveryPartners());

  const all = data?.partners || [];
  const filtered = tab === 'all' ? all : all.filter((d) => d.status === tab);

  const handleKyc = async (id, decision) => {
    try { await decidePartnerKyc(id, decision); refetch(); }
    catch (e) { alert(e.response?.data?.message || 'Failed'); }
  };
  const handleToggle = async (id) => {
    try { await togglePartner(id); refetch(); }
    catch (e) { alert(e.response?.data?.message || 'Failed'); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-ink">Delivery Partner Management</h1>
        <p className="text-sm text-gray-500">Onboard, manage, and track performance</p>
      </div>

      <div className="flex gap-2">
        {['all', 'pending', 'active', 'inactive'].map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize ${tab === t ? 'bg-primary text-white' : 'bg-white text-gray-700 border border-gray-200'}`}>
            {t}
          </button>
        ))}
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="animate-spin text-primary" /></div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3 text-left">Partner</th>
                <th className="px-6 py-3 text-left">City</th>
                <th className="px-6 py-3 text-left">KYC</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-right">Rating</th>
                <th className="px-6 py-3 text-right">Deliveries</th>
                <th className="px-6 py-3 text-right">On-Time %</th>
                <th className="px-6 py-3 text-right">Earnings</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d._id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-ink">{d.user?.name || '—'}</p>
                    <p className="text-xs text-gray-500">{d.user?.phone}</p>
                  </td>
                  <td className="px-6 py-4 text-gray-700">{d.city}</td>
                  <td className="px-6 py-4"><span className={`badge ${d.kycStatus === 'verified' ? 'badge-green' : d.kycStatus === 'rejected' ? 'badge-red' : 'badge-yellow'}`}>{d.kycStatus}</span></td>
                  <td className="px-6 py-4"><span className={`badge ${d.status === 'active' ? 'badge-green' : d.status === 'pending' ? 'badge-yellow' : 'badge-gray'}`}>{d.status}</span></td>
                  <td className="px-6 py-4 text-right">
                    {d.rating > 0 ? <span className="inline-flex items-center gap-1 font-semibold"><Star size={14} className="text-yellow-500 fill-yellow-500" />{d.rating.toFixed(1)}</span> : '—'}
                  </td>
                  <td className="px-6 py-4 text-right">{d.totalDeliveries.toLocaleString()}</td>
                  <td className="px-6 py-4 text-right font-semibold">{d.onTimePercent > 0 ? `${d.onTimePercent}%` : '—'}</td>
                  <td className="px-6 py-4 text-right font-semibold">₹{d.totalEarnings.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      {d.kycStatus === 'pending' ? (
                        <>
                          <button onClick={() => handleKyc(d._id, 'verified')} className="p-1.5 bg-green-50 text-green-600 rounded-lg"><Check size={16} /></button>
                          <button onClick={() => handleKyc(d._id, 'rejected')} className="p-1.5 bg-red-50 text-red-600 rounded-lg"><X size={16} /></button>
                        </>
                      ) : (
                        <>
                          <button className="p-1.5 hover:bg-gray-100 rounded-lg"><Eye size={16} className="text-gray-600" /></button>
                          <button onClick={() => handleToggle(d._id)} className="p-1.5 hover:bg-gray-100 rounded-lg"><Pause size={16} className="text-gray-600" /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan="9" className="text-center py-12 text-gray-500">No partners found</td></tr>}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
