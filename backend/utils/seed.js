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
    
    let admin = await User.findOne({ email: adminEmail });
    
    if (!admin) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      admin = new User({
        name: 'Admin',
        email: adminEmail,
        password: hashedPassword,
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
    
    const restaurantCount = await Restaurant.countDocuments({ owner: restaurantOwner._id });
    
    if (restaurantCount === 0) {
      const restaurant1 = new Restaurant({
        name: 'Spice Paradise',
        description: 'Authentic Indian cuisine with a modern twist',
        owner: restaurantOwner._id,
        email: 'spiceparadise@test.com',
        phone: '9876543212',
        address: {
          street: '456 Food Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400002'
        },
        location: 'Bandra, Mumbai',
        cuisineType: ['Indian', 'North Indian', 'Mughlai'],
        status: 'approved',
        rating: 4.5,
        totalReviews: 125,
        openingHours: '10:00 AM - 11:00 PM',
        minimumOrder: 150,
        deliveryTime: '30-40 mins'
      });
      await restaurant1.save();
      
      const menuItems1 = [
        {
          name: 'Butter Chicken',
          description: 'Tender chicken in rich tomato-based gravy',
          restaurant: restaurant1._id,
          price: 320,
          category: 'Main Course',
          isVegetarian: false,
          rating: 4.7,
          totalReviews: 89
        },
        {
          name: 'Paneer Tikka Masala',
          description: 'Grilled cottage cheese in spicy gravy',
          restaurant: restaurant1._id,
          price: 280,
          category: 'Main Course',
          isVegetarian: true,
          rating: 4.5,
          totalReviews: 76
        },
        {
          name: 'Garlic Naan',
          description: 'Freshly baked bread with garlic and butter',
          restaurant: restaurant1._id,
          price: 60,
          category: 'Breads',
          isVegetarian: true,
          rating: 4.8,
          totalReviews: 145
        },
        {
          name: 'Biryani',
          description: 'Aromatic basmati rice with chicken and spices',
          restaurant: restaurant1._id,
          price: 350,
          category: 'Rice',
          isVegetarian: false,
          rating: 4.6,
          totalReviews: 98
        }
      ];
      
      await MenuItem.insertMany(menuItems1);
      
      const restaurant2 = new Restaurant({
        name: 'Pizza Corner',
        description: 'Wood-fired pizzas and Italian delights',
        owner: restaurantOwner._id,
        email: 'pizzacorner@test.com',
        phone: '9876543213',
        address: {
          street: '789 Pizza Lane',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400003'
        },
        location: 'Andheri, Mumbai',
        cuisineType: ['Italian', 'Pizza', 'Fast Food'],
        status: 'approved',
        rating: 4.3,
        totalReviews: 87,
        openingHours: '11:00 AM - 12:00 AM',
        minimumOrder: 200,
        deliveryTime: '25-35 mins'
      });
      await restaurant2.save();
      
      const menuItems2 = [
        {
          name: 'Margherita Pizza',
          description: 'Classic tomato sauce, mozzarella, and basil',
          restaurant: restaurant2._id,
          price: 299,
          category: 'Pizza',
          isVegetarian: true,
          rating: 4.4,
          totalReviews: 67
        },
        {
          name: 'Chicken BBQ Pizza',
          description: 'BBQ chicken, onions, and cheese',
          restaurant: restaurant2._id,
          price: 399,
          category: 'Pizza',
          isVegetarian: false,
          rating: 4.6,
          totalReviews: 54
        },
        {
          name: 'Garlic Bread',
          description: 'Crispy bread with garlic butter',
          restaurant: restaurant2._id,
          price: 120,
          category: 'Sides',
          isVegetarian: true,
          rating: 4.2,
          totalReviews: 43
        }
      ];
      
      await MenuItem.insertMany(menuItems2);
      
      console.log('Sample restaurants and menu items created');
    }
    
    const credentialsPath = path.join(__dirname, '../../memory/test_credentials.md');
    const credentialsContent = `# Test Credentials\n\n## Admin Account\n- Email: ${adminEmail}\n- Password: ${adminPassword}\n- Role: admin\n\n## Test Customer\n- Email: customer@test.com\n- Password: customer123\n- Role: customer\n\n## Restaurant Owner\n- Email: owner@test.com\n- Password: owner123\n- Role: restaurant_owner\n\n## API Endpoints\n- Register: POST /api/auth/register\n- Login: POST /api/auth/login\n- Profile: GET /api/auth/profile (requires auth)\n`;
    
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