const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, trim: true },
  email: { type: String, lowercase: true, trim: true, sparse: true },
  password: { type: String }, // Optional for OTP-based auth
  phone: { type: String, required: true, unique: true, trim: true },
  role: {
    type: String,
    enum: ['customer', 'restaurant_owner', 'admin', 'delivery_partner'],
    default: 'customer'
  },
  isPhoneVerified: { type: Boolean, default: false },
  isEmailVerified: { type: Boolean, default: false },
  address: { street: String, city: String, state: String, pincode: String },
  savedAddresses: [{
    label: { type: String, default: 'Home' },
    street: String,
    city: String,
    state: String,
    pincode: String,
    lat: Number,
    lng: Number,
    isDefault: { type: Boolean, default: false }
  }],
  currentLocation: { lat: Number, lng: Number, updatedAt: Date },
  isAvailable: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);
