const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  phone: { type: String, trim: true },
  role: {
    type: String,
    enum: ['customer', 'restaurant_owner', 'admin', 'delivery_partner'],
    default: 'customer'
  },
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
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
