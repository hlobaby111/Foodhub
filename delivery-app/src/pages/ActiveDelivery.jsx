import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Phone, CheckCircle, Navigation } from 'lucide-react';

export default function ActiveDelivery() {
  const navigate = useNavigate();
  const [order, setOrder] = useState({
    id: 'ORD001',
    restaurant: 'Tandoori Express',
    restaurantPhone: '+91 98765 43210',
    customer: 'Rajesh Kumar',
    customerPhone: '+91 98765 12345',
    pickupAddress: '123 MG Road, Bangalore',
    deliveryAddress: '456 Park Street, Bangalore',
    items: [
      { name: 'Butter Chicken', qty: 1 },
      { name: 'Garlic Naan', qty: 2 }
    ],
    otp: '4825',
    payment: 45,
    status: 'picked_up' // picked_up, on_the_way, arriving, delivered
  });

  const handleUpdateStatus = (newStatus) => {
    setOrder({ ...order, status: newStatus });
    // API call to update status
  };

  const handleComplete = () => {
    const enteredOtp = prompt('Enter 4-digit OTP from customer:');
    if (enteredOtp === order.otp) {
      alert(`Delivery completed! You earned ₹${order.payment}`);
      navigate('/dashboard');
    } else {
      alert('Invalid OTP. Please try again.');
    }
  };

  const statusFlow = [
    { key: 'picked_up', label: 'Picked Up', action: 'Mark Picked Up' },
    { key: 'on_the_way', label: 'On the Way', action: 'Start Delivery' },
    { key: 'arriving', label: 'Arriving', action: 'I\'m Arriving' },
    { key: 'delivered', label: 'Delivered', action: 'Complete Delivery' }
  ];

  const currentIndex = statusFlow.findIndex(s => s.key === order.status);
  const nextStatus = statusFlow[currentIndex + 1];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-green-600 text-white p-4 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-white/10 rounded-lg">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h2 className="font-bold">Active Delivery</h2>
            <p className="text-sm opacity-90">Order #{order.id}</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 space-y-4">
        {/* Earnings Banner */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-2xl p-6 shadow-lg">
          <p className="text-sm opacity-90 mb-1">You'll earn</p>
          <p className="text-4xl font-bold">₹{order.payment}</p>
          <p className="text-sm opacity-90 mt-1">for this delivery</p>
        </div>

        {/* Status Progress */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h3 className="font-bold text-gray-900 mb-4">Delivery Status</h3>
          <div className="space-y-3">
            {statusFlow.map((step, idx) => {
              const isActive = idx <= currentIndex;
              const isCurrent = idx === currentIndex;
              return (
                <div key={step.key} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isActive ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-400'
                  }`}>
                    {isActive ? <CheckCircle size={16} /> : idx + 1}
                  </div>
                  <div className="flex-1">
                    <p className={`font-semibold ${
                      isActive ? 'text-gray-900' : 'text-gray-400'
                    }`}>{step.label}</p>
                  </div>
                  {isCurrent && <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">Current</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Restaurant Info */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h3 className="font-bold text-gray-900 mb-3">Restaurant</h3>
          <p className="font-semibold text-lg mb-2">{order.restaurant}</p>
          <div className="flex items-center gap-2 text-gray-600 mb-3">
            <MapPin size={16} />
            <p className="text-sm">{order.pickupAddress}</p>
          </div>
          <a
            href={`tel:${order.restaurantPhone}`}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
          >
            <Phone size={16} />
            Call Restaurant
          </a>
        </div>

        {/* Customer Info */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h3 className="font-bold text-gray-900 mb-3">Customer</h3>
          <p className="font-semibold text-lg mb-2">{order.customer}</p>
          <div className="flex items-center gap-2 text-gray-600 mb-3">
            <MapPin size={16} />
            <p className="text-sm">{order.deliveryAddress}</p>
          </div>
          <div className="flex gap-2">
            <a
              href={`tel:${order.customerPhone}`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
            >
              <Phone size={16} />
              Call Customer
            </a>
            <button
              onClick={() => window.open(`https://maps.google.com/?q=${encodeURIComponent(order.deliveryAddress)}`, '_blank')}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
            >
              <Navigation size={16} />
              Navigate
            </button>
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-2xl shadow-md p-6">
          <h3 className="font-bold text-gray-900 mb-3">Order Items</h3>
          <div className="space-y-2">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span className="text-gray-700">{item.name}</span>
                <span className="text-gray-500">x{item.qty}</span>
              </div>
            ))}
          </div>
        </div>

        {/* OTP Display */}
        {order.status === 'arriving' && (
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-6">
            <h3 className="font-bold text-gray-900 mb-2">Delivery OTP</h3>
            <p className="text-sm text-gray-600 mb-3">Show this OTP to customer before marking as delivered</p>
            <p className="text-5xl font-bold text-center text-yellow-700 tracking-widest">{order.otp}</p>
          </div>
        )}

        {/* Action Button */}
        {nextStatus ? (
          <button
            onClick={() => nextStatus.key === 'delivered' ? handleComplete() : handleUpdateStatus(nextStatus.key)}
            className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-bold text-lg rounded-xl shadow-lg transition-colors"
          >
            {nextStatus.action}
          </button>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <CheckCircle size={48} className="mx-auto mb-3 text-green-600" />
            <p className="font-semibold">Delivery Completed!</p>
          </div>
        )}
      </div>
    </div>
  );
}
