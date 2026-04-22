const mongoose = require('mongoose');

const deliveryPartnerSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  city: { type: String, required: true },
  vehicleType: { type: String, enum: ['bike', 'scooter', 'cycle'], default: 'bike' },
  vehicleNumber: { type: String },
  licenseNumber: { type: String },
  aadhaarNumber: { type: String },
  panNumber: { type: String },
  bankAccount: {
    accountNumber: String,
    ifsc: String,
    accountHolder: String
  },
  kycStatus: { type: String, enum: ['pending', 'verified', 'rejected'], default: 'pending' },
  kycDocuments: [{ type: String, url: String }],
  status: { type: String, enum: ['pending', 'active', 'inactive', 'suspended'], default: 'pending' },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  totalDeliveries: { type: Number, default: 0 },
  totalEarnings: { type: Number, default: 0 },
  onTimePercent: { type: Number, default: 0 },
  isOnline: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('DeliveryPartner', deliveryPartnerSchema);
