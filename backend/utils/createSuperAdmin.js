/**
 * Run once to create the superadmin user:
 *   node utils/createSuperAdmin.js
 */
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const SUPER_ADMIN_PHONE = '7206111151';
const SUPER_ADMIN_NAME  = 'Super Admin';

async function main() {
  const uri = `${process.env.MONGO_URI}/${process.env.DB_NAME}`;
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  let user = await User.findOne({ phone: SUPER_ADMIN_PHONE });

  if (user) {
    // Upgrade existing user to admin
    user.role  = 'admin';
    user.name  = user.name || SUPER_ADMIN_NAME;
    user.isActive = true;
    await user.save();
    console.log(`✅ Existing user updated → role: admin  (id: ${user._id})`);
  } else {
    user = await User.create({
      phone: SUPER_ADMIN_PHONE,
      name:  SUPER_ADMIN_NAME,
      role:  'admin',
      isActive: true,
      isPhoneVerified: true,
    });
    console.log(`✅ Superadmin created  → id: ${user._id}`);
  }

  console.log(`\nPhone : ${user.phone}`);
  console.log(`Role  : ${user.role}`);
  console.log(`\nLogin at admin-app → phone: ${SUPER_ADMIN_PHONE}`);
  await mongoose.disconnect();
}

main().catch(err => { console.error(err); process.exit(1); });
