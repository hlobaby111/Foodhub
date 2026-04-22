import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import {
  getRestaurantDetails,
  updateRestaurantCommission,
  toggleRestaurantActive,
  decideRestaurant,
  createRestaurantMenuItem,
  updateRestaurantMenuItem,
  deleteRestaurantMenuItem,
  uploadRestaurantMenuItemImage,
} from '../api/admin';
import { useApi } from '../hooks/useApi';

const defaultItem = {
  name: '',
  description: '',
  price: '',
  category: '',
  isVegetarian: false,
  isAvailable: true,
};

export default function RestaurantDashboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: apiData, loading, error, refetch } = useApi(() => getRestaurantDetails(id), [id]);
  const [data, setData] = useState(null);
  const [tab, setTab] = useState('settings');
  const [actionLoading, setActionLoading] = useState('');
  const [confirmRejectOpen, setConfirmRejectOpen] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [deleteTargetItem, setDeleteTargetItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(false);
  const [commission, setCommission] = useState('');
  const [savingCommission, setSavingCommission] = useState(false);
  const [newItem, setNewItem] = useState(defaultItem);
  const [menuSearch, setMenuSearch] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [editingItemForm, setEditingItemForm] = useState(defaultItem);
  const [savingEditedItem, setSavingEditedItem] = useState(false);
  const [itemImage, setItemImage] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    if (apiData) {
      setData(apiData);
    }
  }, [apiData]);

  const restaurant = data?.restaurant;
  const menuItems = data?.menuItems || [];
  const filteredMenuItems = menuItems.filter((item) => {
    const query = menuSearch.trim().toLowerCase();
    if (!query) return true;

    return [item.name, item.category, item.description]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(query));
  });

  useEffect(() => {
    if (restaurant?.commissionPercent !== undefined) {
      setCommission(String(restaurant.commissionPercent));
    }
  }, [restaurant?.commissionPercent]);

  const saveCommission = async () => {
    setSavingCommission(true);
    try {
      await updateRestaurantCommission(id, Number(commission));
      await refetch();
      alert('Commission updated');
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to update commission');
    } finally {
      setSavingCommission(false);
    }
  };

  const onToggleActive = async () => {
    try {
      await toggleRestaurantActive(id);
      await refetch();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to update status');
    }
  };

  const onDecideStatus = async (status) => {
    setActionLoading(status);
    try {
      const response = await decideRestaurant(id, status);
      const updatedRestaurant = response.data?.restaurant;
      if (updatedRestaurant) {
        setData((prev) => ({ ...(prev || {}), restaurant: updatedRestaurant }));
      }
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to update approval status');
    } finally {
      setActionLoading('');
    }
  };

  const confirmReject = async () => {
    setRejecting(true);
    try {
      await onDecideStatus('rejected');
      setConfirmRejectOpen(false);
    } finally {
      setRejecting(false);
    }
  };

  const createMenuItem = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);

    const payload = {
      ...newItem,
      price: Number(newItem.price),
    };

    let created = null;

    // STEP 1: Create menu item record
    try {
      const res = await createRestaurantMenuItem(id, payload);
      created = res.data?.menuItem;
    } catch (e2) {
      alert(e2.response?.data?.message || e2.message || 'Failed to create menu item');
      setSubmitLoading(false);
      return;
    }

    // STEP 2: Upload image (optional, non-blocking)
    if (itemImage && created?._id) {
      try {
        await uploadRestaurantMenuItemImage(created._id, itemImage);
      } catch (_) {
        alert('Item created, image failed. Add image later.');
      }
    }

    // STEP 3: Refresh and cleanup
    try {
      await refetch();
      setNewItem(defaultItem);
      setItemImage(null);
      alert('Menu item added');
    } catch (refreshError) {
      alert(refreshError.response?.data?.message || 'Item created but refresh failed. Please reload the page.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const toggleMenuAvailability = async (item) => {
    try {
      await updateRestaurantMenuItem(id, item._id, { isAvailable: !item.isAvailable });
      await refetch();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to update menu item');
    }
  };

  const openEditMenuItem = (item) => {
    setEditingItem(item);
    setEditingItemForm({
      name: item.name || '',
      description: item.description || '',
      price: String(item.price ?? ''),
      category: item.category || '',
      isVegetarian: Boolean(item.isVegetarian),
      isAvailable: Boolean(item.isAvailable),
    });
  };

  const saveEditedMenuItem = async (e) => {
    e.preventDefault();
    if (!editingItem?._id) return;

    setSavingEditedItem(true);
    try {
      await updateRestaurantMenuItem(id, editingItem._id, {
        ...editingItemForm,
        price: Number(editingItemForm.price),
      });
      await refetch();
      setEditingItem(null);
      alert('Menu item updated');
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to update menu item');
    } finally {
      setSavingEditedItem(false);
    }
  };

  const removeMenuItem = async (item) => {
    setDeleteTargetItem(item);
  };

  const confirmDeleteMenuItem = async () => {
    if (!deleteTargetItem?._id) return;
    setDeletingItem(true);
    try {
      await deleteRestaurantMenuItem(id, deleteTargetItem._id);
      await refetch();
      setDeleteTargetItem(null);
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to delete menu item');
    } finally {
      setDeletingItem(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={32} /></div>;
  }

  if (error) {
    return <div className="card p-6 text-red-600">{error}</div>;
  }

  if (!restaurant) {
    return <div className="card p-6">Restaurant not found</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <button onClick={() => navigate('/restaurants')} className="btn-outline inline-flex items-center gap-2 mb-3">
            <ArrowLeft size={16} /> Back to Restaurants
          </button>
          <h1 className="text-2xl font-extrabold text-ink">{restaurant.name}</h1>
          <p className="text-sm text-gray-500">Manage restaurant settings and menu items</p>
        </div>
        <span className={`badge ${restaurant.isActive === false ? 'badge-red' : 'badge-green'}`}>
          {restaurant.isActive === false ? 'paused' : 'active'}
        </span>
      </div>

      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setTab('settings')}
          className={`px-4 py-3 text-sm font-semibold border-b-2 -mb-px ${tab === 'settings' ? 'text-primary border-primary' : 'text-gray-600 border-transparent'}`}
        >
          Settings
        </button>
        <button
          onClick={() => setTab('add-menu')}
          className={`px-4 py-3 text-sm font-semibold border-b-2 -mb-px ${tab === 'add-menu' ? 'text-primary border-primary' : 'text-gray-600 border-transparent'}`}
        >
          Add Menu
        </button>
        <button
          onClick={() => setTab('menu-items')}
          className={`px-4 py-3 text-sm font-semibold border-b-2 -mb-px ${tab === 'menu-items' ? 'text-primary border-primary' : 'text-gray-600 border-transparent'}`}
        >
          Menu Items
        </button>
      </div>

      {tab === 'settings' && (
        <div className="card p-6 max-w-3xl space-y-5">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <Info label="Owner" value={restaurant.owner?.name || '—'} />
            <Info label="Owner Email" value={restaurant.owner?.email || restaurant.email || '—'} />
            <Info label="Phone" value={restaurant.phone || '—'} />
            <Info label="Location" value={restaurant.location || '—'} />
            <Info label="Status" value={restaurant.status || '—'} />
            <Info label="Orders" value={String(restaurant.totalOrders || 0)} />
          </div>

          <div className="border-t border-gray-100 pt-5">
            <label className="block text-sm font-medium mb-1.5">Commission %</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="100"
                value={commission}
                onChange={(e) => setCommission(e.target.value)}
                className="input max-w-xs"
              />
              <button onClick={saveCommission} disabled={savingCommission} className="btn-primary disabled:opacity-50">
                {savingCommission ? 'Saving...' : 'Save Commission'}
              </button>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-5">
            <button onClick={onToggleActive} className={restaurant.isActive === false ? 'btn-success' : 'btn-danger'}>
              {restaurant.isActive === false ? 'Open Restaurant' : 'Close Restaurant'}
            </button>
          </div>

          <div className="border-t border-gray-100 pt-5">
            <p className="text-sm font-medium mb-2">Approval Status</p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onDecideStatus('approved')}
                className="btn-success"
                disabled={restaurant.status === 'approved' || actionLoading !== ''}
              >
                {actionLoading === 'approved' ? 'Approving...' : 'Approve Restaurant'}
              </button>
              <button
                onClick={() => setConfirmRejectOpen(true)}
                className="btn-danger"
                disabled={restaurant.status === 'rejected' || actionLoading !== ''}
              >
                Reject Restaurant
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === 'add-menu' && (
        <form onSubmit={createMenuItem} className="card p-6 space-y-4">
            <fieldset disabled={submitLoading} className="space-y-4 disabled:opacity-60">
              <div className="flex items-center gap-2 mb-2">
                <Plus size={18} className="text-primary" />
                <h3 className="font-bold text-ink">Add Menu Item</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Name" value={newItem.name} onChange={(value) => setNewItem((s) => ({ ...s, name: value }))} required />
                <Field label="Category" value={newItem.category} onChange={(value) => setNewItem((s) => ({ ...s, category: value }))} required />
                <Field label="Price (INR)" type="number" value={newItem.price} onChange={(value) => setNewItem((s) => ({ ...s, price: value }))} required />
                <div>
                  <label className="block text-sm font-medium mb-1.5">Photo</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="input"
                    onChange={(e) => setItemImage(e.target.files?.[0] || null)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Description</label>
                <textarea
                  value={newItem.description}
                  onChange={(e) => setNewItem((s) => ({ ...s, description: e.target.value }))}
                  className="input min-h-24"
                  required
                />
              </div>

              <div className="flex items-center gap-6 text-sm">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newItem.isVegetarian}
                    onChange={(e) => setNewItem((s) => ({ ...s, isVegetarian: e.target.checked }))}
                    className="w-4 h-4 accent-primary"
                  />
                  Vegetarian
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={newItem.isAvailable}
                    onChange={(e) => setNewItem((s) => ({ ...s, isAvailable: e.target.checked }))}
                    className="w-4 h-4 accent-primary"
                  />
                  Available now
                </label>
              </div>

              <button type="submit" disabled={submitLoading} className="btn-primary disabled:opacity-50">
                {submitLoading ? 'Creating...' : 'Add Item'}
              </button>
            </fieldset>
        </form>
      )}

      {tab === 'menu-items' && (
        <div className="space-y-6">
          <div className="card p-6 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <h3 className="font-bold text-ink">Menu Items</h3>
                <p className="text-sm text-gray-500">Search, edit, hide, show, or delete restaurant items.</p>
              </div>
              <div className="relative w-full md:max-w-sm">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={menuSearch}
                  onChange={(e) => setMenuSearch(e.target.value)}
                  placeholder="Search menu items"
                  className="input pl-9"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredMenuItems.map((item) => (
                <div key={item._id} className="card p-4 space-y-3">
                  {item.image?.url ? (
                    <img src={item.image.url} alt={item.name} className="w-full h-40 object-cover rounded-lg" />
                  ) : (
                    <div className="w-full h-40 rounded-lg bg-gray-100 flex items-center justify-center text-sm text-gray-400">
                      No image
                    </div>
                  )}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-bold text-ink">{item.name}</p>
                      <p className="text-xs text-gray-500">{item.category}</p>
                    </div>
                    <span className={`badge ${item.isAvailable ? 'badge-green' : 'badge-gray'}`}>
                      {item.isAvailable ? 'available' : 'hidden'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{item.description}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-extrabold text-ink">₹{Number(item.price || 0).toLocaleString()}</p>
                    <p className="text-xs text-gray-500">{item.isVegetarian ? 'Veg' : 'Non-veg'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => openEditMenuItem(item)} className="btn-outline text-sm inline-flex items-center gap-1">
                      <Pencil size={14} /> Edit
                    </button>
                    <button onClick={() => toggleMenuAvailability(item)} className="btn-outline text-sm">
                      {item.isAvailable ? 'Hide' : 'Show'}
                    </button>
                    <button onClick={() => removeMenuItem(item)} className="btn-danger text-sm inline-flex items-center gap-1">
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>
              ))}
              {filteredMenuItems.length === 0 && (
                <div className="card p-8 text-center text-gray-500 md:col-span-2 xl:col-span-3">No menu items yet.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {confirmRejectOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6">
            <h3 className="text-lg font-bold text-ink">Reject this restaurant?</h3>
            <p className="text-sm text-gray-600 mt-2">
              This action will reject the restaurant and it will also be paused.
            </p>
            <div className="flex items-center justify-end gap-2 mt-6">
              <button
                onClick={() => setConfirmRejectOpen(false)}
                className="btn-outline"
                disabled={rejecting}
              >
                Cancel
              </button>
              <button
                onClick={confirmReject}
                className="btn-danger"
                disabled={rejecting}
              >
                {rejecting ? 'Rejecting...' : 'Confirm Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTargetItem && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6">
            <h3 className="text-lg font-bold text-ink">Delete menu item?</h3>
            <p className="text-sm text-gray-600 mt-2">
              Are you sure you want to delete <span className="font-semibold">{deleteTargetItem.name}</span>? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-2 mt-6">
              <button
                onClick={() => setDeleteTargetItem(null)}
                className="btn-outline"
                disabled={deletingItem}
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteMenuItem}
                className="btn-danger"
                disabled={deletingItem}
              >
                {deletingItem ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <form onSubmit={saveEditedMenuItem} className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl p-6 space-y-4">
            <div>
              <h3 className="text-lg font-bold text-ink">Edit menu item</h3>
              <p className="text-sm text-gray-500 mt-1">Update details and save changes.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Name" value={editingItemForm.name} onChange={(value) => setEditingItemForm((s) => ({ ...s, name: value }))} required />
              <Field label="Category" value={editingItemForm.category} onChange={(value) => setEditingItemForm((s) => ({ ...s, category: value }))} required />
              <Field label="Price (INR)" type="number" value={editingItemForm.price} onChange={(value) => setEditingItemForm((s) => ({ ...s, price: value }))} required />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5">Description</label>
              <textarea
                value={editingItemForm.description}
                onChange={(e) => setEditingItemForm((s) => ({ ...s, description: e.target.value }))}
                className="input min-h-24"
                required
              />
            </div>

            <div className="flex items-center gap-6 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editingItemForm.isVegetarian}
                  onChange={(e) => setEditingItemForm((s) => ({ ...s, isVegetarian: e.target.checked }))}
                  className="w-4 h-4 accent-primary"
                />
                Vegetarian
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editingItemForm.isAvailable}
                  onChange={(e) => setEditingItemForm((s) => ({ ...s, isAvailable: e.target.checked }))}
                  className="w-4 h-4 accent-primary"
                />
                Available now
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="btn-outline"
                disabled={savingEditedItem}
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={savingEditedItem}>
                {savingEditedItem ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div className="rounded-xl bg-gray-50 border border-gray-100 px-4 py-3">
      <p className="text-xs text-gray-500 font-medium mb-1">{label}</p>
      <p className="text-sm text-ink font-semibold break-words">{value}</p>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', required = false }) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input"
        required={required}
      />
    </div>
  );
}
