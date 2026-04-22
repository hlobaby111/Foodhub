import { X, MapPin, Phone, User, Store, Bike, CreditCard, Package, Clock, AlertCircle } from 'lucide-react';
import { useState } from 'react';

const statusSteps = [
  { key: 'placed', label: 'Placed' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'preparing', label: 'Preparing' },
  { key: 'ready', label: 'Ready' },
  { key: 'picked_up', label: 'Picked Up' },
  { key: 'out_for_delivery', label: 'Out for Delivery' },
  { key: 'delivered', label: 'Delivered' }
];

const statusBadge = {
  pending: 'badge-yellow', confirmed: 'badge-blue', preparing: 'badge-blue',
  ready: 'badge-blue', out_for_delivery: 'badge-blue', placed: 'badge-yellow',
  delivered: 'badge-green', cancelled: 'badge-red', accepted: 'badge-blue',
  picked_up: 'badge-blue'
};

export default function OrderDetailModal({ order, onClose, onCancelOrder, onAssignDelivery, onIssueRefund }) {
  const [assigningDelivery, setAssigningDelivery] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [issuingRefund, setIssuingRefund] = useState(false);

  if (!order) return null;

  const currentStatusIndex = statusSteps.findIndex(s => s.key === order.orderStatus);

  const handleCancelOrder = async () => {
    const reason = prompt('Enter cancellation reason (admin):');
    if (!reason) return;
    setCanceling(true);
    try {
      await onCancelOrder(order._id, reason);
    } finally {
      setCanceling(false);
    }
  };

  const handleAssignDelivery = async () => {
    const partnerId = prompt('Enter Delivery Partner ID:');
    if (!partnerId) return;
    setAssigningDelivery(true);
    try {
      await onAssignDelivery(order._id, partnerId);
    } finally {
      setAssigningDelivery(false);
    }
  };

  const handleIssueRefund = async () => {
    if (!confirm(`Issue refund of ₹${order.totalAmount}?`)) return;
    const reason = prompt('Enter refund reason:');
    if (!reason) return;
    setIssuingRefund(true);
    try {
      await onIssueRefund(order._id, reason, order.totalAmount);
    } finally {
      setIssuingRefund(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-ink">Order Details</h2>
            <p className="text-sm text-gray-500">#{order._id?.slice(-8).toUpperCase()}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status Badge */}
          <div className="flex items-center justify-between">
            <span className={`badge ${statusBadge[order.orderStatus] || 'badge-gray'} text-base px-4 py-2`}>
              {order.orderStatus?.toUpperCase()}
            </span>
            <div className="text-right">
              <p className="text-sm text-gray-500">Ordered</p>
              <p className="text-sm font-semibold">{new Date(order.createdAt).toLocaleString()}</p>
            </div>
          </div>

          {/* Timeline */}
          <div className="card p-4">
            <h3 className="font-bold text-ink mb-4 flex items-center gap-2">
              <Clock size={18} /> Order Timeline
            </h3>
            <div className="space-y-3">
              {statusSteps.map((step, idx) => {
                const isActive = idx <= currentStatusIndex;
                const statusEntry = order.statusHistory?.find(h => h.status === step.key);
                return (
                  <div key={step.key} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isActive ? 'bg-primary text-white' : 'bg-gray-200 text-gray-400'
                    }`}>
                      {isActive ? '✓' : idx + 1}
                    </div>
                    <div className="flex-1">
                      <p className={`font-medium ${isActive ? 'text-ink' : 'text-gray-400'}`}>{step.label}</p>
                      {statusEntry && (
                        <p className="text-xs text-gray-500">{new Date(statusEntry.timestamp).toLocaleString()}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Customer Info */}
          <div className="card p-4">
            <h3 className="font-bold text-ink mb-3 flex items-center gap-2">
              <User size={18} /> Customer Information
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Name:</span>
                <span className="font-semibold">{order.customer?.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Phone:</span>
                <span className="font-semibold">{order.customer?.phone || order.customerPhone || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Email:</span>
                <span className="font-semibold">{order.customer?.email || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Restaurant Info */}
          <div className="card p-4">
            <h3 className="font-bold text-ink mb-3 flex items-center gap-2">
              <Store size={18} /> Restaurant Information
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Name:</span>
                <span className="font-semibold">{order.restaurant?.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Phone:</span>
                <span className="font-semibold">{order.restaurant?.phone || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Location:</span>
                <span className="font-semibold text-right">{order.restaurant?.location || 'N/A'}</span>
              </div>
            </div>
          </div>

          {/* Delivery Partner Info */}
          {order.deliveryPartner && (
            <div className="card p-4">
              <h3 className="font-bold text-ink mb-3 flex items-center gap-2">
                <Bike size={18} /> Delivery Partner
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-semibold">{order.deliveryPartner?.name || order.deliveryPartner?.user?.name || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Phone:</span>
                  <span className="font-semibold">{order.deliveryPartner?.phone || order.deliveryPartner?.user?.phone || 'N/A'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Delivery Address */}
          <div className="card p-4">
            <h3 className="font-bold text-ink mb-3 flex items-center gap-2">
              <MapPin size={18} /> Delivery Address
            </h3>
            <p className="text-sm text-gray-700">
              {order.deliveryAddress?.street}, {order.deliveryAddress?.city}, {order.deliveryAddress?.state} - {order.deliveryAddress?.pincode}
            </p>
            {order.notes && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-1">Delivery Instructions:</p>
                <p className="text-sm text-gray-700">{order.notes}</p>
              </div>
            )}
          </div>

          {/* Order Items */}
          <div className="card p-4">
            <h3 className="font-bold text-ink mb-3 flex items-center gap-2">
              <Package size={18} /> Order Items
            </h3>
            <div className="space-y-3">
              {order.items?.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start">
                  <div className="flex-1">
                    <p className="font-medium text-ink">{item.name}</p>
                    <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-semibold">₹{item.price * item.quantity}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Info */}
          <div className="card p-4">
            <h3 className="font-bold text-ink mb-3 flex items-center gap-2">
              <CreditCard size={18} /> Payment Information
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Method:</span>
                <span className="font-semibold uppercase">{order.paymentMethod || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Status:</span>
                <span className={`badge ${order.paymentStatus === 'completed' ? 'badge-green' : 'badge-yellow'}`}>
                  {order.paymentStatus}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-100">
                <span className="text-gray-600">Subtotal:</span>
                <span>₹{order.totalAmount || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Delivery Fee:</span>
                <span>₹{order.deliveryFee || 40}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">GST:</span>
                <span>₹{order.gst || 0}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-200 font-bold text-base">
                <span>Total:</span>
                <span>₹{order.totalAmount || 0}</span>
              </div>
            </div>
          </div>

          {/* Admin Actions */}
          {order.orderStatus !== 'delivered' && order.orderStatus !== 'cancelled' && (
            <div className="card p-4 bg-gray-50">
              <h3 className="font-bold text-ink mb-3 flex items-center gap-2">
                <AlertCircle size={18} /> Admin Actions
              </h3>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={handleCancelOrder}
                  disabled={canceling}
                  className="btn-danger flex items-center gap-2 disabled:opacity-50"
                >
                  {canceling ? 'Canceling...' : 'Cancel Order'}
                </button>
                {!order.deliveryPartner && order.orderStatus === 'ready' && (
                  <button
                    onClick={handleAssignDelivery}
                    disabled={assigningDelivery}
                    className="btn-primary flex items-center gap-2 disabled:opacity-50"
                  >
                    {assigningDelivery ? 'Assigning...' : 'Assign Delivery Partner'}
                  </button>
                )}
                {order.paymentStatus === 'completed' && order.orderStatus === 'cancelled' && (
                  <button
                    onClick={handleIssueRefund}
                    disabled={issuingRefund}
                    className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50"
                  >
                    {issuingRefund ? 'Processing...' : 'Issue Refund'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Cancel Reason */}
          {order.cancelReason && (
            <div className="card p-4 bg-red-50 border-2 border-red-200">
              <h3 className="font-bold text-red-900 mb-2">Cancellation Reason</h3>
              <p className="text-sm text-red-700">{order.cancelReason}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
