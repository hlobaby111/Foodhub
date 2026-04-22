import { useEffect, useMemo, useState } from 'react';
import { Plus, Edit2, Trash2, Search, Loader2, X } from 'lucide-react';
import {
  createMenuItem,
  deleteMenuItem,
  getMyMenuItems,
  getMyRestaurants,
  updateMenuItem,
  uploadMenuItemImage,
} from '../api/restaurant';

const defaultItem = {
  name: '',
  description: '',
  category: '',
  price: '',
  isVegetarian: false,
  isAvailable: true,
};

export default function Menu() {
  const [activeSection, setActiveSection] = useState('menu-items');
  const [search, setSearch] = useState('');
  const [items, setItems] = useState([]);
  const [restaurantId, setRestaurantId] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newItem, setNewItem] = useState(defaultItem);
  const [itemImage, setItemImage] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [updatingAvailabilityId, setUpdatingAvailabilityId] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [editingItemForm, setEditingItemForm] = useState(defaultItem);
  const [savingEditedItem, setSavingEditedItem] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const [menuRes, restaurantsRes] = await Promise.all([getMyMenuItems(), getMyRestaurants()]);
      setItems(menuRes.data.menuItems || []);
      setRestaurantId(restaurantsRes.data.restaurants?.[0]?._id || '');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load menu');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(
    () => items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase())),
    [items, search]
  );

  const openAddSection = () => {
    if (!restaurantId) {
      alert('No restaurant profile found for this account.');
      return;
    }

    setActiveSection('add-item');
  };

  const submitNewItem = async (e) => {
    e.preventDefault();

    if (!restaurantId) {
      alert('No restaurant profile found for this account.');
      return;
    }

    setSubmitLoading(true);

    let created = null;

    // STEP 1: Create item
    try {
      const res = await createMenuItem({
        restaurantId,
        name: newItem.name,
        description: newItem.description,
        category: newItem.category,
        price: Number(newItem.price),
        isVegetarian: newItem.isVegetarian,
        isAvailable: newItem.isAvailable,
      });
      created = res.data?.menuItem;
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to add item');
      setSubmitLoading(false);
      return;
    }

    // STEP 2: Upload image (optional)
    if (itemImage && created?._id) {
      try {
        await uploadMenuItemImage(created._id, itemImage);
      } catch (_) {
        alert('Item created, image failed. Add image later.');
      }
    }

    // STEP 3: Refresh + cleanup
    try {
      await load();
      setActiveSection('menu-items');
      setNewItem(defaultItem);
      setItemImage(null);
      alert('Menu item added');
    } catch (refreshErr) {
      alert(refreshErr.response?.data?.message || 'Item created but refresh failed. Please reload.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const toggleAvailability = async (item) => {
    setUpdatingAvailabilityId(item._id);
    try {
      await updateMenuItem(item._id, { isAvailable: !item.isAvailable });
      await load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update availability');
    } finally {
      setUpdatingAvailabilityId('');
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setEditingItemForm({
      name: item.name || '',
      description: item.description || '',
      category: item.category || '',
      price: String(item.price ?? ''),
      isVegetarian: Boolean(item.isVegetarian),
      isAvailable: Boolean(item.isAvailable),
    });
  };

  const saveEditedItem = async (e) => {
    e.preventDefault();
    if (!editingItem?._id) return;

    setSavingEditedItem(true);
    try {
      await updateMenuItem(editingItem._id, {
        ...editingItemForm,
        price: Number(editingItemForm.price),
      });
      await load();
      setEditingItem(null);
      alert('Menu item updated');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update item');
    } finally {
      setSavingEditedItem(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this item?')) return;
    try {
      await deleteMenuItem(id);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete item');
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          onClick={() => setActiveSection('menu-items')}
          className={`card text-left border-2 transition-colors ${activeSection === 'menu-items' ? 'border-primary' : 'border-gray-200 hover:border-gray-300'}`}
        >
          <p className="font-bold text-dark">Menu Items</p>
          <p className="text-sm text-gray-500 mt-1">View, search, edit, and hide/show your items.</p>
        </button>
        <button
          onClick={openAddSection}
          className={`card text-left border-2 transition-colors ${activeSection === 'add-item' ? 'border-primary' : 'border-gray-200 hover:border-gray-300'}`}
        >
          <p className="font-bold text-dark">Add Item</p>
          <p className="text-sm text-gray-500 mt-1">Create new menu item with optional photo upload.</p>
        </button>
      </div>

      {loading && (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-primary" /></div>
      )}

      {!loading && error && (
        <div className="card text-red-600">{error}</div>
      )}

      {!loading && !error && activeSection === 'menu-items' && (
        <div className="space-y-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search menu items..."
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary outline-none bg-white"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((it) => (
              <div key={it._id} className="card flex gap-4">
                <img
                  src={it.image?.url || 'https://via.placeholder.com/200x200?text=Food'}
                  alt={it.name}
                  className="w-24 h-24 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-dark">{it.name}</h3>
                      <p className="text-xs text-gray-500">{it.category}</p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${it.isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {it.isAvailable ? 'Available' : 'Out of stock'}
                    </span>
                  </div>
                  <p className="text-lg font-extrabold text-primary mt-2">₹{Number(it.price || 0).toLocaleString()}</p>
                  <div className="flex gap-2 mt-3 items-center">
                    <button onClick={() => handleEdit(it)} className="p-2 hover:bg-gray-100 rounded-lg"><Edit2 size={16} className="text-gray-700" /></button>
                    <button
                      onClick={() => toggleAvailability(it)}
                      className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50"
                      disabled={updatingAvailabilityId === it._id}
                    >
                      {updatingAvailabilityId === it._id
                        ? 'Updating...'
                        : it.isAvailable
                        ? 'Not Available'
                        : 'Available'}
                    </button>
                    <button onClick={() => handleDelete(it._id)} className="p-2 hover:bg-red-50 rounded-lg"><Trash2 size={16} className="text-red-600" /></button>
                  </div>
                </div>
              </div>
            ))}
            {filtered.length === 0 && <div className="card text-gray-500">No menu items found.</div>}
          </div>
        </div>
      )}

      {!loading && !error && activeSection === 'add-item' && (
        <form onSubmit={submitNewItem} className="card p-6 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-bold text-dark">Add Menu Item</h3>
              <button
                type="button"
                onClick={() => setActiveSection('menu-items')}
                className="p-2 rounded-lg hover:bg-gray-100"
                disabled={submitLoading}
              >
                <X size={18} />
              </button>
            </div>

            <fieldset disabled={submitLoading} className="space-y-4 disabled:opacity-60">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
                  <input
                    type="text"
                    value={newItem.name}
                    onChange={(e) => setNewItem((s) => ({ ...s, name: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary outline-none bg-white text-dark"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
                  <input
                    type="text"
                    value={newItem.category}
                    onChange={(e) => setNewItem((s) => ({ ...s, category: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary outline-none bg-white text-dark"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Price (INR)</label>
                  <input
                    type="number"
                    min="1"
                    value={newItem.price}
                    onChange={(e) => setNewItem((s) => ({ ...s, price: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary outline-none bg-white text-dark"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Photo (optional)</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary outline-none bg-white text-dark"
                    onChange={(e) => setItemImage(e.target.files?.[0] || null)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                <textarea
                  value={newItem.description}
                  onChange={(e) => setNewItem((s) => ({ ...s, description: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary outline-none bg-white text-dark min-h-24"
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

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveSection('menu-items')}
                  className="btn-outline"
                  disabled={submitLoading}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submitLoading}>
                  {submitLoading ? 'Creating...' : 'Create Item'}
                </button>
              </div>
            </fieldset>
          </form>
      )}

      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <form onSubmit={saveEditedItem} className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl p-6 space-y-4">
            <div>
              <h3 className="text-lg font-bold text-dark">Edit Menu Item</h3>
              <p className="text-sm text-gray-500 mt-1">Update details and save changes.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
                <input
                  type="text"
                  value={editingItemForm.name}
                  onChange={(e) => setEditingItemForm((s) => ({ ...s, name: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary outline-none bg-white text-dark"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
                <input
                  type="text"
                  value={editingItemForm.category}
                  onChange={(e) => setEditingItemForm((s) => ({ ...s, category: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary outline-none bg-white text-dark"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Price (INR)</label>
                <input
                  type="number"
                  min="1"
                  value={editingItemForm.price}
                  onChange={(e) => setEditingItemForm((s) => ({ ...s, price: e.target.value }))}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary outline-none bg-white text-dark"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
              <textarea
                value={editingItemForm.description}
                onChange={(e) => setEditingItemForm((s) => ({ ...s, description: e.target.value }))}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-primary outline-none bg-white text-dark min-h-24"
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
