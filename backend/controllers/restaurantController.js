const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');

const getRestaurants = async (req, res, next) => {
  try {
    const { page = 1, limit = 12, location, search, cuisineType } = req.query;
    
    const query = { status: 'approved', isActive: true };
    
    if (location) {
      query.location = { $regex: location, $options: 'i' };
    }
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (cuisineType) {
      query.cuisineType = cuisineType;
    }
    
    const skip = (page - 1) * limit;
    
    const [restaurants, total] = await Promise.all([
      Restaurant.find(query)
        .populate('owner', 'name email')
        .skip(skip)
        .limit(Number(limit))
        .sort({ rating: -1, createdAt: -1 }),
      Restaurant.countDocuments(query)
    ]);
    
    res.json({
      restaurants,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

const getRestaurantById = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id)
      .populate('owner', 'name email phone');
    
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }
    
    const menuItems = await MenuItem.find({ 
      restaurant: restaurant._id, 
      isAvailable: true 
    }).sort({ category: 1, name: 1 });
    
    res.json({ restaurant, menuItems });
  } catch (error) {
    next(error);
  }
};

const createRestaurant = async (req, res, next) => {
  try {
    const restaurantData = {
      ...req.body,
      owner: req.user._id,
      status: 'pending'
    };
    
    const restaurant = new Restaurant(restaurantData);
    await restaurant.save();
    
    res.status(201).json({
      message: 'Restaurant registration submitted. Awaiting admin approval.',
      restaurant
    });
  } catch (error) {
    next(error);
  }
};

const updateRestaurant = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findOne({
      _id: req.params.id,
      owner: req.user._id
    });
    
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found or unauthorized' });
    }
    
    const { name, description, phone, address, location, cuisineType, openingHours, minimumOrder, deliveryTime } = req.body;
    
    Object.assign(restaurant, {
      name: name || restaurant.name,
      description: description || restaurant.description,
      phone: phone || restaurant.phone,
      address: address || restaurant.address,
      location: location || restaurant.location,
      cuisineType: cuisineType || restaurant.cuisineType,
      openingHours: openingHours || restaurant.openingHours,
      minimumOrder: minimumOrder !== undefined ? minimumOrder : restaurant.minimumOrder,
      deliveryTime: deliveryTime || restaurant.deliveryTime
    });
    
    await restaurant.save();
    
    res.json({ message: 'Restaurant updated successfully', restaurant });
  } catch (error) {
    next(error);
  }
};

const getMyRestaurants = async (req, res, next) => {
  try {
    const restaurants = await Restaurant.find({ owner: req.user._id })
      .sort({ createdAt: -1 });
    
    res.json({ restaurants });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getRestaurants,
  getRestaurantById,
  createRestaurant,
  updateRestaurant,
  getMyRestaurants
};