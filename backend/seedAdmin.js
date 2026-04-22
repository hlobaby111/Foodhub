require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Settings = require('./models/Settings');

(async () => {
  await mongoose.connect(process.env.MONGO_URL);

  const phone = '9999999999';
  const existing = await User.findOne({ phone });
  if (!existing) {
    await User.create({
      name: 'Super Admin',
      email: 'admin@foodhub.com',
      phone,
      role: 'admin',
      isPhoneVerified: true,
      isActive: true
    });
    console.log('✅ Admin created — phone:', phone);
  } else {
    existing.role = 'admin';
    await existing.save();
    console.log('✅ Admin role ensured on existing user');
  }

  await Settings.getSettings();
  console.log('✅ Default settings initialized');

  await mongoose.disconnect();
})();
