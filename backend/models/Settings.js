const mongoose = require('mongoose');

// Single-document collection — store platform-wide config
const settingsSchema = new mongoose.Schema({
  key: { type: String, default: 'global', unique: true },
  // Platform fees
  platformFee: { type: Number, default: 5 },
  gstPercent: { type: Number, default: 5 },
  defaultCommissionPercent: { type: Number, default: 18 },
  // Delivery
  defaultDeliveryRadiusKm: { type: Number, default: 5 },
  baseDeliveryCharge: { type: Number, default: 29 },
  perKmCharge: { type: Number, default: 8 },
  surgePricingEnabled: { type: Boolean, default: true },
  surgeMultiplier: { type: Number, default: 1.5 },
  // Order rules
  minimumOrderValue: { type: Number, default: 99 },
  freeCancellationWindowMin: { type: Number, default: 2 },
  cancellationFee: { type: Number, default: 20 },
  // Emergency
  platformPaused: { type: Boolean, default: false },
  pauseReason: { type: String },
  pausedAt: { type: Date },
  pausedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

settingsSchema.statics.getSettings = async function () {
  let doc = await this.findOne({ key: 'global' });
  if (!doc) doc = await this.create({ key: 'global' });
  return doc;
};

module.exports = mongoose.model('Settings', settingsSchema);
