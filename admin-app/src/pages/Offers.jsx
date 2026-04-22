import { useState } from 'react';
import { Plus, Trash2, Tag, Loader2 } from 'lucide-react';
import { listOffers, createOffer, toggleOffer, deleteOffer } from '../api/admin';
import { useApi } from '../hooks/useApi';

export default function Offers() {
  const [open, setOpen] = useState(false);
  const { data, loading, refetch } = useApi(listOffers);
  const offers = data?.offers || [];

  const handleCreate = async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    try {
      await createOffer({
        code: f.get('code').toUpperCase(),
        title: f.get('title') || f.get('code'),
        discountType: f.get('discountType'),
        discountValue: Number(f.get('discountValue')),
        target: f.get('target'),
        usageLimit: Number(f.get('usageLimit') || 1000),
        validUntil: f.get('validUntil'),
      });
      setOpen(false);
      refetch();
    } catch (err) { alert(err.response?.data?.message || 'Failed'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this offer?')) return;
    try { await deleteOffer(id); refetch(); }
    catch (e) { alert(e.response?.data?.message || 'Failed'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">Offers & Discounts</h1>
          <p className="text-sm text-gray-500">Create and manage promotional offers</p>
        </div>
        <button onClick={() => setOpen(true)} className="btn-primary flex items-center gap-2"><Plus size={18} /> Create Offer</button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>
      ) : offers.length === 0 ? (
        <div className="card p-12 text-center text-gray-500">No offers yet. Create your first one!</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {offers.map((o) => (
            <div key={o._id} className="card p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-primary-light rounded-xl flex items-center justify-center">
                  <Tag className="text-primary" size={22} />
                </div>
                <button onClick={() => toggleOffer(o._id).then(refetch)} className={`badge ${o.isActive ? 'badge-green' : 'badge-gray'} cursor-pointer`}>
                  {o.isActive ? 'active' : 'paused'}
                </button>
              </div>
              <p className="text-xs text-gray-500">Code</p>
              <p className="text-xl font-extrabold text-ink">{o.code}</p>
              <p className="text-2xl font-bold text-primary mt-2">
                {o.discountType === 'percent' ? `${o.discountValue}%` : `₹${o.discountValue}`}
                <span className="text-sm font-medium text-gray-500"> OFF</span>
              </p>
              <p className="text-sm text-gray-600 mt-2">Target: {o.target.replace(/_/g, ' ')}</p>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-gray-500">Usage</span>
                  <span className="font-semibold">{o.usageCount} / {o.usageLimit}</span>
                </div>
                <div className="w-full h-1.5 bg-gray-200 rounded-full">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${(o.usageCount / o.usageLimit) * 100}%` }} />
                </div>
              </div>
              <button onClick={() => handleDelete(o._id)} className="mt-4 w-full px-3 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 flex items-center justify-center gap-2">
                <Trash2 size={14} /> Delete
              </button>
            </div>
          ))}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <form onSubmit={handleCreate} className="bg-white rounded-xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-xl text-ink mb-4">Create New Offer</h3>
            <div className="space-y-4">
              <input name="code" placeholder="Code e.g. WELCOME50" className="input uppercase" required />
              <input name="title" placeholder="Title (optional)" className="input" />
              <div className="grid grid-cols-2 gap-3">
                <select name="discountType" className="input" required>
                  <option value="percent">Percent</option>
                  <option value="flat">Flat</option>
                </select>
                <input name="discountValue" type="number" placeholder="Value" className="input" required />
              </div>
              <select name="target" className="input">
                <option value="all_users">All users</option>
                <option value="new_users">New users only</option>
                <option value="specific_restaurants">Specific restaurants</option>
              </select>
              <input name="usageLimit" type="number" placeholder="Usage limit (default 1000)" className="input" />
              <input name="validUntil" type="date" className="input" required />
              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setOpen(false)} className="btn-outline">Cancel</button>
                <button type="submit" className="btn-primary">Create</button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
