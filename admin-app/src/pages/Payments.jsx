import { useState } from 'react';
import { Check, X, Loader2 } from 'lucide-react';
import { listRefunds, decideRefund, listPayouts } from '../api/admin';
import { useApi } from '../hooks/useApi';

export default function Payments() {
  const [tab, setTab] = useState('refunds');
  const { data: refundData, loading: rLoad, refetch: rRefetch } = useApi(listRefunds);
  const { data: payoutData, loading: pLoad } = useApi(listPayouts);

  const handleDecide = async (id, decision) => {
    const note = decision === 'rejected' ? prompt('Rejection reason?') : '';
    try { await decideRefund(id, decision, note); rRefetch(); }
    catch (e) { alert(e.response?.data?.message || 'Failed'); }
  };

  const tabs = [
    { k: 'refunds', label: 'Refunds' },
    { k: 'payouts', label: 'Payouts' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-ink">Payments & Finance</h1>
        <p className="text-sm text-gray-500">Refunds, payouts, and platform earnings</p>
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        {tabs.map((t) => (
          <button key={t.k} onClick={() => setTab(t.k)}
            className={`px-4 py-3 text-sm font-semibold border-b-2 -mb-px ${tab === t.k ? 'text-primary border-primary' : 'text-gray-600 border-transparent'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'refunds' && (
        <div className="card overflow-hidden">
          {rLoad ? <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-primary" /></div> : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                <tr>
                  <th className="px-6 py-3 text-left">Order</th>
                  <th className="px-6 py-3 text-left">Customer</th>
                  <th className="px-6 py-3 text-left">Reason</th>
                  <th className="px-6 py-3 text-right">Amount</th>
                  <th className="px-6 py-3 text-left">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(refundData?.refunds || []).map((r) => (
                  <tr key={r._id} className="border-t border-gray-100">
                    <td className="px-6 py-4 text-primary font-semibold">#{r.order?._id?.slice(-6).toUpperCase()}</td>
                    <td className="px-6 py-4">{r.customer?.name}</td>
                    <td className="px-6 py-4 text-gray-700">{r.reason}</td>
                    <td className="px-6 py-4 text-right font-semibold">₹{r.amount}</td>
                    <td className="px-6 py-4"><span className={`badge ${r.status === 'pending' ? 'badge-yellow' : r.status === 'approved' ? 'badge-green' : 'badge-red'}`}>{r.status}</span></td>
                    <td className="px-6 py-4">
                      {r.status === 'pending' && (
                        <div className="flex justify-end gap-1">
                          <button onClick={() => handleDecide(r._id, 'approved')} className="p-1.5 bg-green-50 text-green-600 rounded-lg"><Check size={16} /></button>
                          <button onClick={() => handleDecide(r._id, 'rejected')} className="p-1.5 bg-red-50 text-red-600 rounded-lg"><X size={16} /></button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {(!refundData?.refunds?.length) && <tr><td colSpan="6" className="text-center py-12 text-gray-500">No refund requests</td></tr>}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'payouts' && (
        <div className="card overflow-hidden">
          {pLoad ? <div className="py-12 flex justify-center"><Loader2 className="animate-spin text-primary" /></div> : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                <tr>
                  <th className="px-6 py-3 text-left">Payee Type</th>
                  <th className="px-6 py-3 text-left">Period</th>
                  <th className="px-6 py-3 text-right">Gross</th>
                  <th className="px-6 py-3 text-right">Commission</th>
                  <th className="px-6 py-3 text-right">Net</th>
                  <th className="px-6 py-3 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {(payoutData?.payouts || []).map((p) => (
                  <tr key={p._id} className="border-t border-gray-100">
                    <td className="px-6 py-4 capitalize">{p.payeeType.replace('_', ' ')}</td>
                    <td className="px-6 py-4 text-gray-600 text-xs">{new Date(p.periodStart).toLocaleDateString()} → {new Date(p.periodEnd).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">₹{p.grossAmount.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right text-gray-600">₹{p.commission.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right font-semibold">₹{p.netAmount.toLocaleString()}</td>
                    <td className="px-6 py-4"><span className={`badge ${p.status === 'paid' ? 'badge-green' : p.status === 'pending' || p.status === 'processing' ? 'badge-yellow' : 'badge-gray'}`}>{p.status}</span></td>
                  </tr>
                ))}
                {(!payoutData?.payouts?.length) && <tr><td colSpan="6" className="text-center py-12 text-gray-500">No payouts yet</td></tr>}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
