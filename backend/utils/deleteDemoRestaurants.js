require('dotenv').config();
const mongoose = require('mongoose');
const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');

const DEMO_RESTAURANT_NAMES = ['Spice Paradise', 'Pizza Corner'];

async function main() {
  const uri = `${process.env.MONGO_URI}/${process.env.DB_NAME}`;
  await mongoose.connect(uri);

  const restaurants = await Restaurant.find(
    { name: { $in: DEMO_RESTAURANT_NAMES } },
    { _id: 1, name: 1 }
  );

  const restaurantIds = restaurants.map((restaurant) => restaurant._id);

  const menuResult = await MenuItem.deleteMany({ restaurant: { $in: restaurantIds } });
  const restaurantResult = await Restaurant.deleteMany({ _id: { $in: restaurantIds } });

  const remainingRestaurants = await Restaurant.find({}, { name: 1, status: 1 }).sort({ createdAt: -1 });

  console.log(`Deleted demo restaurants: ${restaurantResult.deletedCount}`);
  console.log(`Deleted demo menu items: ${menuResult.deletedCount}`);
  console.log(`Remaining restaurants: ${remainingRestaurants.length}`);
  remainingRestaurants.forEach((restaurant, index) => {
    console.log(`${index + 1}. ${restaurant.name} | ${restaurant.status}`);
  });

  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
