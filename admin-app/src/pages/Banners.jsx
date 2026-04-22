import { useState } from 'react';
import { Plus, Trash2, Image as ImageIcon, Loader2, Calendar } from 'lucide-react';
import { getBanners, createBanner, deleteBanner } from '../api/admin';
import { useApi } from '../hooks/useApi';

export default function Banners() {
  const [open, setOpen] = useState(false);
  const { data, loading, refetch } = useApi(getBanners);
  const banners = data?.banners || [];

  const handleCreate = async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    try {
      await createBanner({
        title: f.get('title'),
        imageUrl: f.get('imageUrl'),
        linkUrl: f.get('linkUrl') || null,
        targetAudience: f.get('targetAudience'),
        validFrom: f.get('validFrom') ? new Date(f.get('validFrom')) : null,
        validUntil: f.get('validUntil') ? new Date(f.get('validUntil')) : null,
        isActive: true,
        displayOrder: Number(f.get('displayOrder') || 0)
      });
      setOpen(false);
      refetch();
    } catch (err) { alert(err.response?.data?.message || 'Failed'); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this banner?')) return;
    try { await deleteBanner(id); refetch(); }
    catch (e) { alert(e.response?.data?.message || 'Failed'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">Banner Management</h1>
          <p className="text-sm text-gray-500">Manage promotional banners on customer app</p>
        </div>
        <button onClick={() => setOpen(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Create Banner
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>
      ) : banners.length === 0 ? (
        <div className="card p-12 text-center text-gray-500">No banners yet. Create your first one!</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {banners.map((banner) => (
            <div key={banner._id} className="card p-0 overflow-hidden">
              {banner.imageUrl && (
                <div className="w-full h-48 bg-gray-100 relative overflow-hidden">
                  <img src={banner.imageUrl} alt={banner.title} className="w-full h-full object-cover" />
                  <span className={`absolute top-3 right-3 badge ${banner.isActive ? 'badge-green' : 'badge-gray'}`}>
                    {banner.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              )}
              <div className="p-5">
                <h3 className="font-bold text-ink mb-2">{banner.title}</h3>
                {banner.linkUrl && (
                  <p className="text-xs text-gray-500 mb-2">Link: {banner.linkUrl}</p>
                )}
                <div className="flex items-center gap-4 text-xs text-gray-600 mb-3">
                  {banner.validFrom && (
                    <div className="flex items-center gap-1">
                      <Calendar size={12} />
                      <span>From: {new Date(banner.validFrom).toLocaleDateString()}</span>
                    </div>
                  )}
                  {banner.validUntil && (
                    <div className="flex items-center gap-1">
                      <Calendar size={12} />
                      <span>Until: {new Date(banner.validUntil).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 capitalize">
                    Target: {banner.targetAudience?.replace(/_/g, ' ') || 'All'}
                  </span>
                  <button
                    onClick={() => handleDelete(banner._id)}
                    className="px-3 py-1.5 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 flex items-center gap-2 text-sm"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <form onSubmit={handleCreate} className="bg-white rounded-xl w-full max-w-lg p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-xl text-ink mb-4">Create New Banner</h3>
            <div className="space-y-4">
              <input name="title" placeholder="Banner Title *" className="input" required />
              <input name="imageUrl" placeholder="Image URL *" className="input" required />
              <input name="linkUrl" placeholder="Link URL (optional)" className="input" />
              <select name="targetAudience" className="input">
                <option value="all_users">All Users</option>
                <option value="new_users">New Users Only</option>
                <option value="returning_users">Returning Users</option>
              </select>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Valid From</label>
                  <input name="validFrom" type="date" className="input" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Valid Until</label>
                  <input name="validUntil" type="date" className="input" />
                </div>
              </div>
              <input name="displayOrder" type="number" placeholder="Display Order (0 = first)" className="input" />
              <div className="flex gap-2 justify-end pt-2">
                <button type="button" onClick={() => setOpen(false)} className="btn-outline">Cancel</button>
                <button type="submit" className="btn-primary">Create Banner</button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
