const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  title: { type: String, required: true },
  description: { type: String },
  discountType: { type: String, enum: ['percent', 'flat'], required: true },
  discountValue: { type: Number, required: true },
  maxDiscount: { type: Number, default: 0 }, // for percent type cap
  minOrderValue: { type: Number, default: 0 },
  target: {
    type: String,
    enum: ['all_users', 'new_users', 'specific_restaurants'],
    default: 'all_users'
  },
  restaurants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant' }],
  usageLimit: { type: Number, default: 1000 },
  usageCount: { type: Number, default: 0 },
  perUserLimit: { type: Number, default: 1 },
  validFrom: { type: Date, default: Date.now },
  validUntil: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

offerSchema.index({ code: 1 });
offerSchema.index({ isActive: 1, validUntil: 1 });

module.exports = mongoose.model('Offer', offerSchema);
