import { useCallback, useEffect, useMemo, useState } from 'react';
import { Clock, CheckCircle2, XCircle, Package, Loader2 } from 'lucide-react';
import { io } from 'socket.io-client';
import { getRestaurantOrders, updateOrderStatus } from '../api/restaurant';
import { getAccessToken } from '../auth/session';

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

  const upsertOrder = useCallback((incoming) => {
    if (!incoming?._id) return;
    setOrders((prev) => {
      const idx = prev.findIndex((o) => o._id === incoming._id);
      if (idx === -1) return [incoming, ...prev];
      const next = [...prev];
      next[idx] = incoming;
      return next;
    });
  }, []);

  const loadOrders = useCallback(async (statusKey = filter, keepLoadingState = false) => {
    try {
      if (!keepLoadingState) {
        setLoading(true);
      }
      setError('');
      const res = await getRestaurantOrders(FILTER_TO_STATUS[statusKey]);
      setOrders(res.data.orders || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load orders');
    } finally {
      if (!keepLoadingState) {
        setLoading(false);
      }
    }
  }, [filter]);

  useEffect(() => {
    loadOrders(filter);
  }, [filter, loadOrders]);

  useEffect(() => {
    // Refresh when tab becomes visible or user returns focus.
    const refreshOnFocus = () => loadOrders(filter, true);
    const refreshOnVisibility = () => {
      if (document.visibilityState === 'visible') {
        refreshOnFocus();
      }
    };

    // Lightweight polling keeps dashboard fresh even without navigation.
    const intervalId = setInterval(() => refreshOnFocus(), 10000);
    window.addEventListener('focus', refreshOnFocus);
    document.addEventListener('visibilitychange', refreshOnVisibility);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener('focus', refreshOnFocus);
      document.removeEventListener('visibilitychange', refreshOnVisibility);
    };
  }, [filter, loadOrders]);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return undefined;

    const backendBase = (import.meta.env.VITE_API_URL || '').replace(/\/api\/?$/, '');
    const socket = io(backendBase, {
      path: '/api/socket.io',
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    const onOrderCreated = (payload) => upsertOrder(payload?.order || payload);
    const onOrderUpdate = (payload) => upsertOrder(payload?.order || payload);

    socket.on('order_created', onOrderCreated);
    socket.on('order_update', onOrderUpdate);

    return () => {
      socket.off('order_created', onOrderCreated);
      socket.off('order_update', onOrderUpdate);
      socket.disconnect();
    };
  }, [upsertOrder]);

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
              {['placed', 'accepted', 'preparing', 'ready'].includes(o.orderStatus) && (
                <div className="flex gap-2 mb-4">
                  <button
                    onClick={() => changeStatus(o._id, 'preparing')}
                    disabled={['preparing', 'ready', 'picked_up', 'out_for_delivery', 'delivered', 'cancelled'].includes(o.orderStatus)}
                    className="px-3 py-2 rounded-lg text-sm font-semibold bg-yellow-50 text-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Preparing
                  </button>
                  <button
                    onClick={() => changeStatus(o._id, 'ready')}
                    disabled={!['preparing', 'accepted'].includes(o.orderStatus)}
                    className="px-3 py-2 rounded-lg text-sm font-semibold bg-blue-50 text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Ready
                  </button>
                </div>
              )}
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
