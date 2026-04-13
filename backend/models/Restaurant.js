const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  email: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  address: { street: String, city: String, state: String, pincode: String },
  location: { type: String, required: true },
  coordinates: { lat: { type: Number, default: 19.076 }, lng: { type: Number, default: 72.8777 } },
  cuisineType: [{ type: String, trim: true }],
  photos: [{ url: String, storagePath: String }],
  coverImage: { url: String, storagePath: String },
  isVeg: { type: Boolean, default: false },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  totalReviews: { type: Number, default: 0 },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  isActive: { type: Boolean, default: true },
  openingHours: { type: String, default: '9:00 AM - 10:00 PM' },
  minimumOrder: { type: Number, default: 0 },
  deliveryTime: { type: String, default: '30-40 mins' },
  avgPrepTime: { type: Number, default: 25 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Restaurant', restaurantSchema);
