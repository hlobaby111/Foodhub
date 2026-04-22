const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');
const fs = require('fs');
const path = require('path');

const seedDatabase = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@foodhub.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin@123';
    const adminPhone = process.env.ADMIN_PHONE || '9876500000';
    
    let admin = await User.findOne({ email: adminEmail });
    
    if (!admin) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      admin = new User({
        name: 'Admin',
        email: adminEmail,
        password: hashedPassword,
        phone: adminPhone,
        role: 'admin'
      });
      await admin.save();
      console.log('Admin user created');
    }
    
    let testCustomer = await User.findOne({ email: 'customer@test.com' });
    if (!testCustomer) {
      const hashedPassword = await bcrypt.hash('customer123', 10);
      testCustomer = new User({
        name: 'Test Customer',
        email: 'customer@test.com',
        password: hashedPassword,
        phone: '9876543210',
        role: 'customer',
        address: {
          street: '123 Main Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001'
        }
      });
      await testCustomer.save();
      console.log('Test customer created');
    }
    
    let restaurantOwner = await User.findOne({ email: 'owner@test.com' });
    if (!restaurantOwner) {
      const hashedPassword = await bcrypt.hash('owner123', 10);
      restaurantOwner = new User({
        name: 'Restaurant Owner',
        email: 'owner@test.com',
        password: hashedPassword,
        phone: '9876543211',
        role: 'restaurant_owner'
      });
      await restaurantOwner.save();
      console.log('Test restaurant owner created');
    }
    
    // Delivery Partner
    let deliveryPartner = await User.findOne({ email: 'delivery@test.com' });
    if (!deliveryPartner) {
      const hashedPassword = await bcrypt.hash('delivery123', 10);
      deliveryPartner = new User({
        name: 'Delivery Partner',
        email: 'delivery@test.com',
        password: hashedPassword,
        phone: '9876543299',
        role: 'delivery_partner',
        isAvailable: true
      });
      await deliveryPartner.save();
      console.log('Test delivery partner created');
    }
    
    const credentialsDir = path.join(__dirname, '../memory');
    if (!fs.existsSync(credentialsDir)) {
      fs.mkdirSync(credentialsDir, { recursive: true });
    }
    const credentialsPath = path.join(credentialsDir, 'test_credentials.md');
    const credentialsContent = `# Test Credentials\n\n## Admin Account\n- Email: ${adminEmail}\n- Password: ${adminPassword}\n- Role: admin\n\n## Test Customer\n- Email: customer@test.com\n- Password: customer123\n- Role: customer\n\n## Restaurant Owner\n- Email: owner@test.com\n- Password: owner123\n- Role: restaurant_owner\n\n## Delivery Partner\n- Email: delivery@test.com\n- Password: delivery123\n- Role: delivery_partner\n\n## API Endpoints\n- Register: POST /api/auth/register\n- Login: POST /api/auth/login\n- Addresses: GET/POST /api/addresses\n- Delivery: GET /api/delivery/dashboard\n- Search: GET /api/search?q=query\n- WebSocket: /api/socket.io\n`;
    
    fs.writeFileSync(credentialsPath, credentialsContent);
    console.log('Test credentials saved to /app/memory/test_credentials.md');

    // Seed banners
    const mongoose = require('mongoose');
    const db = mongoose.connection.db;
    const bannerCount = await db.collection('banners').countDocuments();
    if (bannerCount === 0) {
      await db.collection('banners').insertMany([
        {
          imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&h=400&fit=crop',
          title: 'Flat 50% OFF',
          subtitle: 'On your first order! Use code WELCOME50',
          link: '',
          order: 1,
          isActive: true,
          createdAt: new Date()
        },
        {
          imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=1200&h=400&fit=crop',
          title: 'Free Delivery',
          subtitle: 'On orders above Rs.299',
          link: '',
          order: 2,
          isActive: true,
          createdAt: new Date()
        },
        {
          imageUrl: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&h=400&fit=crop',
          title: 'Weekend Special',
          subtitle: 'Try our top-rated restaurants this weekend',
          link: '',
          order: 3,
          isActive: true,
          createdAt: new Date()
        }
      ]);
      console.log('Default banners created');
    }
  } catch (error) {
    console.error('Seed error:', error);
  }
};

module.exports = seedDatabase;