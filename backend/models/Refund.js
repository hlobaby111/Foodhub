const mongoose = require('mongoose');

const refundSchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' },
  amount: { type: Number, required: true },
  isPartial: { type: Boolean, default: false },
  reason: { type: String, required: true },
  customerNote: { type: String },
  adminNote: { type: String },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'processed', 'failed'],
    default: 'pending'
  },
  razorpayRefundId: { type: String },
  processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  processedAt: { type: Date }
}, { timestamps: true });

refundSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Refund', refundSchema);
