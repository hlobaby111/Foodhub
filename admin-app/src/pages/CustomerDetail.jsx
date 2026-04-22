import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Mail, Phone, Calendar, ShoppingBag, DollarSign, Loader2, Ban } from 'lucide-react';
import { getUserDetails, toggleUserStatus } from '../api/admin';

const statusBadge = {
  pending: 'badge-yellow', confirmed: 'badge-blue', preparing: 'badge-blue',
  ready: 'badge-blue', out_for_delivery: 'badge-blue',
  delivered: 'badge-green', cancelled: 'badge-red',
};

export default function CustomerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getUserDetails(id);
      setData(res.data);
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to load customer');
      navigate('/customers');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!confirm(`${data.user.isActive ? 'Block' : 'Unblock'} this customer?`)) return;
    setToggling(true);
    try {
      await toggleUserStatus(id);
      await loadData();
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to update status');
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" size={32} /></div>;
  }

  const { user, orders, stats } = data;

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/customers')} className="flex items-center gap-2 text-gray-600 hover:text-ink">
        <ArrowLeft size={18} /> Back to Customers
      </button>

      <div className="card p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {user.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-ink">{user.name || 'Guest User'}</h1>
              <p className="text-sm text-gray-500">Customer ID: {user._id}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <span className={`badge ${user.isActive ? 'badge-green' : 'badge-red'}`}>
              {user.isActive ? 'Active' : 'Blocked'}
            </span>
            <button
              onClick={handleToggleStatus}
              disabled={toggling}
              className="btn-outline flex items-center gap-2 disabled:opacity-50"
            >
              <Ban size={16} />
              {toggling ? 'Processing...' : user.isActive ? 'Block User' : 'Unblock User'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <Mail className="text-gray-400" size={20} />
            <div>
              <p className="text-xs text-gray-500">Email</p>
              <p className="font-semibold text-ink">{user.email || 'N/A'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <Phone className="text-gray-400" size={20} />
            <div>
              <p className="text-xs text-gray-500">Phone</p>
              <p className="font-semibold text-ink">{user.phone || 'N/A'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            <Calendar className="text-gray-400" size={20} />
            <div>
              <p className="text-xs text-gray-500">Joined</p>
              <p className="font-semibold text-ink">{new Date(user.createdAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <ShoppingBag className="text-primary" size={22} />
            <h3 className="font-bold text-ink">Total Orders</h3>
          </div>
          <p className="text-4xl font-extrabold text-ink">{stats.totalOrders}</p>
        </div>
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="text-green-600" size={22} />
            <h3 className="font-bold text-ink">Total Spent</h3>
          </div>
          <p className="text-4xl font-extrabold text-ink">₹{stats.totalSpent?.toLocaleString()}</p>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="font-bold text-ink mb-4">Order History</h3>
        {orders.length === 0 ? (
          <p className="text-center py-12 text-gray-500">No orders yet</p>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <div key={order._id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-ink">#{order._id.slice(-8).toUpperCase()}</p>
                    <p className="text-sm text-gray-600">{order.restaurant?.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-ink">₹{order.totalAmount}</p>
                    <span className={`badge ${statusBadge[order.orderStatus]}`}>{order.orderStatus}</span>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">{new Date(order.createdAt).toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
