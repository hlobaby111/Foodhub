import { useEffect, useMemo, useState } from 'react';
import { Clock, CheckCircle2, XCircle, Package, Loader2 } from 'lucide-react';
import { getRestaurantOrders, updateOrderStatus } from '../api/restaurant';

const FILTER_TO_STATUS = {
  all: null,
  new: 'placed',
  preparing: 'preparing',
  ready: 'ready',
  delivered: 'delivered',
};

export default function Orders() {
  const [filter, setFilter] = useState('all');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadOrders = async (statusKey = filter) => {
    try {
      setLoading(true);
      setError('');
      const res = await getRestaurantOrders(FILTER_TO_STATUS[statusKey]);
      setOrders(res.data.orders || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders(filter);
  }, [filter]);

  const changeStatus = async (id, status) => {
    try {
      await updateOrderStatus(id, status);
      loadOrders(filter);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update order');
    }
  };

  const filtered = useMemo(() => orders, [orders]);

  const filters = [
    { key: 'all', label: 'All Orders' },
    { key: 'new', label: 'New' },
    { key: 'preparing', label: 'Preparing' },
    { key: 'ready', label: 'Ready' },
    { key: 'delivered', label: 'Delivered' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex gap-2 flex-wrap">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
              filter === f.key ? 'bg-primary text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-primary" /></div>
      ) : error ? (
        <div className="card text-red-600">{error}</div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((o) => (
            <div key={o._id} className="card">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-bold text-dark">#{o.orderNumber || o._id.slice(-6).toUpperCase()}</h3>
                    <span className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock size={12} /> {new Date(o.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">{o.customer?.name || o.customer?.phone || 'Customer'}</p>
                </div>
                <p className="text-xl font-extrabold text-primary">₹{Number(o.totalAmount || 0).toLocaleString()}</p>
              </div>
              <div className="border-t border-gray-100 pt-3 mb-4">
                {(o.items || []).map((it, idx) => (
                  <p key={`${o._id}-${idx}`} className="text-sm text-gray-700">• {it.name} x{it.quantity}</p>
                ))}
              </div>
              {o.orderStatus === 'placed' && (
                <div className="flex gap-3">
                  <button
                    onClick={() => changeStatus(o._id, 'preparing')}
                    className="btn-primary flex items-center gap-2 flex-1 justify-center"
                  >
                    <CheckCircle2 size={18} /> Accept Order
                  </button>
                  <button
                    onClick={() => changeStatus(o._id, 'cancelled')}
                    className="border-2 border-gray-300 text-gray-700 font-semibold px-6 py-3 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                  >
                    <XCircle size={18} /> Reject
                  </button>
                </div>
              )}
              {o.orderStatus === 'preparing' && (
                <button onClick={() => changeStatus(o._id, 'ready')} className="btn-primary flex items-center gap-2">
                  <Package size={18} /> Mark as Ready
                </button>
              )}
              {o.orderStatus === 'ready' && (
                <span className="inline-flex items-center gap-2 text-blue-700 bg-blue-50 px-4 py-2 rounded-lg font-semibold text-sm">
                  Waiting for delivery partner pickup
                </span>
              )}
              {o.orderStatus === 'delivered' && (
                <span className="inline-flex items-center gap-2 text-green-700 bg-green-50 px-4 py-2 rounded-lg font-semibold text-sm">
                  <CheckCircle2 size={16} /> Delivered successfully
                </span>
              )}
              {o.orderStatus === 'cancelled' && (
                <span className="inline-flex items-center gap-2 text-red-700 bg-red-50 px-4 py-2 rounded-lg font-semibold text-sm">
                  Cancelled
                </span>
              )}
            </div>
          ))}
          {filtered.length === 0 && <div className="card text-gray-500">No orders found.</div>}
        </div>
      )}
    </div>
  );
}
