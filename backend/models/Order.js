const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderNumber: { type: String, required: true, unique: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  deliveryPartner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  items: [{
    menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' },
    name: String, price: Number, quantity: Number
  }],
  totalAmount: { type: Number, required: true },
  deliveryAddress: { street: String, city: String, state: String, pincode: String, lat: Number, lng: Number },
  paymentMethod: { type: String, enum: ['cash', 'online'], required: true },
  paymentStatus: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  razorpayOrderId: String,
  razorpayPaymentId: String,
  orderStatus: {
    type: String,
    enum: ['placed', 'accepted', 'preparing', 'ready', 'picked_up', 'out_for_delivery', 'delivered', 'cancelled'],
    default: 'placed'
  },
  statusHistory: [{ status: String, timestamp: { type: Date, default: Date.now } }],
  customerPhone: String,
  notes: String,
  cancellationReason: String,
  cancelledAt: Date,
  cancelledBy: { type: String, enum: ['customer', 'restaurant', 'admin'] },
  deliveryPartnerLocation: { lat: Number, lng: Number, updatedAt: Date },
  estimatedDelivery: Date,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);
