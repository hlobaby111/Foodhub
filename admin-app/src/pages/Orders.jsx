import { useState } from 'react';
import { Eye, Loader2, Download } from 'lucide-react';
import { listOrders, getOrderDetails, adminCancelOrder, adminAssignDelivery, adminIssueRefund } from '../api/admin';
import { useApi } from '../hooks/useApi';
import OrderDetailModal from '../components/OrderDetailModal';
import { exportToCSV, formatOrdersForExport } from '../utils/csvExport';

const statusBadge = {
  pending: 'badge-yellow', confirmed: 'badge-blue', preparing: 'badge-blue',
  ready: 'badge-blue', out_for_delivery: 'badge-blue',
  delivered: 'badge-green', cancelled: 'badge-red',
};

export default function Orders() {
  const [tab, setTab] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const { data, loading, refetch } = useApi(
    () => listOrders({ limit: 100, status: tab === 'all' ? undefined : tab }),
    [tab]
  );

  const orders = data?.orders || [];

  const handleViewOrder = async (orderId) => {
    setLoadingDetail(true);
    try {
      const res = await getOrderDetails(orderId);
      setSelectedOrder(res.data.order);
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to load order');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleCancelOrder = async (orderId, reason) => {
    try {
      await adminCancelOrder(orderId, reason);
      alert('Order cancelled successfully');
      setSelectedOrder(null);
      refetch();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to cancel order');
    }
  };

  const handleAssignDelivery = async (orderId, partnerId) => {
    try {
      await adminAssignDelivery(orderId, partnerId);
      alert('Delivery partner assigned successfully');
      setSelectedOrder(null);
      refetch();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to assign delivery');
    }
  };

  const handleIssueRefund = async (orderId, reason, amount) => {
    try {
      await adminIssueRefund(orderId, reason, amount);
      alert('Refund issued successfully');
      setSelectedOrder(null);
      refetch();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to issue refund');
    }
  };

  const handleExport = () => {
    const formatted = formatOrdersForExport(orders);
    exportToCSV(formatted, 'orders');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-ink">Order Management</h1>
          <p className="text-sm text-gray-500">Track all platform orders in real-time</p>
        </div>
        <button onClick={handleExport} className="btn-primary flex items-center gap-2">
          <Download size={16} /> Export CSV
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {['all', 'pending', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'].map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize ${tab === t ? 'bg-primary text-white' : 'bg-white text-gray-700 border border-gray-200'}`}>
            {t.replace(/_/g, ' ')}
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
                <th className="px-6 py-3 text-left">Order ID</th>
                <th className="px-6 py-3 text-left">Customer</th>
                <th className="px-6 py-3 text-left">Restaurant</th>
                <th className="px-6 py-3 text-right">Total</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Time</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o._id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-6 py-4 font-semibold text-ink">#{o._id.slice(-6).toUpperCase()}</td>
                  <td className="px-6 py-4 text-gray-700">{o.customer?.name || '—'}</td>
                  <td className="px-6 py-4 text-gray-700">{o.restaurant?.name || '—'}</td>
                  <td className="px-6 py-4 text-right font-semibold">₹{o.totalAmount}</td>
                  <td className="px-6 py-4"><span className={`badge ${statusBadge[o.orderStatus] || 'badge-gray'}`}>{o.orderStatus}</span></td>
                  <td className="px-6 py-4 text-gray-500">{new Date(o.createdAt).toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => handleViewOrder(o._id)}
                      disabled={loadingDetail}
                      className="p-1.5 hover:bg-gray-100 rounded-lg float-right disabled:opacity-50"
                    >
                      <Eye size={16} className="text-gray-600" />
                    </button>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && <tr><td colSpan="7" className="text-center py-12 text-gray-500">No orders found</td></tr>}
            </tbody>
          </table>
        )}
      </div>

      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onCancelOrder={handleCancelOrder}
          onAssignDelivery={handleAssignDelivery}
          onIssueRefund={handleIssueRefund}
        />
      )}
    </div>
  );
}
